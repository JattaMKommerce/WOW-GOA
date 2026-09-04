<?php
$pdo = new PDO('sqlite:backend/database.sqlite');
$stmt = $pdo->query("PRAGMA table_info(leads)");
echo "=== LEADS COLUMNS ===\n";
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));

$stmt = $pdo->query("SELECT * FROM leads LIMIT 5");
echo "\n=== SAMPLE LEADS ===\n";
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));

$stmt = $pdo->query("SELECT id, username, name, email, role, status FROM users WHERE role IN ('admin', 'subadmin', 'agent')");
echo "\n=== ADMIN / SUBADMIN USERS ===\n";
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
