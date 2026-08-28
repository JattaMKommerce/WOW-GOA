<?php
define('DB_HOST', 'localhost');
define('DB_PORT', '3306');
define('DB_NAME', 'tripgalileo');
define('DB_USER', 'root');
define('DB_PASS', ''); 

try {
    $pdo = new PDO("mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=utf8mb4", DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Check if column exists
    $stmt = $pdo->query("SHOW COLUMNS FROM hotels LIKE 'blocked_dates'");
    if ($stmt->rowCount() === 0) {
        $pdo->exec("ALTER TABLE hotels ADD COLUMN blocked_dates TEXT DEFAULT NULL AFTER description");
        echo "Column 'blocked_dates' added successfully.\n";
    } else {
        echo "Column 'blocked_dates' already exists.\n";
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
