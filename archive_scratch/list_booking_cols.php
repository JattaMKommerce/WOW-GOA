<?php
$pdo = new PDO('sqlite:backend/database.sqlite');
$cols = $pdo->query("PRAGMA table_info(bookings)")->fetchAll(PDO::FETCH_ASSOC);
echo json_encode(array_column($cols, 'name'), JSON_PRETTY_PRINT);
