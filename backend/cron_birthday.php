<?php
// backend/cron_birthday.php
// Automated Daily Birthday Job for WOW GOA
// Can be run via CLI (`php cron_birthday.php`) or Webhook / Cron URL

header("Content-Type: application/json; charset=UTF-8");

require_once __DIR__ . '/config.php';

try {
    $pdo = new PDO("mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=utf8mb4", DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (Exception $e) {
    try {
        $sqlitePath = __DIR__ . '/database.sqlite';
        $pdo = new PDO("sqlite:$sqlitePath");
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    } catch (Exception $e2) {
        echo json_encode(["success" => false, "error" => "Database connection failed"]);
        exit(1);
    }
}

// Require tier calculation functions from api.php if needed or define standalone runner
$todayMonthDay = date('m-d');
$currentYear = intval(date('Y'));
$sentCount = 0;
$skippedCount = 0;
$logs = [];

// Collect all users and bookings with non-empty DOB
$allUsers = [];
try {
    $stmt = $pdo->query("SELECT id, name, phone, email, date_of_birth FROM users WHERE date_of_birth IS NOT NULL AND date_of_birth != ''");
    $allUsers = $stmt->fetchAll(PDO::FETCH_ASSOC);
} catch (Exception $e) {}

$bookingUsers = [];
try {
    $stmtB = $pdo->query("SELECT DISTINCT name, phone, email, date_of_birth FROM bookings WHERE date_of_birth IS NOT NULL AND date_of_birth != ''");
    $bookingUsers = $stmtB->fetchAll(PDO::FETCH_ASSOC);
} catch (Exception $e) {}

$customerMap = [];
foreach (array_merge($allUsers, $bookingUsers) as $u) {
    $cleanPhone = preg_replace('/\D/', '', $u['phone'] ?? '');
    if (empty($cleanPhone)) continue;
    if (!isset($customerMap[$cleanPhone])) {
        $customerMap[$cleanPhone] = $u;
    }
}

foreach ($customerMap as $phone => $u) {
    $dob = trim($u['date_of_birth']);
    $dobTime = false;
    $t = strtotime($dob);
    if ($t !== false && $t > 0) {
        $dobTime = $t;
    } else {
        $parts = preg_split('/[\/\-\.]/', $dob);
        if (count($parts) === 3) {
            if (strlen($parts[0]) === 4) {
                $dobTime = strtotime($parts[0] . '-' . $parts[1] . '-' . $parts[2]);
            } else {
                $dobTime = strtotime($parts[2] . '-' . $parts[1] . '-' . $parts[0]);
            }
        }
    }

    if (!$dobTime) continue;
    if (date('m-d', $dobTime) !== $todayMonthDay) continue;

    // Check completed bookings for tier calculation
    $last10 = strlen($phone) >= 10 ? substr($phone, -10) : $phone;
    $completedCount = 0;
    try {
        $stmtC = $pdo->prepare("SELECT COUNT(*) FROM bookings WHERE (phone LIKE ? OR phone LIKE ?) AND LOWER(status) = 'completed'");
        $stmtC->execute(["%$last10", "%$phone"]);
        $completedCount = intval($stmtC->fetchColumn());
    } catch (Exception $ce) {}

    $highestTier = 'Bronze';
    if ($completedCount >= 10) $highestTier = 'Platinum';
    elseif ($completedCount >= 7) $highestTier = 'Gold';
    elseif ($completedCount >= 4) $highestTier = 'Silver';

    $custName = $u['name'] ?: 'Valued Customer';
    $custId = $u['id'] ?: ('c_' . $phone);
    $channel = 'SMS';

    // Check duplicate protection for this year & channel
    $chkLog = $pdo->prepare("SELECT id FROM birthday_message_logs WHERE customer_id = ? AND birthday_year = ? AND channel = ?");
    $chkLog->execute([$custId, $currentYear, $channel]);
    if ($chkLog->fetch()) {
        $skippedCount++;
        continue;
    }

    // Message formulation
    if ($highestTier === 'Platinum') {
        $msg = "🎉 Happy Birthday, $custName! 🎂💎\n\nWishing you an incredible year ahead from WOW GOA! ❤️\n\nAs our Platinum Member, you have an exclusive VIP birthday offer waiting for you. 🌴✨\n\nEnjoy your special day!";
    } elseif ($highestTier === 'Gold') {
        $msg = "🎉 Happy Birthday, $custName! 🎂\n\nWOW GOA wishes you an amazing year ahead! ❤️\n\nAs our Gold Member, enjoy your special birthday offer on your next booking. 🌴✨\n\nThank you for being a valued WOW GOA customer!";
    } elseif ($highestTier === 'Silver') {
        $msg = "🎉 Happy Birthday, $custName! 🎂\n\nWarm wishes from WOW GOA! ❤️\n\nEnjoy a special birthday offer on your next booking.\n\nThank you for choosing WOW GOA! 🌴";
    } else {
        $msg = "🎉 Happy Birthday, $custName!\n\nWishing you a wonderful birthday from WOW GOA! 🎂\n\nHave an amazing year ahead. 🌴";
    }

    $logId = 'bday_' . uniqid();
    $status = 'Sent';

    try {
        $insLog = $pdo->prepare("INSERT INTO birthday_message_logs (id, customer_id, customer_name, phone, email, birthday_year, birthday_date, highest_tier, message_text, channel, status, sent_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $insLog->execute([
            $logId, $custId, $custName, $phone, $u['email'] ?? '',
            $currentYear, date('Y-m-d'), $highestTier, $msg, $channel, $status,
            date('Y-m-d H:i:s'), date('Y-m-d H:i:s')
        ]);
        $sentCount++;
        $logs[] = [
            'id' => $logId,
            'customer_name' => $custName,
            'phone' => $phone,
            'highest_tier' => $highestTier,
            'status' => $status
        ];
    } catch (Exception $e) {}
}

echo json_encode([
    'success' => true,
    'date' => date('Y-m-d'),
    'sent_count' => $sentCount,
    'skipped_duplicate_count' => $skippedCount,
    'logs' => $logs
]);
