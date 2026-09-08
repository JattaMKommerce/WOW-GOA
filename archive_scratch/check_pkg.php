<?php
$pdo = new PDO('sqlite:' . __DIR__ . '/../backend/database.sqlite');
$stmt = $pdo->prepare('SELECT * FROM packages WHERE id = ?');
$stmt->execute(['pkg-1788152139516']);
echo json_encode($stmt->fetch(PDO::FETCH_ASSOC), JSON_PRETTY_PRINT) . "\n";
