<?php
$pdo = new PDO("sqlite:" . __DIR__ . "/../backend/database.sqlite");
echo "=== USERS SCHEMA ===\n";
$stmt = $pdo->query("PRAGMA table_info(users)");
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));

echo "=== LEADS SCHEMA ===\n";
$stmt = $pdo->query("PRAGMA table_info(leads)");
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));

echo "=== ALL USERS IN DB ===\n";
$stmt = $pdo->query("SELECT id, username, email, role, status, admin_id FROM users");
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
