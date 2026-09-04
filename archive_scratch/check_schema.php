<?php
$pdo = new PDO('sqlite:' . __DIR__ . '/../backend/database.sqlite');
echo "=== BIKES COLUMNS ===\n";
foreach ($pdo->query("PRAGMA table_info(bikes)")->fetchAll(PDO::FETCH_ASSOC) as $c) {
    echo $c['name'] . "\n";
}
echo "\n=== CARS COLUMNS ===\n";
foreach ($pdo->query("PRAGMA table_info(cars)")->fetchAll(PDO::FETCH_ASSOC) as $c) {
    echo $c['name'] . "\n";
}
