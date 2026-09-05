<?php
// Simulate GET /api.php?resource=hotels
$_SERVER['REQUEST_METHOD'] = 'GET';
$_GET['resource'] = 'hotels';

ob_start();
include __DIR__ . '/../backend/api.php';
$output = ob_get_clean();

echo "=== API.PHP OUTPUT FOR resource=hotels ===\n";
$data = json_decode($output, true);
if (is_array($data)) {
    echo "Count of hotels returned: " . count($data) . "\n";
    foreach ($data as $h) {
        echo " - " . ($h['name'] ?? 'Unknown') . " (" . ($h['location'] ?? '') . ")\n";
    }
} else {
    echo "Raw output (first 300 chars): " . substr($output, 0, 300) . "\n";
}
