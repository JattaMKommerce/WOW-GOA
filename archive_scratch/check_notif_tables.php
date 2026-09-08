<?php
$pdo = new PDO('sqlite:backend/database.sqlite');
$tables = ['notifications', 'hotel_notifications'];
$out = [];
foreach ($tables as $t) {
    $exists = $pdo->query("SELECT count(*) FROM sqlite_master WHERE type='table' AND name='{$t}'")->fetchColumn();
    if ($exists) {
        $cols = $pdo->query("PRAGMA table_info(`{$t}`)")->fetchAll(PDO::FETCH_ASSOC);
        $count = (int)$pdo->query("SELECT COUNT(*) FROM `{$t}`")->fetchColumn();
        $out[$t] = [
            'exists' => true,
            'count' => $count,
            'cols' => array_column($cols, 'name')
        ];
    } else {
        $out[$t] = ['exists' => false];
    }
}
echo json_encode($out, JSON_PRETTY_PRINT);
