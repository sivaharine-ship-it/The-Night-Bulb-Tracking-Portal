
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

$email = trim($data["email"] ?? "");
$password = $data["password"] ?? "";

if ($email === "" || $password === "") {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Email and password are required"
    ]);
    $conn->close();
    exit;
}

$stmt = $conn->prepare(
    "SELECT id, name, email, phone, password
     FROM citizens
     WHERE email = ?
     LIMIT 1"
);

$stmt->bind_param("s", $email);
$stmt->execute();

$result = $stmt->get_result();

if ($user = $result->fetch_assoc()) {

    if (password_verify($password, $user["password"])) {

        unset($user["password"]);

        echo json_encode([
            "success" => true,
            "message" => "Login successful",
            "user" => $user
        ]);

    } else {

        http_response_code(401);
        echo json_encode([
            "success" => false,
            "message" => "Invalid email or password. Please try again."
        ]);

    }

} else {

    http_response_code(401);
    echo json_encode([
        "success" => false,
        "message" => "Invalid email or password. Please try again."
    ]);

}

$stmt->close();
$conn->close();
?>
