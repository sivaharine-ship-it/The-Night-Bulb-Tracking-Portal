
<?php

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode([
        "success" => false,
        "message" => "Only POST requests are allowed"
    ]);
    exit;
}

$conn = new mysqli("localhost", "root", "", "night_bulb_portal");

if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Database connection failed"
    ]);
    exit;
}

$conn->set_charset("utf8mb4");

$data = json_decode(file_get_contents("php://input"), true);

$name = trim($data["name"] ?? "");
$email = trim($data["email"] ?? "");
$phone = trim($data["phone"] ?? "");
$password = $data["password"] ?? "";

if (
    $name === "" ||
    !filter_var($email, FILTER_VALIDATE_EMAIL) ||
    $phone === "" ||
    strlen($password) < 6
) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Enter valid details. Password must contain at least 6 characters."
    ]);
    $conn->close();
    exit;
}

$check = $conn->prepare(
    "SELECT id FROM citizens WHERE email = ?"
);
$check->bind_param("s", $email);
$check->execute();
$check->store_result();

if ($check->num_rows > 0) {
    http_response_code(409);
    echo json_encode([
        "success" => false,
        "message" => "An account with this email already exists. Please login."
    ]);
    $check->close();
    $conn->close();
    exit;
}
$check->close();

$hashedPassword = password_hash($password, PASSWORD_DEFAULT);

$stmt = $conn->prepare(
    "INSERT INTO citizens (name, email, phone, password)
     VALUES (?, ?, ?, ?)"
);

$stmt->bind_param(
    "ssss",
    $name,
    $email,
    $phone,
    $hashedPassword
);

if ($stmt->execute()) {
    echo json_encode([
        "success" => true,
        "message" => "Account created successfully. Please login."
    ]);
} else {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Registration failed. Please try again."
    ]);
}

$stmt->close();
$conn->close();
?>
