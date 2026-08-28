<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

define('DB_HOST', 'localhost');
define('DB_PORT', '3306');
define('DB_NAME', 'tripgalileo');
define('DB_USER', 'root');
define('DB_PASS', '');

try {
    $pdo = new PDO("mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME, DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    $q = "CREATE TABLE IF NOT EXISTS ai_leads (id VARCHAR(255) PRIMARY KEY, name VARCHAR(255) NOT NULL, phone VARCHAR(255) NOT NULL, created_at VARCHAR(255) NOT NULL)";
    $pdo->exec($q);
    echo "Table ai_leads created successfully.\n";
} catch (PDOException $e) {
    echo "DB Error: " . $e->getMessage() . "\n";
}
?>
