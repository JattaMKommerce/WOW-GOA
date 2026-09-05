<?php
$pdo = new PDO('sqlite:' . __DIR__ . '/../backend/database.sqlite');
$stmt = $pdo->query('SELECT id, name, image, images_json FROM packages');
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
