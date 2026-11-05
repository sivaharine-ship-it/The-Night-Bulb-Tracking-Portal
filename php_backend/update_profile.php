
<?php

header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        "success" => false,
        "message" => "POST method required."
    ]);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);

if (!is_array($data)) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Invalid JSON request."
    ]);
    exit;
}

$id = filter_var($data["id"] ?? null, FILTER_VALIDATE_INT);
$name = trim($data["name"] ?? "");
$email = trim($data["email"] ?? "");
$phone = trim($data["phone"] ?? "");

if (
    !$id ||
    $name === "" ||
    !filter_var($email, FILTER_VALIDATE_EMAIL) ||
    $phone === ""
) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Please enter valid name, email and phone details."
    ]);
    exit;
}

mysqli_report(MYSQLI_REPORT_OFF);

$conn = new mysqli(
    "localhost",
    "root",
    "",
    "night_bulb_portal"
);

if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Database connection failed."
    ]);
    exit;
}

$conn->set_charset("utf8mb4");

// Check whether the citizen account exists.
$account = $conn->prepare(
    "SELECT id FROM citizens WHERE id = ?"
);

if (!$account) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Could not check citizen account."
    ]);
    $conn->close();
    exit;
}

$account->bind_param("i", $id);
$account->execute();
$account->store_result();

if ($account->num_rows === 0) {
    http_response_code(404);
    echo json_encode([
        "success" => false,
        "message" => "Citizen account not found. Please log in again."
    ]);
    $account->close();
    $conn->close();
    exit;
}

$account->close();

// Prevent duplicate email addresses.
$check = $conn->prepare(
    "SELECT id FROM citizens WHERE email = ? AND id != ?"
);

if (!$check) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Could not validate email address."
    ]);
    $conn->close();
    exit;
}

$check->bind_param("si", $email, $id);
$check->execute();
$check->store_result();

if ($check->num_rows > 0) {
    http_response_code(409);
    echo json_encode([
        "success" => false,
        "message" => "This email address is already registered."
    ]);
    $check->close();
    $conn->close();
    exit;
}

$check->close();

// Update the citizen profile.
$stmt = $conn->prepare(
    "UPDATE citizens SET name = ?, email = ?, phone = ? WHERE id = ?"
);

if (!$stmt) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Could not prepare profile update."
    ]);
    $conn->close();
    exit;
}

$stmt->bind_param("sssi", $name, $email, $phone, $id);

if (!$stmt->execute()) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Could not update the profile."
    ]);
    $stmt->close();
    $conn->close();
    exit;
}

$stmt->close();

// Read the saved profile from the database.
$result = $conn->prepare(
    "SELECT id, name, email, phone FROM citizens WHERE id = ?"
);

if (!$result) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Profile updated, but could not retrieve saved details."
    ]);
    $conn->close();
    exit;
}

$result->bind_param("i", $id);
$result->execute();
$result->bind_result(
    $savedId,
    $savedName,
    $savedEmail,
    $savedPhone
);

if ($result->fetch()) {
    echo json_encode([
        "success" => true,
        "message" => "Profile updated successfully.",
        "user" => [
            "id" => $savedId,
            "name" => $savedName,
            "email" => $savedEmail,
            "phone" => $savedPhone
        ]
    ]);
} else {
    http_response_code(404);
    echo json_encode([
        "success" => false,
        "message" => "Citizen account not found."
    ]);
}

$result->close();
$conn->close();

?>
