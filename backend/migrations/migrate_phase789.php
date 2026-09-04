<?php
/**
 * Migration: Phase 7, 8, 9 Schema Setup
 * - Create vehicle_units table (4 physical units for GT, units for other vehicles)
 * - Add vendor_id and physical_unit_id to bookings table
 * - Update notifications table schema
 */

$pdo = new PDO('sqlite:d:/wow goa/Tripgalileo (2)/Tripgalileo/backend/database.sqlite');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

// 1. Create vehicle_units table
$pdo->exec("CREATE TABLE IF NOT EXISTS vehicle_units (
    id VARCHAR(50) PRIMARY KEY,
    vehicle_id VARCHAR(50) NOT NULL,
    vendor_id VARCHAR(50) NOT NULL,
    unit_name VARCHAR(100) DEFAULT '',
    registration_no VARCHAR(100) DEFAULT '',
    status VARCHAR(50) DEFAULT 'Active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)");

// 2. Add columns to bookings if not existing
$cols = $pdo->query("PRAGMA table_info(bookings)")->fetchAll(PDO::FETCH_ASSOC);
$colNames = array_column($cols, 'name');

if (!in_array('vendor_id', $colNames)) {
    $pdo->exec("ALTER TABLE bookings ADD COLUMN vendor_id VARCHAR(50) DEFAULT NULL");
    echo "Added vendor_id to bookings\n";
}

if (!in_array('physical_unit_id', $colNames)) {
    $pdo->exec("ALTER TABLE bookings ADD COLUMN physical_unit_id VARCHAR(50) DEFAULT NULL");
    echo "Added physical_unit_id to bookings\n";
}

// 3. Add columns to notifications if not existing
$notifCols = $pdo->query("PRAGMA table_info(notifications)")->fetchAll(PDO::FETCH_ASSOC);
$notifColNames = array_column($notifCols, 'name');

if (!in_array('role', $notifColNames)) {
    try { $pdo->exec("ALTER TABLE notifications ADD COLUMN role VARCHAR(50) DEFAULT NULL"); } catch (Exception $e) {}
    echo "Added role to notifications\n";
}

// 4. Seed physical units for GT and existing vehicles
// Find the GT bike or GT car
$stmtGt = $pdo->query("SELECT id, vendor_id, name FROM bikes WHERE name LIKE '%GT%' LIMIT 1");
$gtBike = $stmtGt->fetch(PDO::FETCH_ASSOC);
if (!$gtBike) {
    // Check cars
    $stmtGtC = $pdo->query("SELECT id, vendor_id, name FROM cars WHERE name LIKE '%GT%' LIMIT 1");
    $gtBike = $stmtGtC->fetch(PDO::FETCH_ASSOC);
}

if ($gtBike) {
    $gtId = $gtBike['id'];
    $gtVendor = !empty($gtBike['vendor_id']) ? $gtBike['vendor_id'] : 'vendor-2';
    
    // Seed 4 physical GT units: GT-001, GT-002, GT-003, GT-004
    for ($i = 1; $i <= 4; $i++) {
        $unitId = sprintf("GT-%03d", $i);
        $stmtIns = $pdo->prepare("INSERT OR IGNORE INTO vehicle_units (id, vehicle_id, vendor_id, unit_name, registration_no, status) VALUES (?, ?, ?, ?, ?, 'Active')");
        $stmtIns->execute([$unitId, $gtId, $gtVendor, "GT Unit #$i", "GA-01-GT-000$i"]);
        echo "Seeded physical unit: $unitId (Model: $gtId, Vendor: $gtVendor)\n";
    }
}

// Also seed at least 1 unit for other cars and bikes if they don't have units
$allCars = $pdo->query("SELECT id, vendor_id, name FROM cars")->fetchAll(PDO::FETCH_ASSOC);
foreach ($allCars as $car) {
    $cId = $car['id'];
    $vId = !empty($car['vendor_id']) ? $car['vendor_id'] : 'vendor-1';
    $uId = "U-" . strtoupper(substr(md5($cId), 0, 8)) . "-01";
    $stmtIns = $pdo->prepare("INSERT OR IGNORE INTO vehicle_units (id, vehicle_id, vendor_id, unit_name, registration_no, status) VALUES (?, ?, ?, ?, ?, 'Active')");
    $stmtIns->execute([$uId, $cId, $vId, $car['name'] . " Unit 1", "GA-01-CAR-" . rand(100, 999)]);
}

$allBikes = $pdo->query("SELECT id, vendor_id, name FROM bikes WHERE id != " . $pdo->quote($gtBike['id'] ?? ''))->fetchAll(PDO::FETCH_ASSOC);
foreach ($allBikes as $bike) {
    $bId = $bike['id'];
    $vId = !empty($bike['vendor_id']) ? $bike['vendor_id'] : 'vendor-2';
    $uId = "U-" . strtoupper(substr(md5($bId), 0, 8)) . "-01";
    $stmtIns = $pdo->prepare("INSERT OR IGNORE INTO vehicle_units (id, vehicle_id, vendor_id, unit_name, registration_no, status) VALUES (?, ?, ?, ?, ?, 'Active')");
    $stmtIns->execute([$uId, $bId, $vId, $bike['name'] . " Unit 1", "GA-01-BIKE-" . rand(100, 999)]);
}

echo "Migration completed successfully!\n";
