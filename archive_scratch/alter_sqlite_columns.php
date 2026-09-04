<?php
$sqlitePath = __DIR__ . '/../backend/database.sqlite';
$pdo = new PDO("sqlite:$sqlitePath");
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$alters = [
    "ALTER TABLE subscription_plans ADD COLUMN trial_days INT DEFAULT 0",
    "ALTER TABLE subscription_plans ADD COLUMN features TEXT",
    "ALTER TABLE subscription_plans ADD COLUMN max_hotel_vendors INT DEFAULT 5",
    "ALTER TABLE subscription_plans ADD COLUMN max_vehicle_vendors INT DEFAULT 5",
    "ALTER TABLE subscription_plans ADD COLUMN max_packages INT DEFAULT 10",
    "ALTER TABLE subscription_plans ADD COLUMN max_bookings INT DEFAULT 500",
    "ALTER TABLE subscription_plans ADD COLUMN storage_limit INT DEFAULT 5",
    "ALTER TABLE subscription_plans ADD COLUMN monthly_price INT DEFAULT 0",
    "ALTER TABLE subscription_plans ADD COLUMN quarterly_price INT DEFAULT 0",
    "ALTER TABLE subscription_plans ADD COLUMN yearly_price INT DEFAULT 0",
    "ALTER TABLE subscription_plans ADD COLUMN status VARCHAR(50) DEFAULT 'active'",
    "ALTER TABLE site_configs ADD COLUMN booking_fee_deduction INT DEFAULT 10",
    "ALTER TABLE site_configs ADD COLUMN min_wallet_recharge INT DEFAULT 5000",
    "ALTER TABLE wallet_transactions ADD COLUMN admin_id VARCHAR(100) DEFAULT 'admin'",
    "ALTER TABLE wallet_transactions ADD COLUMN wallet_id INT DEFAULT NULL",
    "ALTER TABLE wallet_transactions ADD COLUMN payment_proof VARCHAR(255) DEFAULT NULL",
    "ALTER TABLE wallet_transactions ADD COLUMN reference_id VARCHAR(255) DEFAULT NULL",
    "ALTER TABLE admin_subscriptions ADD COLUMN billing_cycle VARCHAR(50) DEFAULT 'monthly'",
    "ALTER TABLE admin_subscriptions ADD COLUMN notes TEXT DEFAULT NULL",
    "ALTER TABLE admin_subscriptions ADD COLUMN reviewed_by VARCHAR(100) DEFAULT NULL",
    "ALTER TABLE admin_subscriptions ADD COLUMN reviewed_at TIMESTAMP NULL",
];

foreach ($alters as $q) {
    try {
        $pdo->exec($q);
        echo "Alter applied: $q\n";
    } catch (Exception $e) {
        // column may already exist
    }
}

// Seed plans if none or update
$plansCount = $pdo->query("SELECT COUNT(*) FROM subscription_plans")->fetchColumn();
if ($plansCount == 0) {
    $pdo->exec("INSERT OR IGNORE INTO subscription_plans (name, monthly_price, quarterly_price, yearly_price, trial_days, features, max_hotel_vendors, max_vehicle_vendors, max_hotels, max_vehicles, max_packages, max_bookings, storage_limit, status) VALUES
        ('Starter', 999, 2699, 9999, 7, '[\"Up to 5 Hotel Vendors\",\"Up to 5 Vehicle Vendors\",\"Up to 20 Hotels\",\"Up to 50 Vehicles\",\"Up to 10 Packages\",\"Email Support\"]', 5, 5, 20, 50, 10, 500, 5, 'active'),
        ('Professional', 2499, 6999, 24999, 14, '[\"Up to 20 Hotel Vendors\",\"Up to 20 Vehicle Vendors\",\"Up to 100 Hotels\",\"Up to 200 Vehicles\",\"Up to 50 Packages\",\"Advanced Analytics\",\"Priority Support\"]', 20, 20, 100, 200, 50, 2000, 20, 'active'),
        ('Enterprise', 4999, 13999, 49999, 30, '[\"Unlimited Hotel Vendors\",\"Unlimited Vehicle Vendors\",\"Unlimited Hotels\",\"Unlimited Vehicles\",\"Unlimited Packages\",\"Dedicated Account Manager\",\"24/7 Phone Support\",\"Custom Domain\"]', 999, 999, 999, 999, 999, 99999, 100, 'active')
    ");
}
echo "Finished alters & plan check.\n";
