<?php
$db = new PDO('sqlite:database.sqlite');
$stmt = $db->query("SELECT * FROM bookings WHERE name LIKE '%shetty%' OR phone LIKE '%5555566666%' OR id LIKE '%284585%'");
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo json_encode($rows, JSON_PRETTY_PRINT);
