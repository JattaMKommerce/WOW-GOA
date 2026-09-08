<?php
$pdo = new PDO('sqlite:backend/database.sqlite');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

// 1. Columns in add_ons
$addOnCols = $pdo->query("PRAGMA table_info(add_ons)")->fetchAll(PDO::FETCH_ASSOC);

// 2. Records in add_ons
$addOnRecords = $pdo->query("SELECT * FROM add_ons")->fetchAll(PDO::FETCH_ASSOC);

// 3. Baseline counts of all existing entities
$counts = [
    'hotels' => $pdo->query("SELECT COUNT(*) FROM hotels")->fetchColumn(),
    'packages' => $pdo->query("SELECT COUNT(*) FROM packages")->fetchColumn(),
    'cars' => $pdo->query("SELECT COUNT(*) FROM cars")->fetchColumn(),
    'bikes' => $pdo->query("SELECT COUNT(*) FROM bikes")->fetchColumn(),
    'bookings' => $pdo->query("SELECT COUNT(*) FROM bookings")->fetchColumn(),
    'vendors' => $pdo->query("SELECT COUNT(*) FROM vendors")->fetchColumn(),
    'drivers' => $pdo->query("SELECT COUNT(*) FROM drivers")->fetchColumn(),
    'users' => $pdo->query("SELECT COUNT(*) FROM users")->fetchColumn(),
    'custom_enquiries' => $pdo->query("SELECT COUNT(*) FROM custom_enquiries")->fetchColumn(),
    'ai_leads' => $pdo->query("SELECT COUNT(*) FROM ai_leads")->fetchColumn(),
    'b2b_pricing_rules' => $pdo->query("SELECT COUNT(*) FROM b2b_pricing_rules")->fetchColumn(),
];

echo json_encode([
    'add_ons_columns' => $addOnCols,
    'add_ons_records_count' => count($addOnRecords),
    'add_ons_records' => $addOnRecords,
    'baseline_counts' => $counts
], JSON_PRETTY_PRINT);
