<?php
$pdo = new PDO('sqlite:' . __DIR__ . '/../backend/database.sqlite');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

try {
    $pdo->exec("ALTER TABLE users ADD COLUMN gst_number VARCHAR(50) DEFAULT NULL");
    echo "Added gst_number column successfully!\n";
} catch (Exception $e) {
    echo "Notice: " . $e->getMessage() . "\n";
}

// Now test query
$stmt = $pdo->query("SELECT id, username, email, phone, name, company_name, business_type, state, country, pincode, website, contact_name, contact_email, contact_phone, rejection_reason, approved_at, approved_by, city, address, gst_number, role, status, allow_commission, allow_non_commission, default_commission_rate, default_net_discount_rate, credit_limit, wallet_balance, initial_mode, requested_mode, mode_request_status, mode_requested_at, mode_rejection_reason, created_at FROM users WHERE role IN ('b2b', 'agent') ORDER BY created_at DESC");
$partners = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo "Partners count: " . count($partners) . "\n";
foreach ($partners as $p) {
    echo "- [{$p['id']}] {$p['name']} ({$p['email']}) Company: {$p['company_name']}, Status: {$p['status']}\n";
}
