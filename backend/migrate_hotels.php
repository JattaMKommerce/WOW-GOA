<?php
require_once 'api.php';

try {
    $pdo->exec("ALTER TABLE hotels ADD COLUMN vendor_id VARCHAR(50) DEFAULT NULL");
} catch(Exception $e) {}

try {
    $pdo->exec("ALTER TABLE hotels ADD COLUMN description TEXT DEFAULT NULL");
} catch(Exception $e) {}

try {
    $pdo->exec("ALTER TABLE hotels ADD COLUMN images_json TEXT DEFAULT NULL");
} catch(Exception $e) {}

try {
    $pdo->exec("ALTER TABLE hotels ADD COLUMN location VARCHAR(255) DEFAULT NULL");
    $pdo->exec("UPDATE hotels SET location = area WHERE location IS NULL");
} catch(Exception $e) {}

echo "Migration done.";
