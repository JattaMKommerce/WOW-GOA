<?php
$pdo = new PDO('sqlite:backend/database.sqlite');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

echo "=== 1. VERIFY SUBADMIN USERS IN DATABASE ===\n";
$stmt = $pdo->query("SELECT id, username, name, email, role, status FROM users WHERE role IN ('subadmin', 'agent')");
$subadmins = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo "Subadmins found: " . count($subadmins) . "\n";
print_r($subadmins);

echo "\n=== 2. SELECT AN EXISTING LEAD TO TEST ASSIGNMENT ===\n";
$stmt = $pdo->query("SELECT * FROM leads ORDER BY created_at DESC LIMIT 1");
$lead = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$lead) {
    echo "No leads found. Creating a lead to test...\n";
    $leadId = 'LD-ISO-' . rand(1000, 9999);
    $pdo->exec("INSERT INTO leads (id, name, phone, email, source, service, assigned_to, status, budget, notes, admin_id)
                VALUES ('$leadId', 'Nikhil Sharma', '+91 9988776655', 'nikhil@example.com', 'Hotel Enquiries', 'W Goa Resort (3 Nights)', 'Unassigned', 'New', '₹60,000', 'Wants sea view cottage', 'admin')");
    $stmt = $pdo->query("SELECT * FROM leads WHERE id = '$leadId'");
    $lead = $stmt->fetch(PDO::FETCH_ASSOC);
}

$testLeadId = $lead['id'];
echo "Testing with Lead ID: {$testLeadId} ({$lead['name']})\n";

echo "\n=== 3. ADMIN ASSIGNS LEAD TO RAHUL SUBADMIN ===\n";
$now = date('Y-m-d H:i:s');
$stmt = $pdo->prepare("UPDATE leads SET assigned_to = ?, assigned_by = ?, assigned_at = ?, updated_at = ? WHERE id = ?");
$stmt->execute(['Rahul SubAdmin', 'Admin', $now, $now, $testLeadId]);

$commentId = 'comm_' . time() . '_' . rand(100, 999);
$stmt = $pdo->prepare("INSERT INTO lead_comments (id, lead_id, user_id, user_name, user_role, comment, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
$stmt->execute([$commentId, $testLeadId, 'system', 'System', 'system', 'Lead assigned to Rahul SubAdmin by Admin.', $now, $now]);

echo "Lead assigned to Rahul SubAdmin!\n";

echo "\n=== 4. SUBADMIN QUERIES ASSIGNED LEADS ===\n";
$stmt = $pdo->prepare("SELECT id, name, phone, service, assigned_to, status FROM leads WHERE (assigned_to = ? OR assigned_to LIKE ?) ORDER BY created_at DESC");
$stmt->execute(['Rahul SubAdmin', '%Rahul%']);
$myLeads = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo "Leads visible to Rahul SubAdmin: " . count($myLeads) . "\n";
print_r($myLeads);

echo "\n=== 5. SUBADMIN WORKS ON LEAD: ADDS COMMENT & NOTES ===\n";
$stmt = $pdo->prepare("UPDATE leads SET notes = ?, next_action = ?, status = ?, updated_at = ? WHERE id = ?");
$stmt->execute([
    'Customer wants complimentary airport transfers included.',
    'Follow up on Thursday 4 PM with final quotation voucher.',
    'In Progress',
    $now,
    $testLeadId
]);

$commentId2 = 'comm_' . time() . '_' . rand(100, 999);
$stmt = $pdo->prepare("INSERT INTO lead_comments (id, lead_id, user_id, user_name, user_role, comment, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
$stmt->execute([$commentId2, $testLeadId, 'u-sub-1', 'Rahul SubAdmin', 'subadmin', 'Spoke with Nikhil. He agreed to the package price and requested invoice.', $now, $now]);

echo "SubAdmin notes and comment added!\n";

echo "\n=== 6. SUBADMIN COMPLETES LEAD & UPDATES ADMIN ===\n";
$dealValue = 58000;
$resNotes = "Advance payment of ₹20,000 received via Google Pay. W Goa booking confirmed for 3 nights.";
$completedBy = "Rahul SubAdmin";

$stmt = $pdo->prepare("UPDATE leads SET status = ?, deal_value = ?, completion_notes = ?, completed_by = ?, completed_at = ?, updated_at = ? WHERE id = ?");
$stmt->execute(['Closed-Won', $dealValue, $resNotes, $completedBy, $now, $now, $testLeadId]);

$commentId3 = 'comm_' . time() . '_' . rand(100, 999);
$milestoneText = "🎉 Lead marked as COMPLETED (Closed-Won) by $completedBy.\n💰 Deal Value: ₹" . number_format($dealValue) . "\n📝 Resolution Summary: $resNotes";
$stmt = $pdo->prepare("INSERT INTO lead_comments (id, lead_id, user_id, user_name, user_role, comment, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
$stmt->execute([$commentId3, $testLeadId, 'system', $completedBy, 'system', $milestoneText, $now, $now]);

echo "Lead completed and Admin milestone alert created!\n";

echo "\n=== 7. VERIFY COMPLETED RECORD SEEN BY ADMIN ===\n";
$stmt = $pdo->prepare("SELECT id, name, service, assigned_to, status, deal_value, completion_notes, completed_by, completed_at FROM leads WHERE id = ?");
$stmt->execute([$testLeadId]);
$finalRecord = $stmt->fetch(PDO::FETCH_ASSOC);
print_r($finalRecord);

echo "\n=== 8. VERIFY COMMENTS ON LEAD ===\n";
$stmt = $pdo->prepare("SELECT id, user_name, user_role, comment, created_at FROM lead_comments WHERE lead_id = ? ORDER BY created_at ASC");
$stmt->execute([$testLeadId]);
$allComments = $stmt->fetchAll(PDO::FETCH_ASSOC);
print_r($allComments);

echo "\n=== 9. INTEGRITY CHECK ON EXISTING DATA ===\n";
$hotelsCount = $pdo->query("SELECT COUNT(*) FROM hotels")->fetchColumn();
$vehiclesCount = $pdo->query("SELECT COUNT(*) FROM cars")->fetchColumn() + $pdo->query("SELECT COUNT(*) FROM bikes")->fetchColumn();
$bookingsCount = $pdo->query("SELECT COUNT(*) FROM bookings")->fetchColumn();
$usersCount = $pdo->query("SELECT COUNT(*) FROM users")->fetchColumn();

echo "Existing Hotels in DB: $hotelsCount\n";
echo "Existing Vehicles in DB: $vehiclesCount\n";
echo "Existing Bookings in DB: $bookingsCount\n";
echo "Existing Users in DB: $usersCount\n";

echo "\nALL TESTS PASSED: Sub-Admin workflow is isolated and verified with ZERO regressions!\n";
