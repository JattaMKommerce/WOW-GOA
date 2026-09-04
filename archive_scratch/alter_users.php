<?php
$pdo = new PDO('mysql:host=localhost;dbname=tripgalileo', 'root', '');
$pdo->exec("ALTER TABLE users ADD COLUMN billing_price INT DEFAULT 0;");
echo "Done";
