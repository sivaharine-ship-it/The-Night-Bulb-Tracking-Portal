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

mysqli_report(MYSQLI_REPORT_OFF);

function sendResponse($statusCode, $response)
{
    http_response_code($statusCode);
    echo json_encode($response);
    exit;
}

$conn = new mysqli(
    "localhost",
    "root",
    "",
    "night_bulb_portal"
);

if ($conn->connect_error) {
    sendResponse(500, [
        "success" => false,
        "message" => "Database connection failed"
    ]);
}

$conn->set_charset("utf8mb4");

$data = json_decode(file_get_contents("php://input"), true);

if (!is_array($data)) {
    $conn->close();

    sendResponse(400, [
        "success" => false,
        "message" => "Invalid JSON data"
    ]);
}

/* -----------------------------------------
   1. READ COMPLAINT DETAILS
----------------------------------------- */

$complaintId = trim((string)(
    $data["id"] ?? $data["complaint_id"] ?? ""
));

$citizenName = trim((string)(
    $data["citizen_name"] ??
    $data["citizenName"] ??
    "Unknown"
));

$citizenEmail = trim((string)(
    $data["citizen_email"] ??
    $data["email"] ??
    ""
));

$citizenPhone = trim((string)(
    $data["citizen_phone"] ??
    $data["phone"] ??
    ""
));

$complaintType = trim((string)(
    $data["type"] ??
    $data["complaintType"] ??
    $data["complaint_type"] ??
    ""
));

$description = trim((string)(
    $data["description"] ??
    $data["complaint_description"] ??
    ""
));

$location = trim((string)($data["location"] ?? ""));
$area = trim((string)($data["area"] ?? ""));
$pincode = trim((string)($data["pincode"] ?? ""));

$latitude = (
    isset($data["latitude"]) &&
    $data["latitude"] !== "" &&
    is_numeric($data["latitude"])
) ? (float)$data["latitude"] : null;

$longitude = (
    isset($data["longitude"]) &&
    $data["longitude"] !== "" &&
    is_numeric($data["longitude"])
) ? (float)$data["longitude"] : null;

$status = "Registered";
$priority = "Medium";

/* -----------------------------------------
   2. VALIDATE REQUIRED FIELDS
----------------------------------------- */

if (
    $complaintId === "" ||
    $complaintType === "" ||
    $description === "" ||
    $location === "" ||
    $area === "" ||
    $pincode === ""
) {
    $conn->close();

    sendResponse(400, [
        "success" => false,
        "message" => "Complaint ID, type, description, location, area and pincode are required."
    ]);
}

if (!preg_match('/^[0-9]{6}$/', $pincode)) {
    $conn->close();

    sendResponse(400, [
        "success" => false,
        "message" => "Pincode must contain exactly 6 digits."
    ]);
}

/* -----------------------------------------
   3. PROCESS AND SAVE COMPLAINT PHOTO
----------------------------------------- */

$photoInput = $data["photoPreview"]
    ?? $data["photo_data"]
    ?? $data["photo"]
    ?? null;

/*
 * The photo is sent as a Base64 data URL by React.
 * Save the decoded image to:
 * php_backend/uploads/complaint_photos/
 *
 * Store only the relative file path in MySQL.
 */

$photoPath = null;

if (
    is_string($photoInput) &&
    $photoInput !== ""
) {
    /*
     * Only accept image data URLs for new uploads.
     * Do not save a filename as if it were an image.
     */
    if (
        !preg_match(
            '/^data:image\/(jpeg|png|webp);base64,/',
            $photoInput,
            $matches
        )
    ) {
        $conn->close();

        sendResponse(400, [
            "success" => false,
            "message" => "Invalid photo data. Please upload a JPG, PNG or WebP image."
        ]);
    }

    $imageType = strtolower($matches[1]);

    $base64Data = substr(
        $photoInput,
        strpos($photoInput, ",") + 1
    );

    $imageBinary = base64_decode($base64Data, true);

    if ($imageBinary === false || strlen($imageBinary) === 0) {
        $conn->close();

        sendResponse(400, [
            "success" => false,
            "message" => "The uploaded photo could not be decoded."
        ]);
    }

    if (strlen($imageBinary) > 5 * 1024 * 1024) {
        $conn->close();

        sendResponse(400, [
            "success" => false,
            "message" => "Photo size must not exceed 5 MB."
        ]);
    }

    /*
     * Verify the actual file content, rather than
     * relying only on the filename or submitted MIME type.
     */
    if (!function_exists("finfo_open")) {
        $conn->close();

        sendResponse(500, [
            "success" => false,
            "message" => "PHP fileinfo extension is required to validate uploaded images."
        ]);
    }

    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $actualMime = finfo_buffer($finfo, $imageBinary);
    finfo_close($finfo);

    $allowedMimeTypes = [
        "jpeg" => "image/jpeg",
        "png" => "image/png",
        "webp" => "image/webp"
    ];

    if (
        !isset($allowedMimeTypes[$imageType]) ||
        $actualMime !== $allowedMimeTypes[$imageType]
    ) {
        $conn->close();

        sendResponse(400, [
            "success" => false,
            "message" => "The uploaded file is not a valid supported image."
        ]);
    }

    $uploadDirectory = __DIR__
        . DIRECTORY_SEPARATOR
        . "uploads"
        . DIRECTORY_SEPARATOR
        . "complaint_photos";

    if (
        !is_dir($uploadDirectory) &&
        !mkdir($uploadDirectory, 0755, true)
    ) {
        $conn->close();

        sendResponse(500, [
            "success" => false,
            "message" => "Could not create the complaint photo upload directory."
        ]);
    }

    $extensionMap = [
        "jpeg" => "jpg",
        "png" => "png",
        "webp" => "webp"
    ];

    $safeComplaintId = preg_replace(
        '/[^A-Za-z0-9_-]/',
        '_',
        $complaintId
    );

    $fileName = $safeComplaintId
        . "_"
        . bin2hex(random_bytes(8))
        . "."
        . $extensionMap[$imageType];

    $fullPhotoPath = $uploadDirectory
        . DIRECTORY_SEPARATOR
        . $fileName;

    if (file_put_contents($fullPhotoPath, $imageBinary) === false) {
        $conn->close();

        sendResponse(500, [
            "success" => false,
            "message" => "Could not save the complaint photo."
        ]);
    }

    $photoPath = "uploads/complaint_photos/" . $fileName;
}

/* -----------------------------------------
   4. INSERT COMPLAINT INTO MYSQL
----------------------------------------- */

$sql = "INSERT INTO complaints
(
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
    priority
)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

$stmt = $conn->prepare($sql);

if (!$stmt) {
    if ($photoPath !== null && isset($fullPhotoPath)) {
        if (is_file($fullPhotoPath)) {
            unlink($fullPhotoPath);
        }
    }

    $error = $conn->error;
    $conn->close();

    sendResponse(500, [
        "success" => false,
        "message" => "SQL preparation failed.",
        "error" => $error
    ]);
}

$stmt->bind_param(
    "sssssssssddsss",
    $complaintId,
    $citizenName,
    $citizenEmail,
    $citizenPhone,
    $complaintType,
    $description,
    $location,
    $area,
    $pincode,
    $latitude,
    $longitude,
    $photoPath,
    $status,
    $priority
);

if ($stmt->execute()) {
    $photoUrl = $photoPath !== null
        ? "https://thenightbulbportal.infinityfree.me/" . $photoPath
        : "";

    echo json_encode([
        "success" => true,
        "message" => "Complaint saved successfully.",
        "complaint_id" => $complaintId,
        "photo_url" => $photoUrl
    ]);
} else {
    /*
     * If the database insert fails, remove the photo
     * file created for this unsuccessful complaint.
     */
    if ($photoPath !== null && isset($fullPhotoPath)) {
        if (is_file($fullPhotoPath)) {
            unlink($fullPhotoPath);
        }
    }

    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Failed to save complaint.",
        "error" => $stmt->error
    ]);
}

$stmt->close();
$conn->close();

?>