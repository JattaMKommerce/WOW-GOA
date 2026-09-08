<?php
$pdo = new PDO('sqlite:backend/database.sqlite');
$tables = $pdo->query("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")->fetchAll(PDO::FETCH_COLUMN);
$data = [];
foreach ($tables as $table) {
    if (str_starts_with($table, 'sqlite_')) continue;
    $count = (int)$pdo->query("SELECT COUNT(*) FROM `{$table}`")->fetchColumn();
    $cols = $pdo->query("PRAGMA table_info(`{$table}`)")->fetchAll(PDO::FETCH_ASSOC);
    $colNames = array_column($cols, 'name');
    $data[$table] = [
        'count' => $count,
        'columns' => $colNames
    ];
}
echo json_encode($data, JSON_PRETTY_PRINT);
