<?php
$pdo = new PDO('sqlite:' . __DIR__ . '/../backend/database.sqlite');
$stmt = $pdo->query('PRAGMA table_info(bookings)');
$cols = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo "Columns in bookings table:\n";
foreach ($cols as $col) {
    echo "- " . $col['name'] . " (" . $col['type'] . ")\n";
}
