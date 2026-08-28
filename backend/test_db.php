<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

define('DB_HOST', 'localhost');
define('DB_PORT', '3306');
define('DB_NAME', 'tripgalileo');
define('DB_USER', 'root');
define('DB_PASS', '');

$passwords = [
    '', 'root', 'Root@123', 'Root123', 'root123', 'Admin@123', 'Admin123', 'admin', 
    '1234', '12345', '123456', '12345678', 'password', 'Password@123', 'Password123', 
    'tripgalileo', 'wowgoa', 'rajda', 'rajda123', 'rajda@123', 'Rajda@123', 'root@localhost',
    'mysql', 'Mysql@123', '123'
];

$connected = false;
foreach ($passwords as $p) {
    try {
        $pdo = new PDO("mysql:host=localhost;port=3306", "root", $p);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        echo ">>> FOUND WORKING MYSQL ROOT PASSWORD: '$p'\n";
        $connected = true;
        break;
    } catch (PDOException $e) {
        // try next
    }
}
if (!$connected) {
    echo "Could not find password in dictionary list.\n";
}
?>
