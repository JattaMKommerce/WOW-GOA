<?php
$pdo = new PDO('sqlite:' . __DIR__ . '/../backend/database.sqlite');
$stmt = $pdo->query("SELECT * FROM payment_gateways");
$gateways = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo "=== PAYMENT GATEWAYS IN DATABASE ===\n";
print_r($gateways);
