<?php
$pdo = new PDO('sqlite:' . __DIR__ . '/../backend/database.sqlite');
$pdo->exec("DELETE FROM cars WHERE id LIKE 'car-multi-%' OR id LIKE 'car-test-%' OR id LIKE 'car-http-%'");
$pdo->exec("DELETE FROM bikes WHERE id LIKE 'bike-multi-%' OR id LIKE 'bike-test-%' OR id LIKE 'bike-http-%' OR id LIKE 'bike-test-direct'");
echo "Cleaned up test vehicle records from DB.\n";
