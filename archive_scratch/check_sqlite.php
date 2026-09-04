<?php
require_once __DIR__ . '/../backend/config.php';
try {
    $pdo = new PDO("sqlite:" . __DIR__ . '/../backend/database.sqlite');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $tables = $pdo->query("SELECT name FROM sqlite_master WHERE type='table'")->fetchAll(PDO::FETCH_COLUMN);
    echo "SQLite Tables: " . implode(', ', $tables) . "\n";
    $hasGw = in_array('payment_gateways', $tables);
    echo "Has payment_gateways: " . ($hasGw ? 'YES' : 'NO') . "\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
