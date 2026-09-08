<?php
/**
 * test_http_notifications.php
 * Real HTTP test with busy_timeout and closed PDO handles
 */

function getDb() {
    $db = new PDO('sqlite:' . __DIR__ . '/../backend/database.sqlite');
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $db->exec('PRAGMA busy_timeout = 5000;');
    return $db;
}

// 1. Insert test notification
$db = getDb();
$now = date('Y-m-d H:i:s');
$stmt = $db->prepare("INSERT INTO notifications (user_id, role, type, title, message, reference_type, reference_id, is_read, created_at) VALUES ('c_8888899999', 'customer', 'booking_confirmed', 'HTTP Test Booking', 'Testing HTTP mark read', 'booking', 'TEST_HTTP_1', 0, ?)");
$stmt->execute([$now]);
$notifId = $db->lastInsertId();
$db = null; // Close connection

echo "1. Inserted test notification ID: $notifId\n";

// 2. Query via HTTP GET
$url = "http://localhost:8000/api.php?resource=notifications&phone=8888899999&role=customer";
$res = file_get_contents($url);
$data = json_decode($res, true);
$foundInGet = false;
if ($data && !empty($data['notifications'])) {
    foreach ($data['notifications'] as $n) {
        if (strval($n['id']) === strval($notifId)) {
            $foundInGet = true;
            break;
        }
    }
}
echo "2. HTTP GET notifications result: " . ($foundInGet ? "SUCCESS (found)" : "FAILED") . "\n";

// 3. Mark as read via HTTP POST
$markOpts = [
    'http' => [
        'method' => 'POST',
        'header' => "Content-Type: application/json\r\n",
        'content' => json_encode([
            'action' => 'mark_notification_read',
            'id' => $notifId,
            'role' => 'customer',
            'phone' => '8888899999',
            'all' => 0
        ])
    ]
];
$markRes = file_get_contents("http://localhost:8000/api.php?action=mark_notification_read", false, stream_context_create($markOpts));
$db = getDb();
$stmtChk = $db->prepare("SELECT is_read FROM notifications WHERE id = ?");
$stmtChk->execute([$notifId]);
$isRead = intval($stmtChk->fetchColumn());
$db = null;
echo "3. HTTP POST mark_notification_read result: " . ($isRead === 1 ? "SUCCESS (is_read=1)" : "FAILED (is_read=$isRead)") . "\n";

// 4. Clear notifications via HTTP POST
$clearOpts = [
    'http' => [
        'method' => 'POST',
        'header' => "Content-Type: application/json\r\n",
        'content' => json_encode([
            'action' => 'clear_notifications',
            'role' => 'customer',
            'phone' => '8888899999'
        ])
    ]
];
$clearRes = file_get_contents("http://localhost:8000/api.php?action=clear_notifications", false, stream_context_create($clearOpts));
$db = getDb();
$stmtChk2 = $db->prepare("SELECT COUNT(*) FROM notifications WHERE id = ?");
$stmtChk2->execute([$notifId]);
$remCount = intval($stmtChk2->fetchColumn());
echo "4. HTTP POST clear_notifications result: " . ($remCount === 0 ? "SUCCESS (deleted)" : "FAILED (count=$remCount)") . "\n";

// Clean up if anything remains
$db->prepare("DELETE FROM notifications WHERE id = ?")->execute([$notifId]);
$db = null;
echo "5. Cleanup complete.\n";
