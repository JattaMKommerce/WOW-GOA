<?php
$pdo = new PDO('mysql:host=localhost;dbname=tripgalileo', 'root', '');
print_r($pdo->query('DESCRIBE users')->fetchAll(PDO::FETCH_ASSOC));
