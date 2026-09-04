<?php
$sqlitePath = __DIR__ . '/../backend/database.sqlite';
$pdo = new PDO("sqlite:$sqlitePath");
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$pdo->exec("
CREATE TABLE IF NOT EXISTS leads (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(255) DEFAULT '',
    source VARCHAR(100) DEFAULT 'Hotel Enquiries',
    service VARCHAR(255) DEFAULT '',
    assigned_to VARCHAR(100) DEFAULT 'Unassigned',
    status VARCHAR(50) DEFAULT 'New',
    budget VARCHAR(100) DEFAULT '',
    notes TEXT DEFAULT '',
    admin_id VARCHAR(50) DEFAULT 'admin',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
");

echo "Table 'leads' created / verified successfully in SQLite.\n";

// Let's check table columns
$stmt = $pdo->query("PRAGMA table_info(leads)");
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
