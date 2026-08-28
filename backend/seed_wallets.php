<?php
define('DB_HOST', 'localhost');
define('DB_PORT', '3306');
define('DB_NAME', 'tripgalileo');
define('DB_USER', 'root');
define('DB_PASS', '');

try {
    $pdo = new PDO("mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=utf8mb4", DB_USER, DB_PASS);
    $stmt = $pdo->query("SELECT id FROM vendors");
    $vendors = $stmt->fetchAll();

    foreach ($vendors as $vendor) {
        $vendor_id = $vendor['id'];
        
        $wallet_stmt = $pdo->prepare("SELECT * FROM wallets WHERE vendor_id = ?");
        $wallet_stmt->execute([$vendor_id]);
        $wallet = $wallet_stmt->fetch();
        
        if (!$wallet) {
            $insert = $pdo->prepare("INSERT INTO wallets (vendor_id, balance, minimum_balance) VALUES (?, 5000, 0)");
            $insert->execute([$vendor_id]);
            echo "Created wallet for $vendor_id with 5000 balance.\n";
        } else {
            if ($wallet['balance'] == 0) {
                $update = $pdo->prepare("UPDATE wallets SET balance = 5000 WHERE vendor_id = ?");
                $update->execute([$vendor_id]);
                echo "Updated wallet for $vendor_id to 5000 balance.\n";
            } else {
                echo "Wallet for $vendor_id already has balance ({$wallet['balance']}).\n";
            }
        }
    }
    echo "Done.\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
