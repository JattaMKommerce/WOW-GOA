<?php
try {
    $pdo = new PDO('mysql:host=localhost;dbname=tripgalileo', 'root', '');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $sql = file_get_contents('tripgalileo_mysql.sql');
    $pdo->exec($sql);
    echo "SQL imported successfully.\n";
} catch (PDOException $e) {
    echo "Database error: " . $e->getMessage() . "\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
