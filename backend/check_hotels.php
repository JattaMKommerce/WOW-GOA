<?php
$pdo = new PDO('sqlite:' . __DIR__ . '/database.sqlite');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

echo "Hotels in database:\n";
echo "===================\n";
$hotels = $pdo->query("SELECT id, name, vendor_id FROM hotels LIMIT 10")->fetchAll(PDO::FETCH_ASSOC);
foreach ($hotels as $h) {
    echo $h['id'] . " | " . $h['name'] . " | vendor: " . ($h['vendor_id'] ?: 'NULL') . "\n";
}
