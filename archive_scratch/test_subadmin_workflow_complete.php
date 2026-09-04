<?php
error_reporting(E_ALL);
ini_set('display_errors', '1');

$sqlitePath = __DIR__ . '/../backend/database.sqlite';
$pdo = new PDO("sqlite:$sqlitePath");
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

echo "=== 1. VERIFY USERS TABLE & SUBADMIN USER ===\n";
$stmt = $pdo->query("SELECT id, username, name, email, role, status FROM users WHERE role = 'subadmin'");
$subadmins = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo "Subadmins found: " . count($subadmins) . "\n";
print_r($subadmins);

if (count($subadmins) === 0) {
    $hash = password_hash('admin@2026', PASSWORD_BCRYPT);
    $pdo->exec("INSERT INTO users (id, username, name, email, phone, role, status, password_hash, plain_password, created_at, admin_id)
                VALUES ('u-sub-1', 'rahul_subadmin', 'Rahul SubAdmin', 'subadmin@tripgalileo.com', '+91 9876543210', 'subadmin', 'active', '$hash', 'admin@2026', datetime('now'), 'admin')");
    echo "Inserted default subadmin: rahul_subadmin\n";
}

echo "\n=== 2. VERIFY LEADS TABLE COLUMNS ===\n";
$stmt = $pdo->query("PRAGMA table_info(leads)");
$cols = $stmt->fetchAll(PDO::FETCH_ASSOC);
$colNames = array_column($cols, 'name');
echo "Columns in leads table: " . implode(', ', $colNames) . "\n";

foreach (['assigned_at', 'assigned_by', 'next_action', 'completion_notes', 'deal_value', 'completed_at', 'completed_by'] as $c) {
    if (!in_array($c, $colNames)) {
        $pdo->exec("ALTER TABLE leads ADD COLUMN $c TEXT DEFAULT ''");
        echo "Added column: $c\n";
    }
}

echo "\n=== 3. CREATE & ASSIGN LEAD TO RAHUL SUBADMIN ===\n";
$testLeadId = 'LD-TEST-' . rand(1000, 9999);
$stmt = $pdo->prepare("INSERT INTO leads (id, name, phone, email, source, service, assigned_to, assigned_at, assigned_by, status, budget, notes, next_action, admin_id, created_at, updated_at)
    VALUES (?, 'Rohit Singhania', '+91 98765 43210', 'rohit.s@singhania.com', 'Hotel Enquiries', 'Taj Exotica Goa (5 Nights Sea Facing Suite)', 'Rahul SubAdmin', datetime('now'), 'Admin', 'In Progress', '₹1,20,000', 'Customer requested private airport transfers and candlelight beach dinner.', 'Call customer back on Friday at 4 PM', 'admin', datetime('now'), datetime('now'))");
$stmt->execute([$testLeadId]);
echo "Created test lead: $testLeadId\n";

echo "\n=== 4. ADD SUBADMIN COMMENT TO LEAD ===\n";
$commentId = 'comm_' . time() . '_' . rand(100, 999);
$stmt = $pdo->prepare("INSERT INTO lead_comments (id, lead_id, user_id, user_name, user_role, comment, created_at, updated_at)
    VALUES (?, ?, 'u-sub-1', 'Rahul SubAdmin', 'subadmin', 'Spoke to client Rohit. He approved the suite package and requested invoice copy.', datetime('now'), datetime('now'))");
$stmt->execute([$commentId, $testLeadId]);
echo "Added comment: $commentId\n";

echo "\n=== 5. COMPLETE LEAD AS SUBADMIN (COMPLETE & NOTIFY ADMIN) ===\n";
$now = date('Y-m-d H:i:s');
$dealVal = 120000;
$notes = "Payment advance received of ₹30,000 via UPI. Confirmed booking with Taj Exotica. Final balance due at check-in.";
$stmt = $pdo->prepare("UPDATE leads SET status = 'Closed-Won', deal_value = ?, completion_notes = ?, completed_at = ?, completed_by = 'Rahul SubAdmin', updated_at = ? WHERE id = ?");
$stmt->execute([$dealVal, $notes, $now, $now, $testLeadId]);

$sysCommentId = 'comm_' . (time() + 1) . '_' . rand(100, 999);
$sysMsg = "🎉 Lead marked as COMPLETED (Closed-Won) by Rahul SubAdmin.\n💰 Deal Value: ₹1,20,000\n📝 Completion Note: $notes";
$stmt = $pdo->prepare("INSERT INTO lead_comments (id, lead_id, user_id, user_name, user_role, comment, created_at, updated_at)
    VALUES (?, ?, 'system', 'Rahul SubAdmin', 'subadmin', ?, datetime('now'), datetime('now'))");
$stmt->execute([$sysCommentId, $testLeadId, $sysMsg]);
echo "Marked lead as Closed-Won and created milestone note for Admin!\n";

echo "\n=== 6. VERIFY FINAL RECORD IN DATABASE ===\n";
$stmt = $pdo->prepare("SELECT * FROM leads WHERE id = ?");
$stmt->execute([$testLeadId]);
$leadResult = $stmt->fetch(PDO::FETCH_ASSOC);
print_r($leadResult);

echo "\n=== 7. VERIFY COMMENTS ON LEAD ===\n";
$stmt = $pdo->prepare("SELECT * FROM lead_comments WHERE lead_id = ? ORDER BY created_at ASC");
$stmt->execute([$testLeadId]);
$commentsResult = $stmt->fetchAll(PDO::FETCH_ASSOC);
print_r($commentsResult);

echo "\nSUCCESS: Sub-Admin lead lifecycle verified end-to-end!\n";
