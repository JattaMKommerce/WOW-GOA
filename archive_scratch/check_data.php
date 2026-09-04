<?php
$pdo = new PDO('sqlite:' . __DIR__ . '/../backend/database.sqlite');
echo "CARS count: " . $pdo->query("SELECT COUNT(*) FROM cars")->fetchColumn() . "\n";
echo "BIKES count: " . $pdo->query("SELECT COUNT(*) FROM bikes")->fetchColumn() . "\n";
echo "BOOKINGS count: " . $pdo->query("SELECT COUNT(*) FROM bookings")->fetchColumn() . "\n";
echo "USERS count: " . $pdo->query("SELECT COUNT(*) FROM users")->fetchColumn() . "\n";
echo "VENDORS count: " . $pdo->query("SELECT COUNT(*) FROM vendors")->fetchColumn() . "\n";

$b = $pdo->query("SELECT * FROM bookings LIMIT 5")->fetchAll(PDO::FETCH_ASSOC);
echo "\nSample bookings:\n";
print_r($b);
$u = $pdo->query("SELECT id, username, email, role, phone, city, name FROM users WHERE role='vendor' LIMIT 5")->fetchAll(PDO::FETCH_ASSOC);
echo "\nVendor users:\n";
print_r($u);
