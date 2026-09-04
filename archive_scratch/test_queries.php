<?php
$pdo = new PDO('sqlite:' . __DIR__ . '/../backend/database.sqlite');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

// Test car insert
try {
    $stmt = $pdo->prepare("INSERT INTO cars (id, vendor_id, name, category, price, seating, fuel, transmission, image, images_json, location, is_available, admin_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)");
    $testCarId = 'car-test-' . time();
    $stmt->execute([$testCarId, 'vendor-1', 'Test Car', 'Sedan', 2500, '5 Seater', 'Petrol', 'Automatic', '', null, 'Panaji, Goa', 'admin']);
    echo "Car insert SUCCESS: $testCarId\n";
    $pdo->exec("DELETE FROM cars WHERE id='$testCarId'");
    echo "Car delete SUCCESS\n";
} catch (Exception $e) {
    echo "Car error: " . $e->getMessage() . "\n";
}

// Test bike insert
try {
    $stmt = $pdo->prepare("INSERT INTO bikes (id, vendor_id, name, category, price, engine, fuel, mileage, image, images_json, location, is_available, admin_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)");
    $testBikeId = 'bike-test-' . time();
    $stmt->execute([$testBikeId, 'vendor-1', 'Test Bike', 'Cruiser', 1200, '350cc', 'Petrol', '35 km/l', '', null, 'Calangute, Goa', 'admin']);
    echo "Bike insert SUCCESS: $testBikeId\n";
    $pdo->exec("DELETE FROM bikes WHERE id='$testBikeId'");
    echo "Bike delete SUCCESS\n";
} catch (Exception $e) {
    echo "Bike error: " . $e->getMessage() . "\n";
}

// Test booking insert
try {
    $stmt = $pdo->prepare("INSERT INTO bookings (id, name, phone, email, license, pickup_loc, pickup_date, pickup_time, drop_date, drop_time, item_id, item_name, booking_days, total_amount, amount_paid, remaining_amount, total_paid, status, payment_status, customizations, created_at, payment_method, admin_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    $testBkId = 'TG-TEST-' . time();
    $stmt->execute([
        $testBkId, 'John Doe', '9876543210', 'john@example.com', 'DL12345', 'Goa Airport', '2026-09-01', '10:00 AM', '2026-09-05', '10:00 AM',
        'car-1', 'Thar 4x4', 4, 10000, 10000, 0, 10000, 'Confirmed', 'Paid', '', date('Y-m-d H:i:s'), 'UPI', 'admin'
    ]);
    echo "Booking insert SUCCESS: $testBkId\n";
    $pdo->exec("DELETE FROM bookings WHERE id='$testBkId'");
    echo "Booking delete SUCCESS\n";
} catch (Exception $e) {
    echo "Booking error: " . $e->getMessage() . "\n";
}
