<?php
define('DB_HOST', 'localhost');
define('DB_PORT', '3306');
define('DB_NAME', 'tripgalileo');
define('DB_USER', 'root');
define('DB_PASS', ''); 

try {
    $pdo = new PDO("mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=utf8mb4", DB_USER, DB_PASS);
    $stmt = $pdo->query("SELECT id, username, role FROM users WHERE role = 'hotel_vendor'");
    $vendors = $stmt->fetchAll(PDO::FETCH_ASSOC);
    print_r($vendors);
} catch (Exception $e) {
    echo $e->getMessage();
}
