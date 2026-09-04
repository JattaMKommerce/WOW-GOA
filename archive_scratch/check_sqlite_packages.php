<?php
$pdo = new PDO('sqlite:' . __DIR__ . '/../backend/database.sqlite');
$stmt = $pdo->query('SELECT id, name, duration, day_wise_itinerary FROM packages');
$pkgs = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo "Total packages in SQLite: " . count($pkgs) . "\n";
foreach ($pkgs as $p) {
    echo "ID: " . $p['id'] . " | Name: " . $p['name'] . " | Duration: " . $p['duration'] . " | Itinerary: " . (empty($p['day_wise_itinerary']) ? 'EMPTY' : 'HAS_DATA') . "\n";
}
