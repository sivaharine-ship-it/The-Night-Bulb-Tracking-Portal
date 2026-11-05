
<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

require_once __DIR__ . "/db.php";

$data = json_decode(file_get_contents("php://input"), true);

$complaintId = trim($data["complaintId"] ?? "");
$officerName = trim($data["officerName"] ?? "");
$officerRemarks = trim($data["officerRemarks"] ?? "");

if ($complaintId === "" || $officerName === "") {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Complaint ID and officer name are required."
    ]);
    exit;
}

try {
    $stmt = $conn->prepare(
    "UPDATE complaints
     SET assigned_officer = ?,
         assigned_at = NOW(),
         officer_remarks = ?
     WHERE complaint_id = ?"
);

$stmt->bind_param(
    "sss",
    $officerName,
    $officerRemarks,
    $complaintId
);

$stmt->execute();

if ($stmt->affected_rows === 0) {
    $check = $conn->prepare(
        "SELECT id, assigned_officer, officer_remarks
         FROM complaints
         WHERE complaint_id = ?"
    );

    $check->bind_param("s", $complaintId);
    $check->execute();
    $result = $check->get_result();
    $existing = $result->fetch_assoc();

    if (!$existing) {
        http_response_code(404);
        echo json_encode([
            "success" => false,
            "message" => "Complaint not found."
        ]);
        exit;
    }
}

$stmt->close();
    

    echo json_encode([
        "success" => true,
        "message" => "Officer assigned successfully."
    ]);

    $stmt->close();
    $conn->close();

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Failed to assign officer."
    ]);
}
?>
