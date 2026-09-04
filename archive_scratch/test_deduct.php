<?php
$pdo = new PDO('sqlite:' . __DIR__ . '/../backend/database.sqlite');
$stmt = $pdo->query("SELECT id, wallet_balance, typeof(wallet_balance) as t, credit_limit, typeof(credit_limit) as ct FROM users WHERE id = 'b2b_6a99006753753'");
print_r($stmt->fetch(PDO::FETCH_ASSOC));

$finalPayable = 3304.00;
$creditLimit = 0.00;
$id = 'b2b_6a99006753753';

$deduct = $pdo->prepare("UPDATE users SET wallet_balance = wallet_balance - ? WHERE id = ? AND (CAST(wallet_balance AS REAL) + CAST(? AS REAL)) >= CAST(? AS REAL)");
$deduct->execute([$finalPayable, $id, $creditLimit, $finalPayable]);
echo "Rows affected: " . $deduct->rowCount() . "\n";
