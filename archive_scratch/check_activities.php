<?php
$pdo = new PDO('sqlite:backend/database.sqlite');
$rows = $pdo->query("SELECT id, type, item_id, item_name FROM bookings")->fetchAll(PDO::FETCH_ASSOC);
$found = [];
foreach ($rows as $r) {
    $str = ($r['type'] ?? '') . ' ' . ($r['item_id'] ?? '') . ' ' . ($r['item_name'] ?? '');
    if (stripos($str, 'activ') !== false || stripos($str, 'sight') !== false) {
        $found[] = $r;
    }
}
echo json_encode($found, JSON_PRETTY_PRINT);
