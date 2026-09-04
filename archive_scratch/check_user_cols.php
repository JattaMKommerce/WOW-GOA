<?php
$pdo = new PDO('sqlite:' . __DIR__ . '/../backend/database.sqlite');
$stmt = $pdo->query("PRAGMA table_info(users)");
$cols = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo "Existing columns in 'users':\n";
foreach ($cols as $c) {
    echo "- " . $c['name'] . " (" . $c['type'] . ")\n";
}
