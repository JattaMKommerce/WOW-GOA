<?php
$pdo = new PDO('sqlite:' . __DIR__ . '/../backend/database.sqlite');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

try {
    $stmt = $pdo->prepare("INSERT INTO bikes (id, vendor_id, name, category, price, engine, fuel, mileage, image, images_json, location, is_available, admin_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)");
    $stmt->execute([
        'bike-test-direct',
        'vendor-1',
        'TVS XL 100',
        'Scooter',
        300,
        '100cc',
        'Petrol',
        '40 km/l',
        'http://localhost:8000/uploads/img1.png',
        json_encode(['http://localhost:8000/uploads/img1.png', 'http://localhost:8000/uploads/img2.png']),
        'Goa Delivery',
        'admin'
    ]);
    echo "SUCCESS\n";
    $pdo->exec("DELETE FROM bikes WHERE id = 'bike-test-direct'");
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
