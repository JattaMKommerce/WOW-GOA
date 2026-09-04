<?php
$pdo = new PDO('sqlite:' . __DIR__ . '/../backend/database.sqlite');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
$cols = $pdo->query("PRAGMA table_info(packages)")->fetchAll(PDO::FETCH_ASSOC);
foreach ($cols as $col) {
    echo $col['name'] . " (" . $col['type'] . ")\n";
}
