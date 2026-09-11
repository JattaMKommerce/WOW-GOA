<?php
$pdo = new PDO('sqlite:' . __DIR__ . '/../backend/database.sqlite');
$stmt = $pdo->query("SELECT * FROM add_ons");
echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC), JSON_PRETTY_PRINT);
