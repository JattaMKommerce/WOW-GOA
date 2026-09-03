<?php
header('Content-Type: text/plain');
require_once __DIR__ . '/config.php';

echo "Testing MySQL Connection...\n";
echo "DB_HOST: " . DB_HOST . "\n";
echo "DB_NAME: " . DB_NAME . "\n";
echo "DB_USER: " . DB_USER . "\n";

$dbNamesToTry = [
    DB_NAME,
    'wowgoa_wow goa',
    'wowgoa_wowgoa',
    'wowgoa_wow_goa',
    'wowgoa'
];

foreach (array_unique($dbNamesToTry) as $dbName) {
    try {
        echo "\nAttempting connect to database: '$dbName'...\n";
        $pdo = new PDO("mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . $dbName . ";charset=utf8mb4", DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
        ]);
        echo "SUCCESS! Connected to '$dbName'.\n";
        $tables = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
        echo "Tables found (" . count($tables) . "): " . implode(', ', $tables) . "\n";
        break;
    } catch (Exception $e) {
        echo "FAILED: " . $e->getMessage() . "\n";
    }
}
