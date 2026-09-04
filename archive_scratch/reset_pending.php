<?php
$pdo = new PDO('sqlite:' . __DIR__ . '/../backend/database.sqlite');
$pdo->exec("UPDATE users SET status = 'pending', approved_at = NULL, approved_by = NULL, allow_commission = 0, allow_non_commission = 0 WHERE id = 'b2b_6a99006753753'");
echo "Partner reset to pending successfully!\n";
