<?php
$pdo = new PDO('sqlite:backend/database.sqlite');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$summary = [];

// 1. Tables list & count
$tables = $pdo->query("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name")->fetchAll(PDO::FETCH_COLUMN);
$summary['all_tables'] = [];
foreach ($tables as $t) {
    $c = (int)$pdo->query("SELECT COUNT(*) FROM `{$t}`")->fetchColumn();
    $summary['all_tables'][$t] = $c;
}

// 2. Users Breakdown (Customers, B2B, Admins, etc.)
$usersByRole = $pdo->query("SELECT role, COUNT(*) as cnt FROM users GROUP BY role")->fetchAll(PDO::FETCH_KEY_PAIR);
$summary['users_by_role'] = $usersByRole;
$usersSample = $pdo->query("SELECT id, name, email, role, kyc_status, wallet_balance, company_name FROM users")->fetchAll(PDO::FETCH_ASSOC);
$summary['users_sample'] = $usersSample;

// 3. Bookings Breakdown
$bookingsByType = $pdo->query("SELECT type, COUNT(*) as cnt FROM bookings GROUP BY type")->fetchAll(PDO::FETCH_KEY_PAIR);
$summary['bookings_by_type'] = $bookingsByType;
$b2bBookingsCount = (int)$pdo->query("SELECT COUNT(*) FROM bookings WHERE b2b_partner_id IS NOT NULL AND b2b_partner_id != ''")->fetchColumn();
$summary['b2b_bookings_count'] = $b2bBookingsCount;

// 4. Vendors
$vendors = $pdo->query("SELECT * FROM vendors LIMIT 5")->fetchAll(PDO::FETCH_ASSOC);
$summary['vendors'] = $vendors;

// 5. Drivers
$drivers = $pdo->query("SELECT * FROM drivers LIMIT 5")->fetchAll(PDO::FETCH_ASSOC);
$summary['drivers'] = $drivers;

// 6. Cars & Bikes
$cars = $pdo->query("SELECT * FROM cars LIMIT 5")->fetchAll(PDO::FETCH_ASSOC);
$summary['cars'] = $cars;
$bikes = $pdo->query("SELECT * FROM bikes LIMIT 5")->fetchAll(PDO::FETCH_ASSOC);
$summary['bikes'] = $bikes;

// 7. Hotels
$hotels = $pdo->query("SELECT * FROM hotels LIMIT 5")->fetchAll(PDO::FETCH_ASSOC);
$summary['hotels'] = $hotels;

// 8. Packages (Trips)
$packages = $pdo->query("SELECT * FROM packages LIMIT 5")->fetchAll(PDO::FETCH_ASSOC);
$summary['packages'] = $packages;

// 9. Add_ons table inspection
$addOnsSchema = $pdo->query("PRAGMA table_info(add_ons)")->fetchAll(PDO::FETCH_ASSOC);
$addOnsCount = (int)$pdo->query("SELECT COUNT(*) FROM add_ons")->fetchColumn();
$summary['add_ons'] = [
    'count' => $addOnsCount,
    'schema' => array_column($addOnsSchema, 'name')
];

echo json_encode($summary, JSON_PRETTY_PRINT);
