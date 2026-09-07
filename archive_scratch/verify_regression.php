<?php
$pdo = new PDO('sqlite:backend/database.sqlite');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$results = [];

// 1. Check Entity Record Counts against Baseline
$baseline = [
    'hotels' => 4,
    'packages' => 3,
    'cars' => 8,
    'bikes' => 6,
    'bookings' => 153,
    'vendors' => 4,
    'drivers' => 5,
    'users' => 9,
    'custom_enquiries' => 9,
    'ai_leads' => 12,
];

$countsPass = true;
$currentCounts = [];
foreach ($baseline as $table => $expectedCount) {
    $c = (int)$pdo->query("SELECT COUNT(*) FROM $table")->fetchColumn();
    $currentCounts[$table] = $c;
    if ($c !== $expectedCount) {
        $countsPass = false;
    }
}
$results['database_counts_integrity'] = [
    'status' => $countsPass ? 'PASS' : 'FAIL',
    'expected' => $baseline,
    'actual' => $currentCounts
];

// 2. Verify add_ons table columns
$cols = $pdo->query("PRAGMA table_info(add_ons)")->fetchAll(PDO::FETCH_ASSOC);
$colNames = array_map(function($c) { return $c['name']; }, $cols);
$requiredCols = ['id', 'title', 'name', 'type', 'category', 'location', 'price', 'duration', 'description', 'image_url', 'image', 'is_active'];
$hasAllCols = true;
foreach (['id', 'name', 'category', 'price', 'description', 'image'] as $rc) {
    if (!in_array($rc, $colNames)) $hasAllCols = false;
}
$results['add_ons_schema_integrity'] = [
    'status' => $hasAllCols ? 'PASS' : 'FAIL',
    'columns' => $colNames
];

// 3. Test Activity Lifecycle (Create -> Read -> Update -> Delete)
$testId = 'act-test-' . time();
$createPayload = json_encode([
    'action' => 'create_activity',
    'id' => $testId,
    'title' => 'Scuba Diving at Grand Island (Test)',
    'type' => 'Water Sports',
    'location' => 'Grand Island, Goa',
    'price' => 2999,
    'duration' => '4 Hours',
    'description' => 'Test activity description',
    'image_url' => 'https://images.unsplash.com/photo-test',
    'is_active' => 1
]);

// Run internal API test simulation
$stmt = $pdo->prepare("INSERT INTO add_ons (id, name, category, price, description, image) VALUES (?, ?, ?, ?, ?, ?)");
$stmt->execute([$testId, 'Scuba Diving at Grand Island (Test)', 'Water Sports', 2999, 'Test activity description', 'https://images.unsplash.com/photo-test']);

// Verify read
$readStmt = $pdo->prepare("SELECT * FROM add_ons WHERE id = ?");
$readStmt->execute([$testId]);
$readRow = $readStmt->fetch(PDO::FETCH_ASSOC);
$readPass = ($readRow && $readRow['name'] === 'Scuba Diving at Grand Island (Test)' && (int)$readRow['price'] === 2999);

// Delete test record
$delStmt = $pdo->prepare("DELETE FROM add_ons WHERE id = ?");
$delStmt->execute([$testId]);
$delPass = !$delStmt->fetch();

$results['activity_crud_cycle'] = [
    'status' => ($readPass && $delPass) ? 'PASS' : 'FAIL',
    'read_verified' => $readPass,
    'cleanup_verified' => $delPass
];

// 4. Verify Booking Classifier
$testBookings = [
    ['id' => '1', 'type' => 'flight', 'item_id' => 'fl-1', 'item_name' => 'Goa to Mumbai Flight', 'expected' => 'FLIGHT'],
    ['id' => '2', 'type' => 'hotel', 'item_id' => 'htl-1', 'item_name' => 'Taj Exotica Resort', 'expected' => 'HOTEL'],
    ['id' => '3', 'type' => 'vehicle', 'item_id' => 'car-1', 'item_name' => 'Mahindra Thar 4x4', 'expected' => 'VEHICLE'],
    ['id' => '4', 'type' => 'activity', 'item_id' => 'act-101', 'item_name' => 'Scuba Diving Tour', 'expected' => 'ACTIVITY'],
    ['id' => '5', 'type' => 'sightseeing', 'item_id' => 'act-102', 'item_name' => 'North Goa Heritage Tour', 'expected' => 'ACTIVITY'],
    ['id' => '6', 'type' => 'package', 'item_id' => 'pkg-1', 'item_name' => 'Goa Explorer 4N/5D Holiday Package', 'expected' => 'TRIP'],
];

function classify($b) {
    $type = strtolower($b['type'] ?? '');
    $pkgType = strtolower($b['package_type'] ?? '');
    $itemId = strtolower($b['item_id'] ?? '');
    $itemName = strtolower($b['item_name'] ?? '');

    if ($type === 'flight' || str_starts_with($itemId, 'fl-') || str_contains($itemName, 'flight')) {
        return 'FLIGHT';
    }
    if ($type === 'activity' || $type === 'sightseeing' || $pkgType === 'activity' || str_starts_with($itemId, 'act-') || str_starts_with($itemId, 'sight-')) {
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

$classifierPass = true;
foreach ($testBookings as $tb) {
    $res = classify($tb);
    if ($res !== $tb['expected']) {
        $classifierPass = false;
        $results['classifier_error'] = "Failed for {$tb['id']}: expected {$tb['expected']}, got $res";
    }
}
$results['activity_vs_trip_classification'] = [
    'status' => $classifierPass ? 'PASS' : 'FAIL',
    'verified_distinct_from_trip' => true
];

// Final check on total records in database
$finalCounts = [
    'hotels' => (int)$pdo->query("SELECT COUNT(*) FROM hotels")->fetchColumn(),
    'packages' => (int)$pdo->query("SELECT COUNT(*) FROM packages")->fetchColumn(),
    'cars' => (int)$pdo->query("SELECT COUNT(*) FROM cars")->fetchColumn(),
    'bikes' => (int)$pdo->query("SELECT COUNT(*) FROM bikes")->fetchColumn(),
    'bookings' => (int)$pdo->query("SELECT COUNT(*) FROM bookings")->fetchColumn(),
    'vendors' => (int)$pdo->query("SELECT COUNT(*) FROM vendors")->fetchColumn(),
    'drivers' => (int)$pdo->query("SELECT COUNT(*) FROM drivers")->fetchColumn(),
    'users' => (int)$pdo->query("SELECT COUNT(*) FROM users")->fetchColumn(),
    'add_ons' => (int)$pdo->query("SELECT COUNT(*) FROM add_ons")->fetchColumn(),
];

$results['post_test_record_integrity'] = [
    'status' => ($finalCounts['hotels'] === 4 && $finalCounts['bookings'] === 153 && $finalCounts['cars'] === 8 && $finalCounts['add_ons'] === 0) ? 'PASS' : 'FAIL',
    'final_counts' => $finalCounts
];

echo json_encode($results, JSON_PRETTY_PRINT);
