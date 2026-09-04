<?php
$pdo = new PDO('sqlite:' . __DIR__ . '/../backend/database.sqlite');
$pdo->exec("UPDATE users SET allow_commission = 1, allow_non_commission = 1 WHERE id = 'b2b_6a99006753753'");
echo "Both Commission and Non-Commission Net modes enabled for partner!\n";
