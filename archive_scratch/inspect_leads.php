<?php
$pdo = new PDO("sqlite:" . __DIR__ . "/../backend/database.sqlite");
function getTableSchema($pdo, $table) {
    echo "=== SCHEMA FOR $table ===\n";
    $stmt = $pdo->query("PRAGMA table_info($table)");
    print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
    echo "=== RECORDS FOR $table ===\n";
    $stmt = $pdo->query("SELECT * FROM $table LIMIT 10");
    print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
}
getTableSchema($pdo, 'ai_leads');
getTableSchema($pdo, 'custom_enquiries');
