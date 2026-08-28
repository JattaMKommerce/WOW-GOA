<?php
$pdo = new PDO('mysql:host=localhost;port=3306;dbname=tripgalileo', 'root', '');
$pdo->exec('DELETE FROM cars; DELETE FROM bikes;');
echo "Vehicles deleted from database\n";
?>
