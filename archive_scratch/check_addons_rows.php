<?php
$pdo = new PDO('sqlite:backend/database.sqlite');
$rows = $pdo->query("SELECT * FROM add_ons")->fetchAll(PDO::FETCH_ASSOC);
echo json_encode($rows, JSON_PRETTY_PRINT);
