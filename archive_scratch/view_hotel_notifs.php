<?php
$pdo = new PDO('sqlite:backend/database.sqlite');
$rows = $pdo->query("SELECT * FROM hotel_notifications")->fetchAll(PDO::FETCH_ASSOC);
echo json_encode($rows, JSON_PRETTY_PRINT);
