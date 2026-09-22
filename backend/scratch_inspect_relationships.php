<?php
$pdo = new PDO('sqlite:database.sqlite');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

echo "=== TABLES AND ROW COUNTS ===\n";
$tables = $pdo->query("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")->fetchAll(PDO::FETCH_COLUMN);

foreach ($tables as $table) {
    try {
        $count = $pdo->query("SELECT COUNT(*) FROM `$table`")->fetchColumn();
        echo str_pad($table, 35) . ": $count\n";
    } catch (Exception $e) {
        echo str_pad($table, 35) . ": Error ({$e->getMessage()})\n";
    }
}

echo "\n=== FOREIGN KEYS & REFERENCES TO BOOKINGS OR USERS ===\n";
foreach ($tables as $table) {
    $fks = $pdo->query("PRAGMA foreign_key_list(`$table`)")->fetchAll(PDO::FETCH_ASSOC);
    if (!empty($fks)) {
        echo "Table: $table\n";
        foreach ($fks as $fk) {
            echo "  -> references {$fk['table']} ({$fk['from']} -> {$fk['to']})\n";
        }
    }
}

echo "\n=== COLUMNS IN BOOKINGS ===\n";
$cols = $pdo->query("PRAGMA table_info(bookings)")->fetchAll(PDO::FETCH_ASSOC);
foreach ($cols as $c) {
    echo "  {$c['name']} ({$c['type']})\n";
}

echo "\n=== USERS BREAKDOWN BY ROLE ===\n";
$roles = $pdo->query("SELECT role, COUNT(*) as c FROM users GROUP BY role")->fetchAll(PDO::FETCH_ASSOC);
foreach ($roles as $r) {
    echo "  Role: " . ($r['role'] ?: '(NULL)') . " -> {$r['c']}\n";
}

echo "\n=== NON-CUSTOMER USERS (MUST PRESERVE) ===\n";
$preserved = $pdo->query("SELECT id, username, name, email, role FROM users WHERE role != 'customer' OR role IS NULL")->fetchAll(PDO::FETCH_ASSOC);
foreach ($preserved as $p) {
    echo "  [{$p['role']}] ID: {$p['id']} | User: {$p['username']} | Name: {$p['name']}\n";
}
