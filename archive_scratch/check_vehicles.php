<?php
$pdo = new PDO('sqlite:d:/wow goa/Tripgalileo (2)/Tripgalileo/backend/database.sqlite');
echo "--- BIKES ---\n";
$stmt = $pdo->query('SELECT id, name, category, image, images_json FROM bikes');
if ($stmt) print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
echo "--- CARS ---\n";
$stmt2 = $pdo->query('SELECT id, name, category, image, images_json FROM cars');
if ($stmt2) print_r($stmt2->fetchAll(PDO::FETCH_ASSOC));
echo "--- BOOKING COLUMNS ---\n";
$stmt3 = $pdo->query('PRAGMA table_info(bookings)');
if ($stmt3) print_r($stmt3->fetchAll(PDO::FETCH_ASSOC));
echo "--- BOOKINGS ROWS ---\n";
$stmt4 = $pdo->query('SELECT * FROM bookings ORDER BY rowid DESC LIMIT 5');
if ($stmt4) print_r($stmt4->fetchAll(PDO::FETCH_ASSOC));
