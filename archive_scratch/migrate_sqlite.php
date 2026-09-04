<?php
$sqlitePath = __DIR__ . '/../backend/database.sqlite';
$pdo = new PDO("sqlite:$sqlitePath");
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$queries = [
    "CREATE TABLE IF NOT EXISTS payment_gateways (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(255) UNIQUE,
        type VARCHAR(50),
        config_json TEXT,
        instructions TEXT,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );",
    "CREATE TABLE IF NOT EXISTS admin_subscriptions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        admin_id VARCHAR(100),
        plan_id INTEGER,
        billing_cycle VARCHAR(50) DEFAULT 'monthly',
        status VARCHAR(50) DEFAULT 'pending_verification',
        start_date DATE,
        end_date DATE,
        payment_method VARCHAR(50),
        payment_proof VARCHAR(255),
        payment_reference VARCHAR(255),
        notes TEXT,
        reviewed_by VARCHAR(100),
        reviewed_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );",
    "CREATE TABLE IF NOT EXISTS subscription_plans (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(100) UNIQUE,
        price INT DEFAULT 0,
        monthly_price INT DEFAULT 0,
        quarterly_price INT DEFAULT 0,
        yearly_price INT DEFAULT 0,
        trial_days INT DEFAULT 0,
        duration_days INT DEFAULT 30,
        features TEXT,
        features_json TEXT,
        max_hotels INT DEFAULT 10,
        max_vehicles INT DEFAULT 10,
        max_packages INT DEFAULT 10,
        max_leads INT DEFAULT 100,
        max_staff INT DEFAULT 5,
        max_hotel_vendors INT DEFAULT 5,
        max_vehicle_vendors INT DEFAULT 5,
        max_bookings INT DEFAULT 500,
        storage_limit INT DEFAULT 5,
        storage_mb INT DEFAULT 500,
        commission_percent INT DEFAULT 10,
        status VARCHAR(50) DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );",
    "CREATE TABLE IF NOT EXISTS commission_rules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        vendor_type VARCHAR(50) NOT NULL,
        vendor_id VARCHAR(100) DEFAULT 'all',
        commission_type VARCHAR(20) DEFAULT 'percentage',
        commission_value DECIMAL(10,2) DEFAULT 10.00,
        notes TEXT,
        updated_by VARCHAR(100),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (vendor_type, vendor_id)
    );",
    "CREATE TABLE IF NOT EXISTS settlements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        admin_id VARCHAR(100) DEFAULT 'admin',
        vendor_id VARCHAR(100),
        amount INT,
        bank_details TEXT,
        method VARCHAR(50),
        status VARCHAR(50) DEFAULT 'pending',
        reference VARCHAR(255),
        remarks TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );",
    "CREATE TABLE IF NOT EXISTS wallets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        admin_id VARCHAR(100) DEFAULT 'admin',
        vendor_id VARCHAR(100) UNIQUE,
        balance INT DEFAULT 0,
        reserved_commission INT DEFAULT 0,
        minimum_balance INT DEFAULT 0,
        negative_limit INT DEFAULT -1000,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );",
    "CREATE TABLE IF NOT EXISTS payment_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        razorpay_enabled BOOLEAN DEFAULT 0,
        upi_enabled BOOLEAN DEFAULT 1,
        razorpay_key VARCHAR(255) DEFAULT NULL,
        razorpay_secret VARCHAR(255) DEFAULT NULL,
        upi_id VARCHAR(255) DEFAULT NULL,
        upi_qr_url VARCHAR(255) DEFAULT NULL
    );",
    "INSERT OR IGNORE INTO payment_gateways (name, type, config_json, instructions, is_active) VALUES
        ('Bank Transfer', 'bank_transfer', '{\"account_name\":\"TripGalileo Pvt Ltd\",\"bank_name\":\"HDFC Bank\",\"account_number\":\"1234567890\",\"ifsc\":\"HDFC0001234\",\"branch\":\"Goa Main Branch\"}', 'Transfer to the above account and upload payment screenshot with UTR reference.', 1),
        ('UPI Payment', 'upi', '{\"upi_id\":\"tripgalileo@upi\"}', 'Send payment to the UPI ID above and upload the payment screenshot.', 1);",
    "INSERT OR IGNORE INTO subscription_plans (name, monthly_price, quarterly_price, yearly_price, trial_days, features, max_hotel_vendors, max_vehicle_vendors, max_hotels, max_vehicles, max_packages, max_bookings, storage_limit, status) VALUES
        ('Starter', 999, 2699, 9999, 7, '[\"Up to 5 Hotel Vendors\",\"Up to 5 Vehicle Vendors\",\"Up to 20 Hotels\",\"Up to 50 Vehicles\",\"Up to 10 Packages\",\"Email Support\"]', 5, 5, 20, 50, 10, 500, 5, 'active'),
        ('Professional', 2499, 6999, 24999, 14, '[\"Up to 20 Hotel Vendors\",\"Up to 20 Vehicle Vendors\",\"Up to 100 Hotels\",\"Up to 200 Vehicles\",\"Up to 50 Packages\",\"Advanced Analytics\",\"Priority Support\"]', 20, 20, 100, 200, 50, 2000, 20, 'active'),
        ('Enterprise', 4999, 13999, 49999, 30, '[\"Unlimited Hotel Vendors\",\"Unlimited Vehicle Vendors\",\"Unlimited Hotels\",\"Unlimited Vehicles\",\"Unlimited Packages\",\"Dedicated Account Manager\",\"24/7 Phone Support\",\"Custom Domain\"]', 999, 999, 999, 999, 999, 99999, 100, 'active');"
];

foreach ($queries as $q) {
    try {
        $pdo->exec($q);
        echo "Executed query successfully.\n";
    } catch (Exception $e) {
        echo "Query warning/error: " . $e->getMessage() . "\n";
    }
}
echo "Done!\n";
