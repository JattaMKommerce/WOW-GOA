<?php
// Utility script to verify driver assignments and statuses
require_once __DIR__ . '/config.php';

try {
    $sqlitePath = __DIR__ . '/database.sqlite';
    $pdo = new PDO("sqlite:$sqlitePath");
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $dStmt = $pdo->query("SELECT id, name, phone, email, status FROM drivers");
    $drivers = $dStmt->fetchAll(PDO::FETCH_ASSOC);

    header('Content-Type: application/json');
    echo json_encode(['drivers' => $drivers], JSON_PRETTY_PRINT);
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
