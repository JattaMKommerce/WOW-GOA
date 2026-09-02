<?php
// backend/deploy_receiver.php
ini_set('display_errors', '0');
error_reporting(0);

$SECRET_KEY = 'WowGoaDeploySecret_2026_SecureKey';

$providedKey = $_SERVER['HTTP_X_DEPLOY_SECRET'] ?? $_GET['secret'] ?? '';

if (empty($providedKey) || !hash_equals($SECRET_KEY, $providedKey)) {
    http_response_code(403);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!isset($_FILES['package']) || $_FILES['package']['error'] !== UPLOAD_ERR_OK) {
        http_response_code(400);
        echo json_encode(['error' => 'No package uploaded or upload error']);
        exit;
    }

    $zipFile = $_FILES['package']['tmp_name'];
    $zip = new ZipArchive();
    
    if ($zip->open($zipFile) === TRUE) {
        $targetDir = dirname(__DIR__); // Root public_html
        $zip->extractTo($targetDir);
        $zip->close();
        
        echo json_encode(['success' => true, 'message' => 'Deployment deployed and extracted successfully!']);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to extract package']);
    }
    exit;
}

echo json_encode(['status' => 'Deploy endpoint is ready']);
