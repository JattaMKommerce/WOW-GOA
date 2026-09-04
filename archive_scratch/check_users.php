<?php
$pdo = new PDO('mysql:host=localhost;dbname=tripgalileo', 'root', '');
$packages = $pdo->query("SELECT * FROM packages")->fetchAll(PDO::FETCH_ASSOC);
print_r($packages);
