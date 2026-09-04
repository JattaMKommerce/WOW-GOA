<?php
$pdo = new PDO('sqlite:' . __DIR__ . '/../backend/database.sqlite');
echo "=== ALL SQLITE TABLES ===\n";
$tables = $pdo->query("SELECT name FROM sqlite_master WHERE type='table'")->fetchAll(PDO::FETCH_COLUMN);
print_r($tables);

foreach (['hotels', 'rooms', 'hotel_rooms', 'bookings', 'reviews', 'notifications', 'activity_log', 'rate_plans', 'staff'] as $t) {
    if (in_array($t, $tables)) {
        echo "\n=== SCHEMA: $t ===\n";
        foreach ($pdo->query("PRAGMA table_info($t)")->fetchAll(PDO::FETCH_ASSOC) as $c) {
            echo " - {$c['name']} ({$c['type']})\n";
        }
    }
}
