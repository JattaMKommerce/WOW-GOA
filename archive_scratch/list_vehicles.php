<?php
$pdo = new PDO('sqlite:' . __DIR__ . '/../backend/database.sqlite');
echo "=== ALL CARS IN DB ===\n";
foreach ($pdo->query("SELECT id, vendor_id, name, price FROM cars")->fetchAll(PDO::FETCH_ASSOC) as $c) {
    echo "ID: {$c['id']} | Vendor: {$c['vendor_id']} | Name: {$c['name']} | Price: {$c['price']}\n";
}
echo "\n=== ALL BIKES IN DB ===\n";
foreach ($pdo->query("SELECT id, vendor_id, name, price FROM bikes")->fetchAll(PDO::FETCH_ASSOC) as $b) {
    echo "ID: {$b['id']} | Vendor: {$b['vendor_id']} | Name: {$b['name']} | Price: {$b['price']}\n";
}
