<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

$host = 'localhost';
$port = '3306';
$db   = 'tripgalileo';
$user = 'root';
$pass = '';

try {
    echo "1. Connecting to MySQL server at $host:$port...\n";
    $pdo = new PDO("mysql:host=$host;port=$port", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "2. Creating database '$db' if not exists...\n";
    $pdo->exec("CREATE DATABASE IF NOT EXISTS `$db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;");
    echo "   Database '$db' ready.\n";

    echo "3. Connecting to database '$db'...\n";
    $pdo = new PDO("mysql:host=$host;port=$port;dbname=$db;charset=utf8mb4", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    echo "4. Importing tripgalileo_mysql.sql...\n";
    $sqlFile = __DIR__ . '/tripgalileo_mysql.sql';
    if (file_exists($sqlFile)) {
        $sql = file_get_contents($sqlFile);
        $pdo->exec($sql);
        echo "   tripgalileo_mysql.sql imported successfully.\n";
    }

    $crmFile = __DIR__ . '/../setup_crm.sql';
    if (file_exists($crmFile)) {
        echo "5. Importing setup_crm.sql...\n";
        $sqlCrm = file_get_contents($crmFile);
        $pdo->exec($sqlCrm);
        echo "   setup_crm.sql imported successfully.\n";
    }

    echo "6. Running schema migrations & column additions...\n";
    $alters = [
        "ALTER TABLE packages ADD COLUMN package_type VARCHAR(100) DEFAULT 'Complete Package'",
        "ALTER TABLE packages ADD COLUMN flights_included VARCHAR(255) DEFAULT NULL",
        "ALTER TABLE packages ADD COLUMN food_included VARCHAR(255) DEFAULT NULL",
        "ALTER TABLE packages ADD COLUMN pickup_drop_included VARCHAR(255) DEFAULT NULL",
        "ALTER TABLE packages ADD COLUMN places_included TEXT DEFAULT NULL",
        "ALTER TABLE packages MODIFY car_included VARCHAR(255) DEFAULT NULL",
        "ALTER TABLE packages MODIFY hotel_included VARCHAR(255) DEFAULT NULL",
        "ALTER TABLE packages ADD COLUMN price_with_flight INT DEFAULT NULL",
        "ALTER TABLE packages ADD COLUMN is_flight_customizable BOOLEAN DEFAULT 0",
        "ALTER TABLE packages ADD COLUMN base_flight_price INT DEFAULT 0",
        "ALTER TABLE packages ADD COLUMN is_cab_customizable BOOLEAN DEFAULT 0",
        "ALTER TABLE packages ADD COLUMN company_cab_price INT DEFAULT 0",
        "ALTER TABLE packages ADD COLUMN day_wise_itinerary TEXT DEFAULT NULL",
        "ALTER TABLE cars ADD COLUMN is_available BOOLEAN DEFAULT 1",
        "ALTER TABLE bikes ADD COLUMN is_available BOOLEAN DEFAULT 1",
        "ALTER TABLE bookings ADD COLUMN customizations TEXT DEFAULT NULL",
        "ALTER TABLE bookings ADD COLUMN payment_method VARCHAR(50) DEFAULT NULL",
        "ALTER TABLE bookings ADD COLUMN payment_proof VARCHAR(255) DEFAULT NULL",
        "CREATE TABLE IF NOT EXISTS payment_settings (
            id INT PRIMARY KEY AUTO_INCREMENT, 
            razorpay_enabled BOOLEAN DEFAULT 0, 
            upi_enabled BOOLEAN DEFAULT 1,
            razorpay_key VARCHAR(255) DEFAULT NULL,
            razorpay_secret VARCHAR(255) DEFAULT NULL,
            upi_id VARCHAR(255) DEFAULT NULL,
            upi_qr_url VARCHAR(255) DEFAULT NULL
        )",
        "CREATE TABLE IF NOT EXISTS ai_leads (id VARCHAR(255) PRIMARY KEY, name VARCHAR(255) NOT NULL, phone VARCHAR(255) NOT NULL, created_at VARCHAR(255) NOT NULL)",
        "ALTER TABLE ai_leads ADD COLUMN chat_history TEXT DEFAULT NULL",
        "CREATE TABLE IF NOT EXISTS flights (id INT PRIMARY KEY AUTO_INCREMENT, airline VARCHAR(100), flight_number VARCHAR(100), departure_time VARCHAR(100), arrival_time VARCHAR(100), price INT, from_loc VARCHAR(50), to_loc VARCHAR(50), duration VARCHAR(50), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)",
        "CREATE TABLE IF NOT EXISTS coupons (id INT PRIMARY KEY AUTO_INCREMENT, code VARCHAR(50) UNIQUE, discount_value INT, is_active BOOLEAN DEFAULT 1, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)",
        "CREATE TABLE IF NOT EXISTS add_ons (id INT PRIMARY KEY AUTO_INCREMENT, title VARCHAR(255), type VARCHAR(50), location VARCHAR(100), price INT, duration VARCHAR(50), description TEXT, image_url VARCHAR(255))",
        "ALTER TABLE packages ADD COLUMN cancellation_policy TEXT DEFAULT NULL",
        "ALTER TABLE packages ADD COLUMN highlights_json TEXT DEFAULT NULL",
        "ALTER TABLE packages ADD COLUMN inclusions_exclusions_json TEXT DEFAULT NULL",
        "ALTER TABLE packages ADD COLUMN package_addons_json TEXT DEFAULT NULL",
        "ALTER TABLE packages ADD COLUMN advance_percentage INT DEFAULT 25",
        "ALTER TABLE cars ADD COLUMN documents_json TEXT DEFAULT NULL",
        "ALTER TABLE bikes ADD COLUMN documents_json TEXT DEFAULT NULL",
        "ALTER TABLE bookings ADD COLUMN status VARCHAR(50) DEFAULT 'Draft'",
        "ALTER TABLE bookings ADD COLUMN payment_status VARCHAR(50) DEFAULT 'Pending'",
        "ALTER TABLE bookings ADD COLUMN traveller_details_json TEXT DEFAULT NULL",
        "ALTER TABLE bookings ADD COLUMN price_breakdown_json TEXT DEFAULT NULL",
        "ALTER TABLE bookings ADD COLUMN total_amount INT DEFAULT 0",
        "ALTER TABLE bookings ADD COLUMN amount_paid INT DEFAULT 0",
        "ALTER TABLE bookings ADD COLUMN remaining_amount INT DEFAULT 0",
        "ALTER TABLE bookings ADD COLUMN payment_due_date DATE DEFAULT NULL",
        "CREATE TABLE IF NOT EXISTS booking_payments (id INT PRIMARY KEY AUTO_INCREMENT, booking_id VARCHAR(255), transaction_id VARCHAR(255), amount INT, method VARCHAR(50), status VARCHAR(50), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)",
        "CREATE TABLE IF NOT EXISTS package_reviews (id INT PRIMARY KEY AUTO_INCREMENT, package_id VARCHAR(255), user_name VARCHAR(255), rating INT, review_text TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)",
        "ALTER TABLE packages ADD COLUMN company_cab_included BOOLEAN DEFAULT 1",
        "ALTER TABLE packages ADD COLUMN company_cab_category VARCHAR(100) DEFAULT NULL",
        "ALTER TABLE cars ADD COLUMN maintenance_dates_json TEXT DEFAULT NULL",
        "ALTER TABLE cars ADD COLUMN vendor_blocked_dates_json TEXT DEFAULT NULL",
        "ALTER TABLE bikes ADD COLUMN maintenance_dates_json TEXT DEFAULT NULL",
        "ALTER TABLE bikes ADD COLUMN vendor_blocked_dates_json TEXT DEFAULT NULL",
        "CREATE TABLE IF NOT EXISTS documents (id INT PRIMARY KEY AUTO_INCREMENT, entity_type VARCHAR(50), entity_id VARCHAR(50), document_type VARCHAR(100), file_url VARCHAR(255), status VARCHAR(50) DEFAULT 'Pending', uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)",
        "CREATE TABLE IF NOT EXISTS vehicle_holds (id INT PRIMARY KEY AUTO_INCREMENT, vehicle_id VARCHAR(50), held_until TIMESTAMP, session_id VARCHAR(100), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)",
        "ALTER TABLE flights ADD COLUMN vendor_id VARCHAR(100) DEFAULT 'admin'",
        "CREATE TABLE IF NOT EXISTS hotels (id INT PRIMARY KEY AUTO_INCREMENT, vendor_id VARCHAR(100) DEFAULT 'admin', name VARCHAR(255), location VARCHAR(100), price INT, amenities TEXT, image_url VARCHAR(255), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)",
        "ALTER TABLE hotels ADD COLUMN vendor_id VARCHAR(100) DEFAULT 'admin'",
        "ALTER TABLE hotels ADD COLUMN stars INT DEFAULT 3",
        "ALTER TABLE hotels ADD COLUMN rating DECIMAL(3,2) DEFAULT 4.00",
        "ALTER TABLE hotels ADD COLUMN badge VARCHAR(50) DEFAULT 'Standard'",
        "ALTER TABLE hotels ADD COLUMN description TEXT DEFAULT NULL",
        "CREATE TABLE IF NOT EXISTS markups (id INT PRIMARY KEY AUTO_INCREMENT, entity_type VARCHAR(50) NOT NULL, vendor_id VARCHAR(100) DEFAULT 'global', markup_type VARCHAR(20) DEFAULT 'flat', markup_value INT DEFAULT 0, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)",
        "ALTER TABLE vendors ADD COLUMN role VARCHAR(50) DEFAULT 'vendor'",
        "ALTER TABLE vendors ADD COLUMN monthly_plan_price INT DEFAULT 0",
        "ALTER TABLE markups ADD COLUMN item_id VARCHAR(100) DEFAULT 'all'",
        "CREATE TABLE IF NOT EXISTS hotel_payment_methods (id INT PRIMARY KEY AUTO_INCREMENT, hotel_id VARCHAR(100), vendor_id VARCHAR(100), method_type VARCHAR(50), details_json TEXT, is_active BOOLEAN DEFAULT 1, status VARCHAR(50) DEFAULT 'Draft', superadmin_remarks TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)",
        "CREATE TABLE IF NOT EXISTS vendor_wallets (id INT PRIMARY KEY AUTO_INCREMENT, vendor_id VARCHAR(100) UNIQUE, balance INT DEFAULT 0, reserved_commission INT DEFAULT 0, minimum_balance INT DEFAULT 0, negative_limit INT DEFAULT -1000, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)",
        "CREATE TABLE IF NOT EXISTS wallet_transactions (id INT PRIMARY KEY AUTO_INCREMENT, vendor_id VARCHAR(100), amount INT, type VARCHAR(50), reference_id VARCHAR(255), status VARCHAR(50) DEFAULT 'Completed', description TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)",
        "ALTER TABLE bookings ADD COLUMN hotel_id VARCHAR(100) DEFAULT NULL",
        "ALTER TABLE bookings ADD COLUMN vendor_id VARCHAR(100) DEFAULT NULL",
        "ALTER TABLE bookings ADD COLUMN commission_amount INT DEFAULT 0",
        "ALTER TABLE bookings ADD COLUMN wallet_deduction_status VARCHAR(50) DEFAULT 'Pending'",
        "ALTER TABLE bookings ADD COLUMN payment_verification_status VARCHAR(50) DEFAULT 'Pending'",
        "ALTER TABLE bookings ADD COLUMN payment_verified_at TIMESTAMP NULL",
        "ALTER TABLE bookings ADD COLUMN payment_verified_by VARCHAR(100) DEFAULT NULL",
        "ALTER TABLE bookings ADD COLUMN hold_until TIMESTAMP NULL",
        "ALTER TABLE users ADD COLUMN admin_id VARCHAR(100) DEFAULT NULL",
        "ALTER TABLE users ADD COLUMN billing_price INT DEFAULT 0",
        "ALTER TABLE users ADD COLUMN status VARCHAR(50) DEFAULT 'active'",
        "ALTER TABLE vendors ADD COLUMN admin_id VARCHAR(100) DEFAULT 'admin'",
        "ALTER TABLE packages ADD COLUMN admin_id VARCHAR(100) DEFAULT 'admin'",
        "ALTER TABLE bookings ADD COLUMN admin_id VARCHAR(100) DEFAULT 'admin'",
        "ALTER TABLE hotels ADD COLUMN admin_id VARCHAR(100) DEFAULT 'admin'",
        "ALTER TABLE cars ADD COLUMN admin_id VARCHAR(100) DEFAULT 'admin'",
        "ALTER TABLE bikes ADD COLUMN admin_id VARCHAR(100) DEFAULT 'admin'",
        "ALTER TABLE flights ADD COLUMN admin_id VARCHAR(100) DEFAULT 'admin'",
        "ALTER TABLE coupons ADD COLUMN admin_id VARCHAR(100) DEFAULT 'admin'",
        "ALTER TABLE destinations ADD COLUMN admin_id VARCHAR(100) DEFAULT 'admin'",
        "CREATE TABLE IF NOT EXISTS site_configs (id INT PRIMARY KEY AUTO_INCREMENT, admin_id VARCHAR(100) UNIQUE, domain VARCHAR(255) DEFAULT NULL, draft_config LONGTEXT DEFAULT NULL, live_config LONGTEXT DEFAULT NULL)",
        "CREATE TABLE IF NOT EXISTS global_settings (id INT PRIMARY KEY AUTO_INCREMENT, siteName VARCHAR(255) DEFAULT 'TripGalileo', currency VARCHAR(50) DEFAULT 'INR', taxRate DECIMAL(5,2) DEFAULT 18, supportEmail VARCHAR(255) DEFAULT 'support@tripgalileo.com', whatsappNumber VARCHAR(100) DEFAULT '', smsProvider VARCHAR(100) DEFAULT 'none', darkMode BOOLEAN DEFAULT 0, maintenanceMode BOOLEAN DEFAULT 0)",
        "CREATE TABLE IF NOT EXISTS wallets (id INT PRIMARY KEY AUTO_INCREMENT, vendor_id VARCHAR(100) UNIQUE, balance INT DEFAULT 0, reserved_commission INT DEFAULT 0, minimum_balance INT DEFAULT 0, negative_limit INT DEFAULT -1000, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)",
        "CREATE TABLE IF NOT EXISTS settlements (id INT PRIMARY KEY AUTO_INCREMENT, vendor_id VARCHAR(100), amount INT, bank_details TEXT, method VARCHAR(50), status VARCHAR(50) DEFAULT 'pending', reference VARCHAR(255), remarks TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)",
        "ALTER TABLE wallets ADD COLUMN admin_id VARCHAR(100) DEFAULT 'admin'",
        "ALTER TABLE settlements ADD COLUMN admin_id VARCHAR(100) DEFAULT 'admin'",
        "ALTER TABLE wallet_transactions ADD COLUMN admin_id VARCHAR(100) DEFAULT 'admin'",
        "ALTER TABLE wallet_transactions ADD COLUMN wallet_id INT DEFAULT NULL",
        "CREATE TABLE IF NOT EXISTS subscription_plans (id INT PRIMARY KEY AUTO_INCREMENT, name VARCHAR(255), monthly_price INT, quarterly_price INT, yearly_price INT, trial_days INT DEFAULT 0, features JSON, max_hotel_vendors INT, max_vehicle_vendors INT, max_hotels INT, max_vehicles INT, max_packages INT, max_bookings INT, storage_limit INT, status VARCHAR(50) DEFAULT 'active', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)",
        "CREATE TABLE IF NOT EXISTS admin_subscriptions (id INT PRIMARY KEY AUTO_INCREMENT, admin_id VARCHAR(100), plan_id INT, status VARCHAR(50) DEFAULT 'pending_verification', start_date DATE, end_date DATE, payment_method VARCHAR(50), payment_proof VARCHAR(255), payment_reference VARCHAR(255), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)",
        "CREATE TABLE IF NOT EXISTS payment_gateways (id INT PRIMARY KEY AUTO_INCREMENT, name VARCHAR(255), type VARCHAR(50), config_json JSON, instructions TEXT, is_active BOOLEAN DEFAULT 1, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)",
        "ALTER TABLE site_configs ADD COLUMN booking_fee_deduction INT DEFAULT 10",
        "ALTER TABLE site_configs ADD COLUMN min_wallet_recharge INT DEFAULT 5000",
        "ALTER TABLE wallet_transactions ADD COLUMN payment_proof VARCHAR(255) DEFAULT NULL",
        "ALTER TABLE wallet_transactions ADD COLUMN reference_id VARCHAR(255) DEFAULT NULL",
        "ALTER TABLE admin_subscriptions ADD COLUMN billing_cycle VARCHAR(50) DEFAULT 'monthly'",
        "ALTER TABLE admin_subscriptions ADD COLUMN notes TEXT DEFAULT NULL",
        "ALTER TABLE admin_subscriptions ADD COLUMN reviewed_by VARCHAR(100) DEFAULT NULL",
        "ALTER TABLE admin_subscriptions ADD COLUMN reviewed_at TIMESTAMP NULL",
        "CREATE TABLE IF NOT EXISTS commission_rules (id INT PRIMARY KEY AUTO_INCREMENT, vendor_type VARCHAR(50) NOT NULL, vendor_id VARCHAR(100) DEFAULT 'all', commission_type VARCHAR(20) DEFAULT 'percentage', commission_value DECIMAL(10,2) DEFAULT 10.00, notes TEXT, updated_by VARCHAR(100), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)"
    ];

    foreach ($alters as $alter) {
        try {
            $pdo->exec($alter);
        } catch (Exception $e) {
            // Ignore if already exists
        }
    }
    echo "   Schema migrations applied.\n";

    echo "7. Ensuring demo users with valid bcrypt passwords...\n";
    $superadminHash = password_hash('superadmin', PASSWORD_BCRYPT);
    $adminHash = password_hash('admin@2026', PASSWORD_BCRYPT);
    $vendorHash = password_hash('admin@2026', PASSWORD_BCRYPT);

    $stmt = $pdo->prepare("INSERT INTO users (id, username, email, password_hash, role, created_at, admin_id) VALUES (?, ?, ?, ?, ?, NOW(), ?) ON DUPLICATE KEY UPDATE password_hash=VALUES(password_hash), role=VALUES(role)");
    
    $stmt->execute(['u-1', 'superadmin', 'superadmin@gmail.com', $superadminHash, 'superadmin', 'superadmin']);
    $stmt->execute(['u-2', 'admin', 'admin@gmail.com', $adminHash, 'admin', 'admin']);
    $stmt->execute(['u-3', 'vendor', 'vendor@tripgalileo.com', $vendorHash, 'vendor', 'admin']);

    echo "   Users seeded:\n";
    echo "   - superadmin@gmail.com (password: superadmin)\n";
    echo "   - admin@gmail.com (password: admin@2026)\n";
    echo "   - vendor@tripgalileo.com (password: admin@2026)\n";

    echo "\nSUCCESS: Database setup complete and verified!\n";
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
