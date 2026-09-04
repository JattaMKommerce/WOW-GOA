<?php
$sqlitePath = __DIR__ . '/../backend/database.sqlite';
$pdo = new PDO("sqlite:$sqlitePath");
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

echo "=== USERS TABLE ===\n";
try {
    $stmt = $pdo->query("SELECT * FROM users");
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($users, JSON_PRETTY_PRINT) . "\n\n";
} catch (Exception $e) {
    echo "Users error: " . $e->getMessage() . "\n";
}

echo "=== HOTEL_STAFF TABLE (IF EXISTS) ===\n";
try {
    $stmt = $pdo->query("SELECT * FROM hotel_staff");
    $staff = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($staff, JSON_PRETTY_PRINT) . "\n\n";
} catch (Exception $e) {
    echo "hotel_staff error: " . $e->getMessage() . "\n";
}

echo "=== ANY OTHER TABLES WITH STAFF / TEAM / MEMBERS ===\n";
$tables = $pdo->query("SELECT name FROM sqlite_master WHERE type='table'")->fetchAll(PDO::FETCH_COLUMN);
echo "All tables: " . implode(', ', $tables) . "\n";
