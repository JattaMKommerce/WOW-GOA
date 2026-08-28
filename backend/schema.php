<?php
define('DB_HOST', 'localhost');
define('DB_PORT', '3306');
define('DB_NAME', 'tripgalileo');
define('DB_USER', 'root');
define('DB_PASS', '');

header('Content-Type: application/json');

try {
    $pdo = new PDO("mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=utf8mb4", DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    $stmt = $pdo->query("SHOW TABLES");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);

    $schema = [];
    foreach($tables as $table) {
        try {
            $stmt = $pdo->query("SHOW COLUMNS FROM $table");
            $schema[$table] = $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch(Exception $e) {
            $schema[$table] = "Error";
        }
    }

    file_put_contents('schema_full.json', json_encode($schema, JSON_PRETTY_PRINT));
    echo "Saved to schema_full.json";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
