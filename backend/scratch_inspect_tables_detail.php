<?php
$pdo = new PDO('sqlite:database.sqlite');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$tablesToCheck = [
    'driver_assignments',
    'customer_loyalty',
    'customer_loyalty_history',
    'customer_wallet_transactions',
    'ai_leads',
    'leads',
    'lead_comments',
    'lead_notes',
    'enquiry_timeline',
    'custom_enquiries',
    'hotel_guests',
    'hotel_reviews',
    'birthday_message_logs',
    'notifications',
    'b2b_wallet_transactions',
    'b2b_audit_logs',
    'hotel_activity_logs'
];

foreach ($tablesToCheck as $t) {
    echo "=== TABLE: $t ===\n";
    $cols = $pdo->query("PRAGMA table_info(`$t`)")->fetchAll(PDO::FETCH_ASSOC);
    $colNames = array_column($cols, 'name');
    echo "Columns: " . implode(', ', $colNames) . "\n";
    $count = $pdo->query("SELECT COUNT(*) FROM `$t`")->fetchColumn();
    echo "Count: $count\n\n";
}
