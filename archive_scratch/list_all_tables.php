<?php
$pdo = new PDO('sqlite:' . __DIR__ . '/../backend/database.sqlite');
$stmt = $pdo->query("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
$tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
echo "Database Tables:\n";
foreach ($tables as $t) {
    echo "- $t\n";
}
