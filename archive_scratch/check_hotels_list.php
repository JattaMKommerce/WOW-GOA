<?php
$pdo = new PDO('sqlite:' . __DIR__ . '/../backend/database.sqlite');
echo "=== ALL HOTELS IN DATABASE ===\n";
foreach ($pdo->query("SELECT id, name, vendor_id, admin_id, stars, price, hotel_status, is_available FROM hotels")->fetchAll(PDO::FETCH_ASSOC) as $h) {
    echo "ID: {$h['id']} | Name: {$h['name']} | Vendor: {$h['vendor_id']} | Admin: {$h['admin_id']} | Status: {$h['hotel_status']} | Avail: {$h['is_available']}\n";
}
