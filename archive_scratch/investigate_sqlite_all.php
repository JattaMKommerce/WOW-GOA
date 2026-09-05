<?php
$pdo = new PDO('sqlite:' . __DIR__ . '/../backend/database.sqlite');
$tables = $pdo->query("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")->fetchAll(PDO::FETCH_COLUMN);

echo "=== ALL TABLES IN backend/database.sqlite ===\n";
foreach ($tables as $t) {
    if (strpos($t, 'sqlite_') === 0) continue;
    try {
        $count = $pdo->query("SELECT COUNT(*) FROM `$t`")->fetchColumn();
        echo sprintf("%-30s : %d rows\n", $t, $count);
    } catch (Exception $e) {
        echo sprintf("%-30s : ERROR (%s)\n", $t, $e->getMessage());
    }
}
