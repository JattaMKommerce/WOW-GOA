<?php
require_once 'api.php';
$sql = file_get_contents(__DIR__ . '/migrations/flights_schema.sql');
try {
    $pdo->exec($sql);
    echo "Migration successful!";
} catch (PDOException $e) {
    echo "Migration failed: " . $e->getMessage();
}
