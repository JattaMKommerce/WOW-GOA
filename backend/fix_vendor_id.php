<?php
define('DB_HOST', 'localhost');
define('DB_PORT', '3306');
define('DB_NAME', 'tripgalileo');
define('DB_USER', 'root');
define('DB_PASS', ''); 

try {
    $pdo = new PDO("mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=utf8mb4", DB_USER, DB_PASS);
    
    // Update all hotels that are currently 'admin' or the wrong vendor to the current user's vendor ID
    // User is logged in as hotel@gmail.com which is vendor-1784879827318
    $correct_vendor_id = 'vendor-1784879827318';
    
    $stmt = $pdo->prepare("UPDATE hotels SET vendor_id = ? WHERE vendor_id = 'admin' OR vendor_id = 'vendor-1784530213785'");
    $stmt->execute([$correct_vendor_id]);
    
    echo "Successfully updated " . $stmt->rowCount() . " hotels to your vendor account!";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
