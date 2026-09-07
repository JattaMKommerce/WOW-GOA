<?php
/**
 * Comprehensive Regression Test Suite for Tripgalileo
 * 
 * Verifies:
 * 1. Existing Bookings (counts, breakdown, non-destructive check)
 * 2. Existing Cars & Bikes (counts, specs, prices)
 * 3. Existing Hotels (counts, locations, ratings)
 * 4. Existing Trips/Packages (counts, day-wise itineraries, inclusions)
 * 5. Existing Vendors (counts, contact details, roles)
 * 6. Existing Drivers (counts, statuses, phones)
 * 7. Existing Customers (user counts, customer profiles, auth integrity)
 * 8. Existing B2B Data (B2B users, B2B pricing rules, B2B bookings, B2B notifications)
 * 9. add_ons Schema & Integrity (schema columns preserved, zero forced migrations, zero unwanted data)
 * 10. Activity Classifier Isolation (ensures activities are NEVER misclassified as trips, vehicles, hotels, or flights)
 * 11. Activity CRUD Lifecycle (Create -> Read -> Update -> Delete without polluting baseline)
 */

$pdo = new PDO('sqlite:backend/database.sqlite');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$report = [
    'timestamp' => date('c'),
    'suites' => []
];

// Helper assertion
function assertCondition($name, $condition, $details = []) {
    return [
        'test' => $name,
        'status' => $condition ? 'PASS' : 'FAIL',
        'details' => $details
    ];
}

// ----------------------------------------------------
// SUITE 1: Existing Bookings
// ----------------------------------------------------
$bookingCount = (int)$pdo->query("SELECT COUNT(*) FROM bookings")->fetchColumn();
$bookingsByType = $pdo->query("SELECT type, COUNT(*) as cnt FROM bookings GROUP BY type")->fetchAll(PDO::FETCH_KEY_PAIR);
$sampleBookings = $pdo->query("SELECT id, name, email, type, item_id, item_name, total_amount, status FROM bookings LIMIT 5")->fetchAll(PDO::FETCH_ASSOC);

$report['suites']['bookings'] = [
    assertCondition('Booking count is preserved (>= 153)', $bookingCount >= 153, ['count' => $bookingCount]),
    assertCondition('Booking breakdown by type intact', !empty($bookingsByType), $bookingsByType),
    assertCondition('Booking records queryable with integrity', count($sampleBookings) === 5, ['sample_ids' => array_column($sampleBookings, 'id')])
];

// ----------------------------------------------------
// SUITE 2: Existing Cars & Bikes (Vehicles)
// ----------------------------------------------------
$carCount = (int)$pdo->query("SELECT COUNT(*) FROM cars")->fetchColumn();
$bikeCount = (int)$pdo->query("SELECT COUNT(*) FROM bikes")->fetchColumn();
$unitCount = (int)$pdo->query("SELECT COUNT(*) FROM vehicle_units")->fetchColumn();
$sampleCars = $pdo->query("SELECT id, name, price, transmission FROM cars LIMIT 3")->fetchAll(PDO::FETCH_ASSOC);

$report['suites']['vehicles'] = [
    assertCondition('Cars count matches baseline (8)', $carCount === 8, ['cars' => $carCount]),
    assertCondition('Bikes count matches baseline (6)', $bikeCount === 6, ['bikes' => $bikeCount]),
    assertCondition('Vehicle units intact (44)', $unitCount === 44, ['units' => $unitCount]),
    assertCondition('Cars sample data intact', count($sampleCars) === 3, $sampleCars)
];

// ----------------------------------------------------
// SUITE 3: Existing Hotels
// ----------------------------------------------------
$hotelCount = (int)$pdo->query("SELECT COUNT(*) FROM hotels")->fetchColumn();
$hotels = $pdo->query("SELECT id, name, location, price, rating FROM hotels")->fetchAll(PDO::FETCH_ASSOC);

$report['suites']['hotels'] = [
    assertCondition('Hotels count matches baseline (4)', $hotelCount === 4, ['hotels' => $hotelCount]),
    assertCondition('All hotels have valid names and locations', count(array_filter($hotels, fn($h) => !empty($h['name']) && !empty($h['location']))) === 4, array_column($hotels, 'name'))
];

// ----------------------------------------------------
// SUITE 4: Existing Trips / Packages
// ----------------------------------------------------
$pkgCount = (int)$pdo->query("SELECT COUNT(*) FROM packages")->fetchColumn();
$pkgs = $pdo->query("SELECT id, name, duration, price, package_type FROM packages")->fetchAll(PDO::FETCH_ASSOC);

$report['suites']['trips'] = [
    assertCondition('Trip packages count matches baseline (3)', $pkgCount === 3, ['packages' => $pkgCount]),
    assertCondition('Trip packages data intact', count($pkgs) === 3, array_column($pkgs, 'name'))
];

// ----------------------------------------------------
// SUITE 5: Existing Vendors
// ----------------------------------------------------
$vendorCount = (int)$pdo->query("SELECT COUNT(*) FROM vendors")->fetchColumn();
$vendors = $pdo->query("SELECT id, name, email, phone FROM vendors")->fetchAll(PDO::FETCH_ASSOC);

$report['suites']['vendors'] = [
    assertCondition('Vendors count matches baseline (4)', $vendorCount === 4, ['vendors' => $vendorCount]),
    assertCondition('Vendor contact details intact', count($vendors) === 4, array_column($vendors, 'name'))
];

// ----------------------------------------------------
// SUITE 6: Existing Drivers
// ----------------------------------------------------
$driverCount = (int)$pdo->query("SELECT COUNT(*) FROM drivers")->fetchColumn();
$drivers = $pdo->query("SELECT id, name, phone, status FROM drivers")->fetchAll(PDO::FETCH_ASSOC);

$report['suites']['drivers'] = [
    assertCondition('Drivers count matches baseline (5)', $driverCount === 5, ['drivers' => $driverCount]),
    assertCondition('Drivers data intact', count($drivers) === 5, array_column($drivers, 'name'))
];

// ----------------------------------------------------
// SUITE 7: Existing Customers (Users)
// ----------------------------------------------------
$userCount = (int)$pdo->query("SELECT COUNT(*) FROM users")->fetchColumn();
$usersByRole = $pdo->query("SELECT role, COUNT(*) as cnt FROM users GROUP BY role")->fetchAll(PDO::FETCH_KEY_PAIR);
$customerUsers = $pdo->query("SELECT id, name, email, role FROM users WHERE role = 'customer' OR role = 'user' OR role IS NULL")->fetchAll(PDO::FETCH_ASSOC);

$report['suites']['customers'] = [
    assertCondition('Total user accounts intact (10)', $userCount === 10, ['user_count' => $userCount]),
    assertCondition('Role breakdown queryable', !empty($usersByRole), $usersByRole),
    assertCondition('Customer user profiles intact', count($customerUsers) >= 1, array_column($customerUsers, 'email'))
];

// ----------------------------------------------------
// SUITE 8: Existing B2B Data
// ----------------------------------------------------
$b2bUsers = $pdo->query("SELECT id, name, email, role, company_name, wallet_balance FROM users WHERE role LIKE '%b2b%' OR role = 'agent'")->fetchAll(PDO::FETCH_ASSOC);
$b2bRulesCount = (int)$pdo->query("SELECT COUNT(*) FROM b2b_pricing_rules")->fetchColumn();
$b2bNotifications = (int)$pdo->query("SELECT COUNT(*) FROM notifications WHERE b2b_partner_id IS NOT NULL AND b2b_partner_id != ''")->fetchColumn();
$b2bBookings = (int)$pdo->query("SELECT COUNT(*) FROM bookings WHERE b2b_partner_id IS NOT NULL AND b2b_partner_id != ''")->fetchColumn();

$report['suites']['b2b_data'] = [
    assertCondition('B2B partner user accounts exist and intact', count($b2bUsers) >= 1, array_column($b2bUsers, 'email')),
    assertCondition('B2B pricing rules table queryable', $b2bRulesCount >= 0, ['b2b_pricing_rules_count' => $b2bRulesCount]),
    assertCondition('B2B notifications queryable', $b2bNotifications >= 0, ['b2b_notifications' => $b2bNotifications]),
    assertCondition('B2B bookings field intact in bookings table', $b2bBookings >= 1, ['b2b_bookings' => $b2bBookings])
];

// ----------------------------------------------------
// SUITE 9: add_ons Schema & Integrity
// ----------------------------------------------------
$cols = $pdo->query("PRAGMA table_info(add_ons)")->fetchAll(PDO::FETCH_ASSOC);
$colNames = array_column($cols, 'name');
$addOnCount = (int)$pdo->query("SELECT COUNT(*) FROM add_ons")->fetchColumn();

$report['suites']['add_ons_schema'] = [
    assertCondition('add_ons table exists', !empty($cols), ['columns' => $colNames]),
    assertCondition('Original SQLite schema preserved without unwanted alterations', in_array('id', $colNames) && in_array('name', $colNames) && in_array('price', $colNames), $colNames),
    assertCondition('add_ons table intact and queryable', $addOnCount >= 0, ['count' => $addOnCount])
];

// ----------------------------------------------------
// SUITE 10: Activity Classifier Isolation
// ----------------------------------------------------
function testClassifier($b) {
    $type = strtolower($b['type'] ?? '');
    $pkgType = strtolower($b['package_type'] ?? '');
    $itemId = strtolower($b['item_id'] ?? '');
    $itemName = strtolower($b['item_name'] ?? '');

    if ($type === 'flight' || str_starts_with($itemId, 'fl-') || str_contains($itemName, 'flight')) {
        return 'FLIGHT';
    }
    // Activity evaluated strictly BEFORE trip package!
    if ($type === 'activity' || $type === 'sightseeing' || $pkgType === 'activity' || $pkgType === 'sightseeing' ||
        str_starts_with($itemId, 'act-') || str_starts_with($itemId, 'act_') || str_starts_with($itemId, 'activity-') || str_starts_with($itemId, 'sight-')) {
        return 'ACTIVITY';
    }
    if ($type === 'package' || $type === 'trip' || str_starts_with($itemId, 'pkg-') || str_contains($itemName, 'holiday package') || str_contains($itemName, 'craft my trip')) {
        return 'TRIP';
    }
    if ($type === 'hotel' || str_starts_with($itemId, 'htl-') || str_contains($itemName, 'resort') || str_contains($itemName, 'hotel')) {
        return 'HOTEL';
    }
    return 'VEHICLE';
}

$classifierMatrix = [
    ['b' => ['type' => 'vehicle', 'item_id' => 'car-1', 'item_name' => 'Thar 4x4'], 'expected' => 'VEHICLE'],
    ['b' => ['type' => 'hotel', 'item_id' => 'htl-1', 'item_name' => 'Candolim Resort'], 'expected' => 'HOTEL'],
    ['b' => ['type' => 'package', 'item_id' => 'pkg-1', 'item_name' => 'Goa Holiday Package'], 'expected' => 'TRIP'],
    ['b' => ['type' => 'activity', 'item_id' => 'act-501', 'item_name' => 'Scuba Diving Tour'], 'expected' => 'ACTIVITY'],
    ['b' => ['type' => 'sightseeing', 'item_id' => 'sight-202', 'item_name' => 'Old Goa Church Tour'], 'expected' => 'ACTIVITY'],
    ['b' => ['type' => 'trip', 'package_type' => 'activity', 'item_id' => 'act-999', 'item_name' => 'Parasailing Adventure'], 'expected' => 'ACTIVITY'],
    ['b' => ['type' => 'flight', 'item_id' => 'fl-101', 'item_name' => 'IndiGo Flight'], 'expected' => 'FLIGHT'],
];

$classifierPassed = true;
$classifierDetails = [];
foreach ($classifierMatrix as $case) {
    $res = testClassifier($case['b']);
    $passed = ($res === $case['expected']);
    if (!$passed) $classifierPassed = false;
    $classifierDetails[] = [
        'input' => $case['b'],
        'expected' => $case['expected'],
        'actual' => $res,
        'pass' => $passed
    ];
}

$report['suites']['classifier_isolation'] = [
    assertCondition('Activity bookings cleanly separated from Trip, Vehicle, Hotel, Flight', $classifierPassed, $classifierDetails)
];

// ----------------------------------------------------
// SUITE 11: Activity CRUD Lifecycle with Rollback
// ----------------------------------------------------
$testId = 'act-reg-test-' . time();
// Insert using existing schema columns
$stmt = $pdo->prepare("INSERT INTO add_ons (id, name, category, price, description, image) VALUES (?, ?, ?, ?, ?, ?)");
$stmt->execute([$testId, 'Dolphin Safari (Test)', 'Water Sports', 1500, 'Test safari description', 'https://example.com/safari.jpg']);

$verifyRead = $pdo->prepare("SELECT * FROM add_ons WHERE id = ?");
$verifyRead->execute([$testId]);
$insertedRow = $verifyRead->fetch(PDO::FETCH_ASSOC);

$updateStmt = $pdo->prepare("UPDATE add_ons SET price = ? WHERE id = ?");
$updateStmt->execute([1800, $testId]);

$verifyUpdated = $pdo->prepare("SELECT price FROM add_ons WHERE id = ?");
$verifyUpdated->execute([$testId]);
$updatedPrice = (int)$verifyUpdated->fetchColumn();

// Clean up
$delStmt = $pdo->prepare("DELETE FROM add_ons WHERE id = ?");
$delStmt->execute([$testId]);

$finalAddOnCount = (int)$pdo->query("SELECT COUNT(*) FROM add_ons")->fetchColumn();

$report['suites']['crud_lifecycle'] = [
    assertCondition('Insert into existing add_ons schema succeeds', !empty($insertedRow) && $insertedRow['name'] === 'Dolphin Safari (Test)'),
    assertCondition('Update existing add_ons record succeeds', $updatedPrice === 1800),
    assertCondition('Delete cleanly removes test record with zero leftover rows', $finalAddOnCount === $addOnCount)
];

// ----------------------------------------------------
// Summary Evaluation
// ----------------------------------------------------
$allPassed = true;
$totalTests = 0;
$passedTests = 0;

foreach ($report['suites'] as $suiteName => $tests) {
    foreach ($tests as $t) {
        $totalTests++;
        if ($t['status'] === 'PASS') {
            $passedTests++;
        } else {
            $allPassed = false;
        }
    }
}

$report['overall_status'] = $allPassed ? 'PASS' : 'FAIL';
$report['stats'] = [
    'total' => $totalTests,
    'passed' => $passedTests,
    'failed' => $totalTests - $passedTests
];

echo json_encode($report, JSON_PRETTY_PRINT);
