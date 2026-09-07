<?php
$pdo = new PDO('sqlite:backend/database.sqlite');
$rows = $pdo->query("SELECT id, name, item_name, type, created_at FROM bookings ORDER BY rowid DESC LIMIT 5")->fetchAll(PDO::FETCH_ASSOC);
echo json_encode($rows, JSON_PRETTY_PRINT);
