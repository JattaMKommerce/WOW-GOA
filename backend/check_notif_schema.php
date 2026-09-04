<?php
$pdo = new PDO('sqlite:' . __DIR__ . '/database.sqlite');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

echo "Notifications table schema:\n";
echo "===========================\n";
$cols = $pdo->query("PRAGMA table_info(notifications)")->fetchAll(PDO::FETCH_ASSOC);
foreach ($cols as $c) {
    echo $c['name'] . " | " . $c['type'] . " | " . ($c['dflt_value'] ?: 'NULL') . "\n";
}

echo "\n";
echo "Sample notifications:\n";
echo "====================\n";
$notifs = $pdo->query("SELECT id, user_id, role, type, title FROM notifications ORDER BY created_at DESC LIMIT 5")->fetchAll(PDO::FETCH_ASSOC);
foreach ($notifs as $n) {
    echo "ID: {$n['id']} | User: {$n['user_id']} | Role: {$n['role']} | Type: {$n['type']} | Title: {$n['title']}\n";
}
