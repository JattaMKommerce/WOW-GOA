<?php
require_once 'config.php';
header('Content-Type: application/json');

define('DB_HOST', 'localhost');
define('DB_PORT', '3306');
define('DB_NAME', 'tripgalileo');
define('DB_USER', 'root');
define('DB_PASS', '');

// Connect to DB
$conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
if ($conn->connect_error) {
    die(json_encode(['status' => 'error', 'message' => 'Connection failed: ' . $conn->connect_error]));
}

$queries = [
    // Create Wallets table
    "CREATE TABLE IF NOT EXISTS `wallets` (
        `id` varchar(50) NOT NULL,
        `vendor_id` varchar(50) NOT NULL,
        `admin_id` varchar(50) NOT NULL,
        `balance` decimal(10,2) NOT NULL DEFAULT '0.00',
        `currency` varchar(10) NOT NULL DEFAULT 'INR',
        `updated_at` datetime NOT NULL,
        PRIMARY KEY (`id`),
        UNIQUE KEY `vendor_id` (`vendor_id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;",

    // Create Wallet Transactions table
    "CREATE TABLE IF NOT EXISTS `wallet_transactions` (
        `id` varchar(50) NOT NULL,
        `wallet_id` varchar(50) NOT NULL,
        `admin_id` varchar(50) NOT NULL,
        `amount` decimal(10,2) NOT NULL,
        `type` varchar(20) NOT NULL, /* credit, debit */
        `description` text NOT NULL,
        `reference_id` varchar(50) DEFAULT NULL,
        `created_at` datetime NOT NULL,
        PRIMARY KEY (`id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;",

    // Create Settlements table
    "CREATE TABLE IF NOT EXISTS `settlements` (
        `id` varchar(50) NOT NULL,
        `vendor_id` varchar(50) NOT NULL,
        `admin_id` varchar(50) NOT NULL,
        `amount` decimal(10,2) NOT NULL,
        `status` varchar(20) NOT NULL DEFAULT 'pending', /* pending, processing, completed, rejected */
        `bank_details` text NOT NULL,
        `reference_id` varchar(100) DEFAULT NULL,
        `created_at` datetime NOT NULL,
        `updated_at` datetime NOT NULL,
        PRIMARY KEY (`id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;",

    // Create Payment Methods table
    "CREATE TABLE IF NOT EXISTS `payment_methods` (
        `id` varchar(50) NOT NULL,
        `user_id` varchar(50) NOT NULL, /* vendor_id or admin_id */
        `type` varchar(50) NOT NULL, /* bank, upi, razorpay */
        `details` text NOT NULL, /* JSON */
        `is_active` tinyint(1) NOT NULL DEFAULT '1',
        `created_at` datetime NOT NULL,
        PRIMARY KEY (`id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;",

    // Add columns to Bookings table
    "ALTER TABLE `bookings` ADD COLUMN IF NOT EXISTS `vendor_id` varchar(50) DEFAULT NULL AFTER `drop_time`;",
    "ALTER TABLE `bookings` ADD COLUMN IF NOT EXISTS `payment_status` varchar(20) NOT NULL DEFAULT 'pending' AFTER `total_paid`;",
    "ALTER TABLE `bookings` ADD COLUMN IF NOT EXISTS `booking_status` varchar(20) NOT NULL DEFAULT 'pending' AFTER `payment_status`;",
    "ALTER TABLE `bookings` ADD COLUMN IF NOT EXISTS `commission_amount` decimal(10,2) NOT NULL DEFAULT '0.00' AFTER `booking_status`;",
    "ALTER TABLE `bookings` ADD COLUMN IF NOT EXISTS `settlement_id` varchar(50) DEFAULT NULL AFTER `commission_amount`;",
    
    // Ensure all tables have admin_id for multi-tenancy (if missing from phase 1)
];

$results = [];
foreach ($queries as $sql) {
    if ($conn->query($sql) === TRUE) {
        $results[] = ["status" => "success", "sql" => substr($sql, 0, 50) . '...'];
    } else {
        $results[] = ["status" => "error", "error" => $conn->error, "sql" => substr($sql, 0, 50) . '...'];
    }
}

$conn->close();
echo json_encode(["status" => "completed", "results" => $results]);
