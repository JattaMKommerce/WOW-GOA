<?php
$pdo = new PDO('sqlite:' . __DIR__ . '/../backend/database.sqlite');

echo "=== 1. HOTELS IN database.sqlite (count: " . $pdo->query('SELECT COUNT(*) FROM hotels')->fetchColumn() . ") ===\n";
$stmt = $pdo->query('SELECT id, name, location, price, rating FROM hotels');
echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC), JSON_PRETTY_PRINT) . "\n\n";

echo "=== 2. CARS IN database.sqlite (count: " . $pdo->query('SELECT COUNT(*) FROM cars')->fetchColumn() . ") ===\n";
$stmt = $pdo->query('SELECT * FROM cars');
echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC), JSON_PRETTY_PRINT) . "\n\n";

echo "=== 3. BIKES IN database.sqlite (count: " . $pdo->query('SELECT COUNT(*) FROM bikes')->fetchColumn() . ") ===\n";
$stmt = $pdo->query('SELECT * FROM bikes');
echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC), JSON_PRETTY_PRINT) . "\n\n";

echo "=== 4. PACKAGES IN database.sqlite (count: " . $pdo->query('SELECT COUNT(*) FROM packages')->fetchColumn() . ") ===\n";
$stmt = $pdo->query('SELECT id, name, duration, price, destination FROM packages');
echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC), JSON_PRETTY_PRINT) . "\n\n";

echo "=== 5. USERS IN database.sqlite (count: " . $pdo->query('SELECT COUNT(*) FROM users')->fetchColumn() . ") ===\n";
$stmt = $pdo->query('SELECT id, name, email, role, phone FROM users LIMIT 15');
echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC), JSON_PRETTY_PRINT) . "\n\n";

echo "=== 6. BOOKINGS SUMMARY IN database.sqlite ===\n";
$stmt = $pdo->query('SELECT COUNT(*) as total_bookings, MIN(created_at) as earliest, MAX(created_at) as latest FROM bookings');
echo json_encode($stmt->fetch(PDO::FETCH_ASSOC), JSON_PRETTY_PRINT) . "\n\n";

echo "=== 7. DRIVERS IN database.sqlite (count: " . $pdo->query('SELECT COUNT(*) FROM drivers')->fetchColumn() . ") ===\n";
$stmt = $pdo->query('SELECT id, name, phone, status, vehicle_details FROM drivers');
echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC), JSON_PRETTY_PRINT) . "\n\n";

echo "=== 8. LEADS IN database.sqlite (count: " . $pdo->query('SELECT COUNT(*) FROM leads')->fetchColumn() . ") ===\n";
$stmt = $pdo->query('SELECT id, name, phone, email, source, status FROM leads LIMIT 10');
echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC), JSON_PRETTY_PRINT) . "\n\n";
