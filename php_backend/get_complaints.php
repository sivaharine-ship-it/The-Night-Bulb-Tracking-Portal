<?php

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

if ($_SERVER["REQUEST_METHOD"] !== "GET") {
    http_response_code(405);

    echo json_encode([
        "success" => false,
        "message" => "Only GET requests are allowed."
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

$sql = "SELECT
    id,
    complaint_id,
    citizen_name,
    citizen_email,
    citizen_phone,
    complaint_type,
    complaint_description,
    location,
    area,
    pincode,
    latitude,
    longitude,
    photo,
    status,
    priority,
    assigned_officer,
    officer_remarks,
    resolution_photo,
    resolved_at,
    created_at
FROM complaints
ORDER BY created_at DESC";

$result = $conn->query($sql);

if (!$result) {
    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Failed to fetch complaints.",
        "error" => $conn->error
    ]);

    $conn->close();
    exit;
}

$complaints = [];

while ($row = $result->fetch_assoc()) {

    /*
     * Convert the saved relative photo path to an absolute
     * URL. This allows the dashboard's existing mapping:
     *
     * photoPreview: c.photo || ''
     *
     * to use the image URL directly.
     */

    $photo = trim((string)($row["photo"] ?? ""));

    if ($photo !== "") {

        if (
            preg_match('/^https?:\/\//i', $photo) ||
            strpos($photo, "data:image/") === 0
        ) {
            // Keep an existing absolute URL or data URL.
            $row["photo"] = $photo;
        } else {
            // Remove leading slashes before building the URL.
            $relativePath = ltrim($photo, "/");

            $row["photo"] = "https://thenightbulbportal.infinityfree.me/" . $relativePath;
        }

    } else {
        $row["photo"] = "";
    }

    $complaints[] = $row;
}

echo json_encode([
    "success" => true,
    "count" => count($complaints),
    "complaints" => $complaints
]);

$conn->close();

?>
