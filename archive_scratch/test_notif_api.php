<?php
// Simulate frontend calling pms_mark_notification_read and pms_delete_notification

function testApiCall($url, $payload, $token = null) {
    $headers = "Content-Type: application/json\r\n";
    if ($token) {
        $headers .= "Authorization: Bearer {$token}\r\n";
    }
    $opts = [
        'http' => [
            'method' => 'POST',
            'header' => $headers,
            'content' => json_encode($payload),
            'ignore_errors' => true
        ]
    ];
    $ctx = stream_context_create($opts);
    $response = file_get_contents($url, false, $ctx);
    return ['headers' => $http_response_header[0] ?? '', 'response' => json_decode($response, true) ?: $response];
}

$url = 'http://localhost:8000/api.php';
$markRead = testApiCall($url, [
    'action' => 'pms_mark_notification_read',
    'vendor_id' => 'u-5',
    'all' => true
], 'u-5');
echo "Mark Read with Auth Header (u-5):\n" . json_encode($markRead, JSON_PRETTY_PRINT) . "\n\n";

$deleteNotif = testApiCall($url, [
    'action' => 'pms_delete_notification',
    'vendor_id' => 'u-5',
    'all' => true
], 'u-5');
echo "Delete Notifications with Auth Header (u-5):\n" . json_encode($deleteNotif, JSON_PRETTY_PRINT) . "\n";
