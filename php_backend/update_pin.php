<?php

header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    echo json_encode([
        "success" => false,
        "message" => "Only POST requests are allowed"
    ]);
    exit;
}

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
    echo json_encode([
        "success" => false,
        "message" => "Database connection failed",
        "error" => $conn->connect_error
    ]);
    exit;
}

$data = json_decode(
    file_get_contents("php://input"),
    true
);

$complaintId = $data["complaintId"] ?? "";
$latitude = $data["latitude"] ?? null;
$longitude = $data["longitude"] ?? null;

if (
    empty($complaintId) ||
    $latitude === null ||
    $longitude === null
) {
    echo json_encode([
        "success" => false,
        "message" => "Complaint ID, latitude and longitude are required"
    ]);
    exit;
}

$stmt = $conn->prepare(
    "UPDATE complaints
     SET latitude = ?, longitude = ?
     WHERE complaint_id = ?"
);

$stmt->bind_param(
    "dds",
    $latitude,
    $longitude,
    $complaintId
);

if ($stmt->execute()) {

    if ($stmt->affected_rows > 0) {
        echo json_encode([
            "success" => true,
            "message" => "Map pin saved successfully",
            "updated_rows" => $stmt->affected_rows
        ]);


    } else {
        echo json_encode([
            "success" => false,
            "message" => "No complaint updated. Check the complaint ID or whether the coordinates changed.",
            "updated_rows" => 0
        ]);


}

} else {

    echo json_encode([
        "success" => false,
        "message" => "Failed to save map pin",
        "error" => $stmt->error
    ]);
}
$stmt->close();
$conn->close();

?>