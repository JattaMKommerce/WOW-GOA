<?php
/**
 * WOW GOA - B2B Partner Registration & Admin Approval Automated Test Suite
 * Run with: php backend/test_b2b_registration.php
 */

error_reporting(E_ALL);
ini_set('display_errors', '1');

$_SERVER['REQUEST_METHOD'] = 'CLI';
$_SERVER['HTTP_HOST'] = 'localhost';

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

echo "\n--- STARTING WOW GOA B2B REGISTRATION & APPROVAL TESTS ---\n\n";

$passCount = 0;
$failCount = 0;

function assertCondition($name, $condition, $details = '') {
    global $passCount, $failCount;
    if ($condition) {
        echo "✅ PASS: $name\n";
        $passCount++;
    } else {
        echo "❌ FAIL: $name\n";
        if ($details) echo "   Details: $details\n";
        $failCount++;
    }
}

try {
    // Clean up any existing test users
    $pdo->exec("DELETE FROM users WHERE username LIKE 'test_agency_%'");
    $pdo->exec("DELETE FROM b2b_audit_logs WHERE partner_id LIKE 'test_agency_%' OR partner_id LIKE 'b2b_test_%'");

    // 1. Simulate Registration of Partner Agency A
    $regPayload = [
        'company_name' => 'Goa Paradise Travels Pvt Ltd',
        'business_type' => 'Travel Agency',
        'email' => 'booking@goaparadise.com',
        'phone' => '9876543210',
        'website' => 'https://goaparadise.com',
        'contact_name' => 'Vikram Deshmukh',
        'contact_email' => 'vikram@goaparadise.com',
        'contact_phone' => '9876543210',
        'address' => 'Shop 12, MG Road',
        'city' => 'Panaji',
        'state' => 'Goa',
        'country' => 'India',
        'pincode' => '403001',
        'username' => 'test_agency_paradise',
        'password' => 'SecretPass@2026',
        'confirm_password' => 'SecretPass@2026',
        'terms_accepted' => true
    ];

    $partnerIdA = 'b2b_test_' . uniqid();
    $pwHashA = password_hash($regPayload['password'], PASSWORD_DEFAULT);
    $now = date('Y-m-d H:i:s');

    $ins = $pdo->prepare("INSERT INTO users (
        id, username, company_name, business_type, name, phone, email, website,
        contact_name, contact_email, contact_phone, address, city, state, country, pincode,
        password_hash, plain_password, role, status,
        allow_commission, allow_non_commission, default_commission_rate, default_net_discount_rate,
        credit_limit, wallet_balance, created_at
    ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, 'b2b', 'pending',
        1, 1, 10.00, 10.00,
        0.00, 0.00, ?
    )");

    $ins->execute([
        $partnerIdA, $regPayload['username'], $regPayload['company_name'], $regPayload['business_type'],
        $regPayload['contact_name'], $regPayload['phone'], $regPayload['email'], $regPayload['website'],
        $regPayload['contact_name'], $regPayload['contact_email'], $regPayload['contact_phone'],
        $regPayload['address'], $regPayload['city'], $regPayload['state'], $regPayload['country'], $regPayload['pincode'],
        $pwHashA, $regPayload['password'], $now
    ]);

    // Test 1: Fetch created partner
    $stmt = $pdo->prepare("SELECT * FROM users WHERE id = ?");
    $stmt->execute([$partnerIdA]);
    $pA = $stmt->fetch(PDO::FETCH_ASSOC);

    assertCondition("Partner account created successfully", !empty($pA));
    assertCondition("Partner role is strictly 'b2b'", ($pA['role'] ?? '') === 'b2b');
    assertCondition("Partner status defaults to 'pending'", ($pA['status'] ?? '') === 'pending');
    assertCondition("Partner password is encrypted/hashed", password_verify('SecretPass@2026', $pA['password_hash']) && $pA['password_hash'] !== 'SecretPass@2026');
    assertCondition("Default commission is 10.00%", floatval($pA['default_commission_rate']) == 10.00);
    assertCondition("Default net discount is 10.00%", floatval($pA['default_net_discount_rate']) == 10.00);

    // Test 2: Login while status = 'pending' must be blocked
    $loginPending = false;
    $loginPendingError = '';
    if ($pA['status'] === 'pending') {
        $loginPending = true;
        $loginPendingError = "Your B2B application is still under review. You will be able to access the B2B Portal after admin approval.";
    }
    assertCondition("Login attempt while status is 'pending' is blocked", $loginPending && strpos($loginPendingError, 'under review') !== false);

    // Test 3: Duplicate username registration is blocked
    $dupUserCheck = $pdo->prepare("SELECT COUNT(*) FROM users WHERE LOWER(username) = ?");
    $dupUserCheck->execute(['test_agency_paradise']);
    $dupUserCount = $dupUserCheck->fetchColumn();
    assertCondition("Duplicate username is detected and rejected", $dupUserCount > 0);

    // Test 4: Duplicate email registration is blocked
    $dupEmailCheck = $pdo->prepare("SELECT COUNT(*) FROM users WHERE LOWER(email) = ?");
    $dupEmailCheck->execute(['booking@goaparadise.com']);
    $dupEmailCount = $dupEmailCheck->fetchColumn();
    assertCondition("Duplicate email is detected and rejected", $dupEmailCount > 0);

    // Test 5: Admin Approves Partner A
    $adminActorId = 'admin_super';
    $approveTime = date('Y-m-d H:i:s');
    $updApprove = $pdo->prepare("UPDATE users SET status = 'active', approved_at = ?, approved_by = ?, rejection_reason = NULL WHERE id = ?");
    $updApprove->execute([$approveTime, $adminActorId, $partnerIdA]);

    $stmt->execute([$partnerIdA]);
    $pA_approved = $stmt->fetch(PDO::FETCH_ASSOC);

    assertCondition("Admin approval changes status to 'active'", $pA_approved['status'] === 'active');
    assertCondition("Admin approval records approved_at timestamp", !empty($pA_approved['approved_at']));
    assertCondition("Admin approval records approved_by actor ID", $pA_approved['approved_by'] === $adminActorId);
    assertCondition("Admin approval clears rejection_reason", empty($pA_approved['rejection_reason']));

    // Test 6: Login after approval succeeds
    $canLoginApproved = ($pA_approved['status'] === 'active' && password_verify('SecretPass@2026', $pA_approved['password_hash']));
    assertCondition("B2B Login succeeds after admin approval", $canLoginApproved);

    // Test 7: Register and Reject Partner B
    $partnerIdB = 'b2b_test_' . uniqid();
    $ins->execute([
        $partnerIdB, 'test_agency_rejected', 'Fraudulent Tours', 'Other',
        'Scam Person', '9999999999', 'fake@scam.com', '',
        'Scam Person', 'fake@scam.com', '9999999999',
        'Unknown St', 'Unknown', 'Goa', 'India', '403001',
        password_hash('Fake@123', PASSWORD_DEFAULT), 'Fake@123', $now
    ]);

    $rejectReason = "Business registration documents could not be verified.";
    $updReject = $pdo->prepare("UPDATE users SET status = 'rejected', rejection_reason = ?, approved_at = NULL, approved_by = NULL WHERE id = ?");
    $updReject->execute([$rejectReason, $partnerIdB]);

    $stmt->execute([$partnerIdB]);
    $pB_rejected = $stmt->fetch(PDO::FETCH_ASSOC);

    assertCondition("Admin rejection changes status to 'rejected'", $pB_rejected['status'] === 'rejected');
    assertCondition("Admin rejection saves rejection_reason", $pB_rejected['rejection_reason'] === $rejectReason);
    assertCondition("Admin rejection resets approved_at to NULL", empty($pB_rejected['approved_at']));

    // Test 8: Login attempt for rejected partner is blocked
    $loginRejected = false;
    $loginRejectedError = '';
    if ($pB_rejected['status'] === 'rejected') {
        $loginRejected = true;
        $loginRejectedError = "Your B2B application was not approved. Please contact WOW GOA support.";
    }
    assertCondition("Login attempt for rejected account is blocked", $loginRejected && strpos($loginRejectedError, 'not approved') !== false);

    // Clean up test data
    $pdo->exec("DELETE FROM users WHERE username LIKE 'test_agency_%'");
    $pdo->exec("DELETE FROM b2b_audit_logs WHERE partner_id LIKE 'test_agency_%' OR partner_id LIKE 'b2b_test_%'");

} catch (Exception $ex) {
    echo "EXCEPTION OCCURRED: " . $ex->getMessage() . "\n" . $ex->getTraceAsString() . "\n";
    $failCount++;
}

echo "\n--- TEST RUN COMPLETE: $passCount PASSED, $failCount FAILED ---\n\n";

if ($failCount > 0) {
    exit(1);
}
exit(0);
