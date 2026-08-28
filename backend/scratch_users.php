<?php
require 'c:/xampp/htdocs/Tripgalileo/backend/config.php';
try {
    $pdo = new PDO('mysql:host='.DB_HOST.';dbname='.DB_NAME, DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $stmt = $pdo->query('SELECT id, username, email, role, password FROM users LIMIT 20');
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach($rows as $r) {
        echo $r['id'] . ' | ' . $r['role'] . ' | ' . $r['username'] . ' | ' . $r['email'] . ' | hash: ' . substr($r['password'],0,30) . PHP_EOL;
    }
} catch(Exception $e) {
    echo 'ERROR: ' . $e->getMessage();
}
