
<?php
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

header("Content-Type: application/json");

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode([
        "success" => false,
        "message" => "POST method required."
    ]);
    exit;
}

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

$complaintId = trim($_POST["complaintId"] ?? "");
$details = trim($_POST["resolutionDetails"] ?? "");

if ($complaintId === "" || $details === "") {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Complaint ID and resolution details are required."
    ]);
    exit;
}

if (!isset($_FILES["resolutionPhoto"]) ||
    $_FILES["resolutionPhoto"]["error"] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Please upload an after-repair photo."
    ]);
    exit;
}

$file = $_FILES["resolutionPhoto"];

if ($file["size"] > 5 * 1024 * 1024) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Photo must be 5 MB or smaller."
    ]);
    exit;
}

$imageInfo = getimagesize($file["tmp_name"]);
$allowedTypes = [
    IMAGETYPE_JPEG => "jpg",
    IMAGETYPE_PNG => "png",
    IMAGETYPE_WEBP => "webp"
];
error_log("Detected image type: " . $imageInfo[2]);

if (!isset($allowedTypes[$imageInfo[2]])) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Unsupported image format. Please upload JPG, PNG or WEBP."
    ]);
    exit;
}

$stmt = $conn->prepare(
    "SELECT id FROM complaints WHERE complaint_id = ?"
);
$stmt->bind_param("s", $complaintId);
$stmt->execute();
$stmt->store_result();

if ($stmt->num_rows === 0) {
    http_response_code(404);
    echo json_encode([
        "success" => false,
        "message" => "Complaint not found."
    ]);
    $stmt->close();
    $conn->close();
    exit;
}

$stmt->close();

$uploadDir = __DIR__ . "/resolution_photos/";

if (!is_dir($uploadDir) &&
    !mkdir($uploadDir, 0755, true)) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Could not create photo folder."
    ]);
    $conn->close();
    exit;
}

$extension = $allowedTypes[$imageInfo[2]];
$fileName = bin2hex(random_bytes(16)) . "." . $extension;
$filePath = $uploadDir . $fileName;

if (!move_uploaded_file($file["tmp_name"], $filePath)) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Photo upload failed."
    ]);
    $conn->close();
    exit;
}

$relativePath = "resolution_photos/" . $fileName;

$stmt = $conn->prepare(
    "UPDATE complaints
     SET resolution_details = ?,
         resolution_photo = ?,
         resolved_at = NOW(),
         status = 'Resolved'
     WHERE complaint_id = ?"
);

$stmt->bind_param(
    "sss",
    $details,
    $relativePath,
    $complaintId
);

if ($stmt->execute() && $stmt->affected_rows >= 0) {
    echo json_encode([
        "success" => true,
        "message" => "Resolution details and photo saved successfully.",
        "complaintId" => $complaintId
    ]);
} else {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Could not save resolution details."
    ]);
    if (file_exists($filePath)) {
        unlink($filePath);
    }
}

$stmt->close();
$conn->close();
?>
