<?php
require_once __DIR__ . '/../backend/config.php';
try {
    $pdo = new PDO("mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=utf8mb4", DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    echo "MySQL connected successfully!\n";
} catch (Exception $e) {
    echo "MySQL connection failed: " . $e->getMessage() . "\n";
}
