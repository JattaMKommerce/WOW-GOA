<?php
// backend/test_cashback_wallet.php
// Automated Verification Suite for WOW GOA Customer Cashback Wallet Engine

ini_set('display_errors', '1');
error_reporting(E_ALL);

require_once __DIR__ . '/config.php';

// Setup SQLite or MySQL PDO for test execution
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

// Ensure database tables exist
$pdo->exec("CREATE TABLE IF NOT EXISTS customer_wallet_transactions (
    id VARCHAR(50) PRIMARY KEY,
    customer_id VARCHAR(50) NOT NULL,
    customer_phone VARCHAR(50) NOT NULL,
    booking_id VARCHAR(50) DEFAULT NULL,
    transaction_type VARCHAR(50) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    used_amount DECIMAL(10,2) DEFAULT 0.00,
    remaining_amount DECIMAL(10,2) NOT NULL,
    earned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'AVAILABLE',
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
)");

$testPhone = '9999888801';
$testCustId = 'c_9999888801';

// Clean test records
$pdo->prepare("DELETE FROM customer_wallet_transactions WHERE customer_phone LIKE ? OR customer_id = ?")->execute(["%$testPhone", $testCustId]);
$pdo->prepare("DELETE FROM bookings WHERE phone LIKE ?")->execute(["%$testPhone"]);

$_SERVER['REQUEST_METHOD'] = 'CLI';
$_SERVER['HTTP_HOST'] = 'localhost';
require_once __DIR__ . '/api.php';

echo "\n--- STARTING WOW GOA CASHBACK WALLET ENGINE TESTS ---\n\n";

$passCount = 0;
$failCount = 0;

function assertCondition($name, $cond, $details = '') {
    global $passCount, $failCount;
    if ($cond) {
        echo "✅ PASS: $name\n";
        $passCount++;
    } else {
        echo "❌ FAIL: $name | Details: $details\n";
        $failCount++;
    }
}

// ---------------------------------------------------------
// TEST 1: Initial Wallet Summary (Zero Balance)
// ---------------------------------------------------------
$summary1 = getCustomerWalletSummary($pdo, $testPhone, $testCustId);
assertCondition("Initial available balance is 0.00", floatval($summary1['available_balance']) === 0.00, "Balance: " . $summary1['available_balance']);

// ---------------------------------------------------------
// TEST 2: Cash Booking of ₹5,000 (Pending Cashback)
// ---------------------------------------------------------
$bId1 = 'TG-TEST-CASH-5000';
$pdo->prepare("INSERT INTO bookings (id, name, phone, email, total_amount, amount_paid, remaining_amount, total_paid, status, payment_status, payment_method, wallet_amount_used, cashback_earned, cashback_status) VALUES (?, 'Test Customer', ?, 'test@wowgoa.in', 5000, 5000, 0, 5000, 'Confirmed', 'Paid', 'CASH', 0.00, 500.00, 'Pending')")
    ->execute([$bId1, $testPhone]);

$summary2 = getCustomerWalletSummary($pdo, $testPhone, $testCustId);
assertCondition("Cash booking creation leaves available balance 0.00 while Pending", floatval($summary2['available_balance']) === 0.00);

// ---------------------------------------------------------
// TEST 3: Cash Booking Status updated to 'Completed' (10% Cashback Credited)
// ---------------------------------------------------------
$pdo->prepare("UPDATE bookings SET status = 'Completed' WHERE id = ?")->execute([$bId1]);
$creditRes1 = creditBookingCashback($pdo, $bId1);

assertCondition("creditBookingCashback succeeded for Cash booking", !empty($creditRes1['success']), json_encode($creditRes1));
assertCondition("Cashback amount is exactly 10% of ₹5,000 = ₹500", floatval($creditRes1['cashback_amount']) === 500.00);

$summary3 = getCustomerWalletSummary($pdo, $testPhone, $testCustId);
assertCondition("Wallet available balance is now ₹500.00", floatval($summary3['available_balance']) === 500.00, "Balance: " . $summary3['available_balance']);
assertCondition("Nearest expiring countdown reflects 30 days window", !empty($summary3['nearest_expiring']) && $summary3['nearest_expiring']['amount'] == 500);

// ---------------------------------------------------------
// TEST 4: Anti-Duplicate Protection (Triggering Completed again)
// ---------------------------------------------------------
$dupCreditRes = creditBookingCashback($pdo, $bId1);
assertCondition("Duplicate creditBookingCashback call is suppressed (anti-duplicate)", $dupCreditRes === false);

$summary4 = getCustomerWalletSummary($pdo, $testPhone, $testCustId);
assertCondition("Wallet balance remains strictly ₹500.00 without double-crediting", floatval($summary4['available_balance']) === 500.00);

// ---------------------------------------------------------
// TEST 5: Cash + Wallet Booking (₹4,000 Booking using ₹500 Wallet, Paying ₹3,500 Cash)
// ---------------------------------------------------------
$bId2 = 'TG-TEST-CASH-WALLET-4000';
// Deduct ₹500 from wallet for booking 2
deductCustomerWallet($pdo, $testPhone, $testCustId, 500.00, $bId2);

$pdo->prepare("INSERT INTO bookings (id, name, phone, email, total_amount, amount_paid, remaining_amount, total_paid, status, payment_status, payment_method, wallet_amount_used, cashback_earned, cashback_status) VALUES (?, 'Test Customer', ?, 'test@wowgoa.in', 4000, 3500, 0, 4000, 'Confirmed', 'Paid', 'CASH', 500.00, 350.00, 'Pending')")
    ->execute([$bId2, $testPhone]);

$summary5 = getCustomerWalletSummary($pdo, $testPhone, $testCustId);
assertCondition("Wallet available balance becomes 0.00 after ₹500 deduction", floatval($summary5['available_balance']) === 0.00);
assertCondition("Total used metric shows ₹500.00", floatval($summary5['total_used']) === 500.00);

// Complete Booking 2: Eligible paid amount is ₹4,000 - ₹500 = ₹3,500 -> 10% = ₹350 Cashback
$pdo->prepare("UPDATE bookings SET status = 'Completed' WHERE id = ?")->execute([$bId2]);
$creditRes2 = creditBookingCashback($pdo, $bId2);

assertCondition("Booking 2 cashback credited successfully", !empty($creditRes2['success']));
assertCondition("Cashback is 10% on actual cash paid ₹3,500 = ₹350.00", floatval($creditRes2['cashback_amount']) === 350.00, "Amt: " . $creditRes2['cashback_amount']);

$summary6 = getCustomerWalletSummary($pdo, $testPhone, $testCustId);
assertCondition("Wallet available balance is now ₹350.00", floatval($summary6['available_balance']) === 350.00);
assertCondition("Total lifetime earned is ₹500 + ₹350 = ₹850.00", floatval($summary6['total_earned']) === 850.00);

// ---------------------------------------------------------
// TEST 6: Online Payment Booking (₹2,000 Online Payment)
// ---------------------------------------------------------
$bId3 = 'TG-TEST-ONLINE-2000';
$pdo->prepare("INSERT INTO bookings (id, name, phone, email, total_amount, amount_paid, remaining_amount, total_paid, status, payment_status, payment_method, wallet_amount_used, cashback_earned, cashback_status) VALUES (?, 'Test Customer', ?, 'test@wowgoa.in', 2000, 2000, 0, 2000, 'Completed', 'Paid', 'Online Payment', 0.00, 200.00, 'Pending')")
    ->execute([$bId3, $testPhone]);

$creditRes3 = creditBookingCashback($pdo, $bId3);
assertCondition("Online booking cashback credited successfully", !empty($creditRes3['success']));
assertCondition("Online booking cashback is 10% of ₹2,000 = ₹200.00", floatval($creditRes3['cashback_amount']) === 200.00);

$summary7 = getCustomerWalletSummary($pdo, $testPhone, $testCustId);
assertCondition("Wallet available balance is now ₹350 + ₹200 = ₹550.00", floatval($summary7['available_balance']) === 550.00);

// ---------------------------------------------------------
// TEST 7: Reversal Audit Trail on Cancellation
// ---------------------------------------------------------
reverseBookingCashback($pdo, $bId3);
$summary8 = getCustomerWalletSummary($pdo, $testPhone, $testCustId);
assertCondition("Reversed booking removes ₹200 from available balance, returning to ₹350.00", floatval($summary8['available_balance']) === 350.00);

$revTx = $pdo->prepare("SELECT * FROM customer_wallet_transactions WHERE booking_id = ? AND transaction_type = 'CASHBACK_REVERSED'");
$revTx->execute([$bId3]);
$revRecord = $revTx->fetch(PDO::FETCH_ASSOC);
assertCondition("CASHBACK_REVERSED audit ledger entry exists", !empty($revRecord));

// ---------------------------------------------------------
// TEST 8: 30-Day Expiry Engine (processExpiredCashback)
// ---------------------------------------------------------
// Artificially expire the remaining ₹350 credit
$pdo->prepare("UPDATE customer_wallet_transactions SET expires_at = ? WHERE booking_id = ? AND transaction_type = 'CASHBACK_CREDIT'")
    ->execute([date('Y-m-d H:i:s', strtotime('-1 day')), $bId2]);

$expiredCount = processExpiredCashback($pdo);
assertCondition("processExpiredCashback marks expired records", $expiredCount >= 1);

$summary9 = getCustomerWalletSummary($pdo, $testPhone, $testCustId);
assertCondition("Available balance is 0.00 after 30-day expiry", floatval($summary9['available_balance']) === 0.00);
assertCondition("Total expired metric records ₹350.00", floatval($summary9['total_expired']) >= 350.00);

// Clean test records
$pdo->prepare("DELETE FROM customer_wallet_transactions WHERE customer_phone LIKE ? OR customer_id = ?")->execute(["%$testPhone", $testCustId]);
$pdo->prepare("DELETE FROM bookings WHERE phone LIKE ?")->execute(["%$testPhone"]);

echo "\n--- TEST RUN COMPLETE: $passCount PASSED, $failCount FAILED ---\n";
if ($failCount > 0) exit(1);
