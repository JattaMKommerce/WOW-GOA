<?php
// backend/test_wallet_discount_and_loyalty.php
// Verification of WOW GOA Wallet 10% Booking Benefit Cap and Loyalty Tier Benefits

require_once __DIR__ . '/config.php';

try {
    $pdo = new PDO("mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=utf8mb4", DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    echo "Connected to MySQL for tests.\n";
} catch (Exception $e) {
    $sqlitePath = __DIR__ . '/database.sqlite';
    $pdo = new PDO("sqlite:$sqlitePath");
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    echo "Connected to SQLite for tests.\n";
}

require_once __DIR__ . '/api.php';
require_once __DIR__ . '/BookingService.php';

function assertCondition($testName, $condition, $extra = '') {
    if ($condition) {
        echo "✅ PASS: $testName\n";
    } else {
        echo "❌ FAIL: $testName" . ($extra ? " ($extra)" : "") . "\n";
        exit(1);
    }
}

echo "\n--- STARTING WALLET 10% DISCOUNT & LOYALTY TIER ENGINE VERIFICATION ---\n\n";

// 1. Verify calculateCustomerTiers logic for all 4 tiers and benefits
$testPhone = '9999888877';
$cleanPhone = '9999888877';

// Clean test bookings for this phone
$pdo->prepare("DELETE FROM bookings WHERE phone LIKE ?")->execute(["%$testPhone"]);

// Test 0 Bookings
$t0 = calculateCustomerTiers($pdo, $testPhone);
assertCondition("0 completed bookings shows Bronze", $t0['car']['tier'] === 'Bronze');
assertCondition("0 completed bookings shows 1 booking away from Bronze", $t0['car']['remaining'] === 1);
assertCondition("0 completed bookings next perk is Standard 10% cashback", $t0['car']['next_perk'] === 'Standard 10% cashback');

// Insert 1 completed car booking (Bronze)
$pdo->prepare("INSERT INTO bookings (id, name, phone, email, total_amount, amount_paid, remaining_amount, total_paid, status, payment_status, type, created_at) VALUES ('T-CAR-1', 'Loyalty User', ?, 'loyalty@wowgoa.in', 3000, 3000, 0, 3000, 'Completed', 'Paid', 'car', '2026-09-05 12:00:00')")->execute([$testPhone]);

$t1 = calculateCustomerTiers($pdo, $testPhone);
assertCondition("1 completed booking is Bronze Tier", $t1['car']['tier'] === 'Bronze');
assertCondition("Bronze tier has Standard 10% cashback benefit", in_array('Standard 10% cashback', $t1['car']['benefits']));
assertCondition("Bronze tier is 3 bookings away from Silver", $t1['car']['remaining'] === 3);
assertCondition("Bronze tier next unlock perk is Priority support", $t1['car']['next_perk'] === 'Priority support');
assertCondition("Next tier callout is formatted correctly", $t1['car']['next_tier_callout'] === '3 bookings away from Silver');

// Insert 3 more completed car bookings (Total 4 -> Silver)
$pdo->prepare("INSERT INTO bookings (id, name, phone, email, total_amount, amount_paid, remaining_amount, total_paid, status, payment_status, type, created_at) VALUES ('T-CAR-2', 'Loyalty User', ?, 'loyalty@wowgoa.in', 3000, 3000, 0, 3000, 'Completed', 'Paid', 'car', '2026-09-05 12:00:00')")->execute([$testPhone]);
$pdo->prepare("INSERT INTO bookings (id, name, phone, email, total_amount, amount_paid, remaining_amount, total_paid, status, payment_status, type, created_at) VALUES ('T-CAR-3', 'Loyalty User', ?, 'loyalty@wowgoa.in', 3000, 3000, 0, 3000, 'Completed', 'Paid', 'car', '2026-09-05 12:00:00')")->execute([$testPhone]);
$pdo->prepare("INSERT INTO bookings (id, name, phone, email, total_amount, amount_paid, remaining_amount, total_paid, status, payment_status, type, created_at) VALUES ('T-CAR-4', 'Loyalty User', ?, 'loyalty@wowgoa.in', 3000, 3000, 0, 3000, 'Completed', 'Paid', 'car', '2026-09-05 12:00:00')")->execute([$testPhone]);

$t4 = calculateCustomerTiers($pdo, $testPhone);
assertCondition("4 completed bookings is Silver Tier", $t4['car']['tier'] === 'Silver');
assertCondition("Silver tier includes Priority support", in_array('Priority support', $t4['car']['benefits']));
assertCondition("Silver tier is 3 bookings away from Gold", $t4['car']['remaining'] === 3);
assertCondition("Silver tier next unlock perk is ₹500 extra discount on eligible bookings", $t4['car']['next_perk'] === '₹500 extra discount on eligible bookings');

// Insert 3 more completed car bookings (Total 7 -> Gold)
for ($i = 5; $i <= 7; $i++) {
    $pdo->prepare("INSERT INTO bookings (id, name, phone, email, total_amount, amount_paid, remaining_amount, total_paid, status, payment_status, type, created_at) VALUES (?, 'Loyalty User', ?, 'loyalty@wowgoa.in', 3000, 3000, 0, 3000, 'Completed', 'Paid', 'car', '2026-09-05 12:00:00')")->execute(["T-CAR-$i", $testPhone]);
}

$t7 = calculateCustomerTiers($pdo, $testPhone);
assertCondition("7 completed bookings is Gold Tier", $t7['car']['tier'] === 'Gold');
assertCondition("Gold tier includes ₹500 extra discount on eligible bookings", in_array('₹500 extra discount on eligible bookings', $t7['car']['benefits']));
assertCondition("Gold tier is 3 bookings away from Platinum", $t7['car']['remaining'] === 3);
assertCondition("Gold tier next unlock perk is Free upgrade / VIP benefits", $t7['car']['next_perk'] === 'Free upgrade / VIP benefits');

// Insert 3 more completed car bookings (Total 10 -> Platinum)
for ($i = 8; $i <= 10; $i++) {
    $pdo->prepare("INSERT INTO bookings (id, name, phone, email, total_amount, amount_paid, remaining_amount, total_paid, status, payment_status, type, created_at) VALUES (?, 'Loyalty User', ?, 'loyalty@wowgoa.in', 3000, 3000, 0, 3000, 'Completed', 'Paid', 'car', '2026-09-05 12:00:00')")->execute(["T-CAR-$i", $testPhone]);
}

$t10 = calculateCustomerTiers($pdo, $testPhone);
assertCondition("10 completed bookings is Platinum Tier", $t10['car']['tier'] === 'Platinum');
assertCondition("Platinum tier is_platinum flag is true", $t10['car']['is_platinum'] === true);
assertCondition("Platinum tier includes Free upgrade / VIP benefits", in_array('Free upgrade / VIP benefits', $t10['car']['benefits']));
assertCondition("Platinum tier remaining is 0", $t10['car']['remaining'] === 0);

// 2. Verify Wallet 10% Booking Benefit Cap in BookingService
// Customer has ₹1,000 wallet balance
$testCustId = 'c_' . $testPhone;
$pdo->prepare("DELETE FROM customer_wallet_transactions WHERE customer_phone LIKE ?")->execute(["%$testPhone"]);
$nowStr = date('Y-m-d H:i:s');
$expStr = date('Y-m-d H:i:s', strtotime('+30 days'));
$pdo->prepare("INSERT INTO customer_wallet_transactions (id, customer_id, customer_phone, booking_id, transaction_type, amount, used_amount, remaining_amount, earned_at, expires_at, status, description, created_at, updated_at) VALUES ('cwt_init_1000', ?, ?, 'INIT', 'CASHBACK_CREDIT', 1000.00, 0.00, 1000.00, ?, ?, 'AVAILABLE', 'Initial Credit', ?, ?)")->execute([$testCustId, $testPhone, $nowStr, $expStr, $nowStr, $nowStr]);

// Customer creates booking of ₹4,000, but requests ₹1,000 wallet usage (which is 25%!)
// The BookingService MUST cap wallet usage to 10% = ₹400.00!
$payload = [
    'name' => 'Loyalty User',
    'phone' => $testPhone,
    'email' => 'loyalty@wowgoa.in',
    'total_amount' => 4000.00,
    'amount_paid' => 3600.00,
    'wallet_amount_used' => 1000.00, // Attempt 25%
    'type' => 'car',
    'item_id' => 'car-1',
    'item_name' => 'Thar Convertible',
    'status' => 'Confirmed',
    'payment_status' => 'Paid'
];

$res = BookingService::createBooking($pdo, $payload, ['role' => 'customer', 'tenant_id' => 'admin']);
assertCondition("Booking created successfully", !empty($res['success']));

$chkBooking = $pdo->prepare("SELECT total_amount, amount_paid, wallet_amount_used, remaining_amount, total_paid, cashback_earned FROM bookings WHERE id = ?");
$chkBooking->execute([$res['booking_id']]);
$bRow = $chkBooking->fetch(PDO::FETCH_ASSOC);

assertCondition("Wallet amount used is strictly capped at 10% of ₹4,000 = ₹400.00", floatval($bRow['wallet_amount_used']) === 400.00, "Used: " . $bRow['wallet_amount_used']);
assertCondition("Remaining amount is 0 (not left as pending)", floatval($bRow['remaining_amount']) === 0.00, "Remaining: " . $bRow['remaining_amount']);
assertCondition("Total paid accurately records ₹4,000.00", floatval($bRow['total_paid']) === 4000.00, "Total Paid: " . $bRow['total_paid']);

// Check that wallet was deducted by strictly ₹400, leaving ₹600 available
$walletSummary = getCustomerWalletSummary($pdo, $testPhone, $testCustId);
assertCondition("Wallet available balance is now ₹600.00 after 10% deduction", floatval($walletSummary['available_balance']) === 600.00, "Balance: " . $walletSummary['available_balance']);

// Cleanup test records
$pdo->prepare("DELETE FROM bookings WHERE phone LIKE ?")->execute(["%$testPhone"]);
$pdo->prepare("DELETE FROM customer_wallet_transactions WHERE customer_phone LIKE ?")->execute(["%$testPhone"]);

echo "\n--- ALL TESTS PASSED SUCCESSFULLY! ---\n\n";
