
<?php

$host = "localhost";
$username = "root";
$password = "";
$database = "night_bulb_portal";

$conn = new mysqli(
    $host,
    $username,
    $password,
    $database
);

if ($conn->connect_error) {
    http_response_code(500);
    header("Content-Type: application/json");

    echo json_encode([
        "success" => false,
        "message" => "Database connection failed",
        "error" => $conn->connect_error
    ]);

    exit;
}

$conn->set_charset("utf8mb4");

?>