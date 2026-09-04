<?php
$pdo = new PDO('sqlite:' . __DIR__ . '/../backend/database.sqlite');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

echo "==================================================\n";
echo "   RUNNING VENDOR CONSOLE COMPREHENSIVE BACKEND TESTS\n";
echo "==================================================\n\n";

$passCount = 0;
$failCount = 0;

function test($desc, $fn) {
    global $passCount, $failCount;
    try {
        $fn();
        echo "✅ PASS: $desc\n";
        $passCount++;
    } catch (Exception $e) {
        echo "❌ FAIL: $desc — " . $e->getMessage() . "\n";
        $failCount++;
    }
}

// 1. Test Car Creation
$testCarId = "car-test-" . time();
test("Add Car Vehicle to cars table", function() use ($pdo, $testCarId) {
    $stmt = $pdo->prepare("INSERT INTO cars (id, vendor_id, name, category, price, seating, fuel, transmission, image, location, is_available, admin_id, mileage) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)");
    $stmt->execute([
        $testCarId, 'vendor', 'Mahindra Thar 4x4 Hardtop', 'SUV', 3500, '4 Seater', 'Diesel', 'Automatic', 'http://localhost:8000/uploads/img_test.jpg', 'Goa Airport', 'admin', '15 km/l'
    ]);

    $stmtCheck = $pdo->prepare("SELECT * FROM cars WHERE id = ?");
    $stmtCheck->execute([$testCarId]);
    $car = $stmtCheck->fetch(PDO::FETCH_ASSOC);
    if (!$car || $car['name'] !== 'Mahindra Thar 4x4 Hardtop' || intval($car['price']) !== 3500) {
        throw new Exception("Car data mismatch");
    }
});

// 2. Test Bike Creation
$testBikeId = "bike-test-" . time();
test("Add Bike Vehicle to bikes table", function() use ($pdo, $testBikeId) {
    $stmt = $pdo->prepare("INSERT INTO bikes (id, vendor_id, name, category, price, engine, fuel, mileage, image, location, is_available, admin_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)");
    $stmt->execute([
        $testBikeId, 'vendor', 'Royal Enfield Hunter 350', 'Cruiser', 1100, '350cc', 'Petrol', '36 km/l', 'http://localhost:8000/uploads/img_bike.jpg', 'Calangute, Goa', 'admin'
    ]);

    $stmtCheck = $pdo->prepare("SELECT * FROM bikes WHERE id = ?");
    $stmtCheck->execute([$testBikeId]);
    $bike = $stmtCheck->fetch(PDO::FETCH_ASSOC);
    if (!$bike || $bike['name'] !== 'Royal Enfield Hunter 350' || intval($bike['price']) !== 1100) {
        throw new Exception("Bike data mismatch");
    }
});

// 3. Test Pricing Update
test("Update Vehicle Pricing in database", function() use ($pdo, $testCarId) {
    $stmt = $pdo->prepare("UPDATE cars SET price = ? WHERE id = ?");
    $stmt->execute([4200, $testCarId]);

    $stmtCheck = $pdo->prepare("SELECT price FROM cars WHERE id = ?");
    $stmtCheck->execute([$testCarId]);
    $newPrice = $stmtCheck->fetchColumn();
    if (intval($newPrice) !== 4200) {
        throw new Exception("Price update failed. Expected 4200, got $newPrice");
    }
});

// 4. Test Availability Toggle
test("Toggle Vehicle Availability (0 and 1)", function() use ($pdo, $testCarId) {
    $stmt = $pdo->prepare("UPDATE cars SET is_available = 0 WHERE id = ?");
    $stmt->execute([$testCarId]);
    $val0 = $pdo->query("SELECT is_available FROM cars WHERE id = '$testCarId'")->fetchColumn();
    if (intval($val0) !== 0) throw new Exception("Availability toggle to 0 failed");

    $stmt = $pdo->prepare("UPDATE cars SET is_available = 1 WHERE id = ?");
    $stmt->execute([$testCarId]);
    $val1 = $pdo->query("SELECT is_available FROM cars WHERE id = '$testCarId'")->fetchColumn();
    if (intval($val1) !== 1) throw new Exception("Availability toggle to 1 failed");
});

// 5. Test Booking Creation
$testBookingId = "TG-" . rand(100000, 999999);
test("Create Vehicle Booking with Customer Details", function() use ($pdo, $testBookingId, $testCarId) {
    $stmt = $pdo->prepare("INSERT INTO bookings (id, name, phone, email, license, pickup_loc, pickup_date, pickup_time, drop_date, drop_time, item_id, item_name, booking_days, total_amount, amount_paid, remaining_amount, total_paid, status, payment_status, customizations, created_at, payment_method, admin_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([
        $testBookingId, 'Aarav Mehta', '+91 9821123456', 'aarav@example.com', 'DL-04-2022091', 'Goa Airport', '2026-09-02', '10:00 AM', '2026-09-06', '10:00 AM',
        $testCarId, 'Mahindra Thar 4x4 Hardtop', 4, 16800, 16800, 0, 16800, 'Confirmed', 'Paid', '', date('Y-m-d H:i:s'), 'UPI', 'admin'
    ]);

    $stmtCheck = $pdo->prepare("SELECT * FROM bookings WHERE id = ?");
    $stmtCheck->execute([$testBookingId]);
    $bk = $stmtCheck->fetch(PDO::FETCH_ASSOC);
    if (!$bk || $bk['name'] !== 'Aarav Mehta' || intval($bk['total_amount']) !== 16800) {
        throw new Exception("Booking creation mismatch");
    }
});

// 6. Test Booking Update
test("Update Booking Details (Dates, Status, Payment)", function() use ($pdo, $testBookingId) {
    $stmt = $pdo->prepare("UPDATE bookings SET pickup_date = ?, drop_date = ?, status = ?, payment_status = ? WHERE id = ?");
    $stmt->execute(['2026-09-03', '2026-09-07', 'Pickup', 'Paid', $testBookingId]);

    $stmtCheck = $pdo->prepare("SELECT pickup_date, status FROM bookings WHERE id = ?");
    $stmtCheck->execute([$testBookingId]);
    $updated = $stmtCheck->fetch(PDO::FETCH_ASSOC);
    if (!$updated || $updated['pickup_date'] !== '2026-09-03' || $updated['status'] !== 'Pickup') {
        throw new Exception("Booking update failed");
    }
});

// 7. Test Customer Aggregation from Bookings
test("Customer Association from real booking", function() use ($pdo, $testBookingId) {
    $stmt = $pdo->prepare("SELECT name, phone, email, COUNT(*) as total_bookings, SUM(total_amount) as total_spent FROM bookings WHERE phone = ? GROUP BY phone");
    $stmt->execute(['+91 9821123456']);
    $cust = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$cust || $cust['name'] !== 'Aarav Mehta' || intval($cust['total_spent']) < 16800) {
        throw new Exception("Customer aggregation failed");
    }
});

// 8. Test Vendor Profile Update
test("Vendor Profile Update in users and vendors table", function() use ($pdo) {
    $stmt = $pdo->prepare("UPDATE users SET name = ?, phone = ?, city = ? WHERE role = 'vendor'");
    $stmt->execute(['Goa Premium Fleet Solutions', '+91 9988776655', 'Panaji, Goa']);

    $stmtCheck = $pdo->query("SELECT name, phone, city FROM users WHERE role = 'vendor' LIMIT 1");
    $u = $stmtCheck->fetch(PDO::FETCH_ASSOC);
    if (!$u || $u['name'] !== 'Goa Premium Fleet Solutions' || $u['city'] !== 'Panaji, Goa') {
        throw new Exception("User profile update failed");
    }
});

// 9. Cleanup Test Records
test("Cleanup test vehicles and bookings", function() use ($pdo, $testCarId, $testBikeId, $testBookingId) {
    $pdo->exec("DELETE FROM cars WHERE id = '$testCarId'");
    $pdo->exec("DELETE FROM bikes WHERE id = '$testBikeId'");
    $pdo->exec("DELETE FROM bookings WHERE id = '$testBookingId'");
});

echo "\n==================================================\n";
echo "   TEST SUMMARY: $passCount PASSED, $failCount FAILED\n";
echo "==================================================\n";
