
<?php

header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

// Handle CORS preflight request
if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

// Allow only POST requests
if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode([
        "success" => false,
        "message" => "Only POST requests are allowed"
    ]);
    exit;
}

// Database connection
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
    echo json_encode([
        "success" => false,
        "message" => "Database connection failed"
    ]);
    exit;
}

$conn->set_charset("utf8mb4");

// Read JSON request
$rawData = file_get_contents("php://input");
$data = json_decode($rawData, true);

if (!is_array($data)) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Invalid JSON request"
    ]);
    $conn->close();
    exit;
}

// Get request values
$complaintId = trim((string)($data["complaintId"] ?? ""));
$status = trim((string)($data["status"] ?? ""));
$priority = trim((string)($data["priority"] ?? ""));

// Match the status options used in OfficerDashboard.jsx
$allowedStatuses = [
    "Registered",
    "Verified",
    "Assigned",
    "In Progress",
    "Repair",
    "Resolved"
];

$allowedPriorities = [
    "Low",
    "Medium",
    "High"
];

// Validate inputs
if (
    $complaintId === "" ||
    !in_array($status, $allowedStatuses, true) ||
    !in_array($priority, $allowedPriorities, true)
) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Valid complaint ID, status and priority are required"
    ]);
    $conn->close();
    exit;
}

// Check whether the complaint exists
$checkStmt = $conn->prepare(
    "SELECT complaint_id
     FROM complaints
     WHERE complaint_id = ?
     LIMIT 1"
);

if (!$checkStmt) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Could not prepare complaint lookup"
    ]);
    $conn->close();
    exit;
}

$checkStmt->bind_param("s", $complaintId);

if (!$checkStmt->execute()) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Could not check complaint record"
    ]);
    $checkStmt->close();
    $conn->close();
    exit;
}

$result = $checkStmt->get_result();
$complaintExists = $result->num_rows > 0;

$checkStmt->close();

if (!$complaintExists) {
    http_response_code(404);
    echo json_encode([
        "success" => false,
        "message" => "Complaint ID not found in the database",
        "complaintId" => $complaintId
    ]);
    $conn->close();
    exit;
}

// Update status and priority
$stmt = $conn->prepare(
    "UPDATE complaints
     SET status = ?, priority = ?
     WHERE complaint_id = ?"
);

if (!$stmt) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Could not prepare database update"
    ]);
    $conn->close();
    exit;
}

$stmt->bind_param(
    "sss",
    $status,
    $priority,
    $complaintId
);

if ($stmt->execute()) {
    echo json_encode([
        "success" => true,
        "message" => "Complaint updated successfully",
        "complaintId" => $complaintId,
        "status" => $status,
        "priority" => $priority
    ]);
} else {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Failed to update complaint"
    ]);
}

$stmt->close();
$conn->close();

?>

