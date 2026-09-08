<?php
$pdo = new PDO('sqlite:backend/database.sqlite');
$user = $pdo->query("SELECT id, username, email, role, status FROM users WHERE username='hotel_vendor' OR role='hotel_vendor'")->fetchAll(PDO::FETCH_ASSOC);
echo json_encode($user, JSON_PRETTY_PRINT);
