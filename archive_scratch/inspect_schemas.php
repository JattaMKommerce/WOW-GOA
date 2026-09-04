<?php
$pdo = new PDO('sqlite:' . __DIR__ . '/../backend/database.sqlite');
$tables = ['bookings', 'cars', 'bikes', 'hotels', 'packages', 'wallet_transactions', 'users', 'payment_gateways'];

foreach ($tables as $table) {
    echo "=== TABLE: $table ===\n";
    $stmt = $pdo->query("PRAGMA table_info($table)");
    $cols = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($cols as $c) {
        echo "  - {$c['name']} ({$c['type']})\n";
    }
    echo "\n";
}
