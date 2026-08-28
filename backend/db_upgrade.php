<?php
define('DB_HOST', 'localhost');
define('DB_PORT', '3306');
define('DB_NAME', 'tripgalileo');
define('DB_USER', 'root');
define('DB_PASS', '');

try {
    $pdo = new PDO("mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=utf8mb4", DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // 1. Markups Table Upgrade (Drop and Recreate for clean start, since old one was basic)
    $pdo->exec("DROP TABLE IF EXISTS `markups`");
    $pdo->exec("CREATE TABLE `markups` (
        `id` int(11) NOT NULL AUTO_INCREMENT,
        `rule_name` varchar(255) NOT NULL,
        `vendor_type` varchar(50) DEFAULT 'all',
        `vendor_id` varchar(100) DEFAULT 'all',
        `entity_type` varchar(50) DEFAULT 'all',
        `entity_id` varchar(100) DEFAULT 'all',
        `category` varchar(100) DEFAULT 'all',
        `amount` int(11) DEFAULT 0,
        `percentage` decimal(5,2) DEFAULT 0,
        `start_date` date DEFAULT NULL,
        `end_date` date DEFAULT NULL,
        `min_price` int(11) DEFAULT 0,
        `max_price` int(11) DEFAULT 999999,
        `priority` int(11) DEFAULT 0,
        `status` varchar(20) DEFAULT 'Active',
        `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (`id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");
    echo "Markups table created. \n";

    // 2. Add columns to bookings
    $columnsToAdd = [
        "vendor_base_amount" => "int(11) DEFAULT 0",
        "admin_markup" => "int(11) DEFAULT 0",
        "platform_fee" => "int(11) DEFAULT 0",
        "vendor_payable" => "int(11) DEFAULT 0",
        "platform_earning" => "int(11) DEFAULT 0",
        "settlement_status" => "varchar(50) DEFAULT 'Not Ready'"
    ];

    foreach($columnsToAdd as $col => $def) {
        try {
            $pdo->exec("ALTER TABLE `bookings` ADD COLUMN `$col` $def");
            echo "Added $col to bookings.\n";
        } catch(PDOException $e) {
            echo "Column $col already exists.\n";
        }
    }

    // 3. Vendor Settlements
    $pdo->exec("CREATE TABLE IF NOT EXISTS `vendor_settlements` (
        `id` varchar(50) NOT NULL,
        `vendor_id` varchar(100) NOT NULL,
        `vendor_type` varchar(50) NOT NULL,
        `booking_ids_json` text NOT NULL,
        `total_booking_value` int(11) NOT NULL,
        `total_vendor_base` int(11) NOT NULL,
        `deductions` int(11) DEFAULT 0,
        `refund_adjustments` int(11) DEFAULT 0,
        `final_payable` int(11) NOT NULL,
        `status` varchar(50) DEFAULT 'Assigned to Accountant',
        `assigned_accountant` varchar(100) DEFAULT NULL,
        `payment_method` varchar(50) DEFAULT NULL,
        `txn_ref` varchar(255) DEFAULT NULL,
        `payment_date` datetime DEFAULT NULL,
        `proof_image` text DEFAULT NULL,
        `admin_instructions` text DEFAULT NULL,
        `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (`id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");
    echo "vendor_settlements created. \n";

    // 4. Refunds
    $pdo->exec("CREATE TABLE IF NOT EXISTS `refunds` (
        `id` varchar(50) NOT NULL,
        `booking_id` varchar(50) NOT NULL,
        `customer_name` varchar(255) NOT NULL,
        `vendor_id` varchar(100) NOT NULL,
        `original_payment` int(11) NOT NULL,
        `refund_amount` int(11) NOT NULL,
        `cancellation_charge` int(11) DEFAULT 0,
        `vendor_adjustment` int(11) DEFAULT 0,
        `platform_adjustment` int(11) DEFAULT 0,
        `reason` text DEFAULT NULL,
        `status` varchar(50) DEFAULT 'Requested',
        `requested_date` datetime DEFAULT CURRENT_TIMESTAMP,
        `processed_date` datetime DEFAULT NULL,
        PRIMARY KEY (`id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");
    echo "refunds created. \n";

    // 5. Activity Log
    $pdo->exec("CREATE TABLE IF NOT EXISTS `activity_log` (
        `id` int(11) NOT NULL AUTO_INCREMENT,
        `user_id` varchar(100) NOT NULL,
        `role` varchar(50) NOT NULL,
        `action` varchar(255) NOT NULL,
        `entity_type` varchar(100) NOT NULL,
        `entity_id` varchar(100) NOT NULL,
        `details` text DEFAULT NULL,
        `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (`id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");
    echo "activity_log created. \n";
    
    // Add accountant role to users if not exists (we don't need a schema change, just an insert, but we'll manage via frontend)

    echo "Database upgrade completed successfully.";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
