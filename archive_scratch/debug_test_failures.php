<?php
$pdo = new PDO('sqlite:' . __DIR__ . '/../backend/database.sqlite');
$stmt = $pdo->query("SELECT id, name, allow_commission, allow_non_commission, wallet_balance, credit_limit FROM users WHERE id = 'b2b_6a99006753753'");
echo "=== USER PROFILE ===\n";
print_r($stmt->fetch(PDO::FETCH_ASSOC));

$tStmt = $pdo->query("SELECT * FROM b2b_wallet_transactions WHERE partner_id = 'b2b_6a99006753753' ORDER BY created_at DESC LIMIT 5");
echo "\n=== RECENT TRANSACTIONS ===\n";
print_r($tStmt->fetchAll(PDO::FETCH_ASSOC));
