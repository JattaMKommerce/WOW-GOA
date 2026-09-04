<?php
require_once __DIR__ . '/../backend/config.php';
try {
    $pdo = new PDO("mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=utf8mb4", DB_USER, DB_PASS);
    echo "Connected to MySQL\n";
    $stmt = $pdo->query("SHOW TABLES");
    print_r($stmt->fetchAll(PDO::FETCH_COLUMN));
} catch (Exception $e) {
    echo "MySQL error: " . $e->getMessage() . "\nFalling back to SQLite\n";
    $pdo = new PDO("sqlite:" . __DIR__ . "/../backend/database.sqlite");
    $stmt = $pdo->query("SELECT name FROM sqlite_master WHERE type='table'");
    print_r($stmt->fetchAll(PDO::FETCH_COLUMN));
}
