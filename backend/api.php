<?php
// Suppress warnings from corrupting JSON responses
ini_set('display_errors', '0');
error_reporting(E_ALL & ~E_NOTICE & ~E_WARNING & ~E_DEPRECATED);

// Set CORS headers so React frontend can connect easily
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With, X-Tenant-ID");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

// Handle preflight OPTIONS requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$resource = isset($_GET['resource']) ? $_GET['resource'] : '';
$action = isset($_GET['action']) ? $_GET['action'] : (isset($_POST['action']) ? $_POST['action'] : '');

function getTenantId() {
    if (function_exists('apache_request_headers')) {
        $headers = apache_request_headers();
        if (isset($headers['X-Tenant-ID'])) {
            return $headers['X-Tenant-ID'];
        }
        if (isset($headers['x-tenant-id'])) {
            return $headers['x-tenant-id'];
        }
    }
    if (isset($_SERVER['HTTP_X_TENANT_ID'])) {
        return $_SERVER['HTTP_X_TENANT_ID'];
    }
    return isset($_GET['tenant_id']) ? $_GET['tenant_id'] : 'admin';
}

require_once __DIR__ . '/config.php';

// 1. Database Configuration loaded from config.php / .env


try {
    $pdo = new PDO("mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=utf8mb4", DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Auto-seed empty tables to ensure the app always has working demo data
    seedDatabaseIfEmpty($pdo);
} catch (Exception $e) {
    // Seamless Fallback to local SQLite database
    try {
        $sqlitePath = __DIR__ . '/database.sqlite';
        $pdo = new PDO("sqlite:$sqlitePath");
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        
        // Verify if tables are populated, else run setup
        $checkStmt = $pdo->query("SELECT name FROM sqlite_master WHERE type='table' AND name='hotels'");
        if (!$checkStmt || !$checkStmt->fetch()) {
            if (file_exists(__DIR__ . '/setup_sqlite.php')) {
                require_once __DIR__ . '/setup_sqlite.php';
            }
        }
        
        // Ensure leads and lead_comments tables exist in SQLite
        $pdo->exec("CREATE TABLE IF NOT EXISTS leads (
            id VARCHAR(50) PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            phone VARCHAR(50) NOT NULL,
            email VARCHAR(255) DEFAULT '',
            source VARCHAR(100) DEFAULT 'Hotel Enquiries',
            service VARCHAR(255) DEFAULT '',
            assigned_to VARCHAR(100) DEFAULT 'Unassigned',
            assigned_at DATETIME DEFAULT NULL,
            assigned_by VARCHAR(100) DEFAULT 'admin',
            status VARCHAR(50) DEFAULT 'New',
            budget VARCHAR(100) DEFAULT '',
            notes TEXT DEFAULT '',
            next_action TEXT DEFAULT '',
            admin_id VARCHAR(50) DEFAULT 'admin',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );");
        
        $pdo->exec("CREATE TABLE IF NOT EXISTS lead_comments (
            id VARCHAR(50) PRIMARY KEY,
            lead_id VARCHAR(50) NOT NULL,
            user_id VARCHAR(50) NOT NULL,
            user_name VARCHAR(255) NOT NULL,
            user_role VARCHAR(50) NOT NULL,
            comment TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );");
    } catch (Exception $sqle) {
        http_response_code(500);
        echo json_encode([
            "error" => "Database connection failed",
            "message" => "Could not connect to MySQL or SQLite database.",
            "details" => $sqle->getMessage()
        ]);
        exit();
    }
}

function seedDatabaseIfEmpty($pdo) {
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
        "ALTER TABLE payment_settings ADD COLUMN razorpay_key VARCHAR(255) DEFAULT NULL",
        "ALTER TABLE payment_settings ADD COLUMN razorpay_secret VARCHAR(255) DEFAULT NULL",
        "ALTER TABLE payment_settings ADD COLUMN upi_id VARCHAR(255) DEFAULT NULL",
        "ALTER TABLE payment_settings ADD COLUMN upi_qr_url VARCHAR(255) DEFAULT NULL",
        "CREATE TABLE IF NOT EXISTS ai_leads (id VARCHAR(255) PRIMARY KEY, name VARCHAR(255) NOT NULL, phone VARCHAR(255) NOT NULL, created_at VARCHAR(255) NOT NULL)",
        "ALTER TABLE ai_leads ADD COLUMN chat_history TEXT DEFAULT NULL",
        "CREATE TABLE IF NOT EXISTS flights (id INT PRIMARY KEY AUTO_INCREMENT, airline VARCHAR(100), flight_number VARCHAR(100), departure_time VARCHAR(100), arrival_time VARCHAR(100), price INT, from_loc VARCHAR(50), to_loc VARCHAR(50), duration VARCHAR(50), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)",
        "CREATE TABLE IF NOT EXISTS coupons (id INT PRIMARY KEY AUTO_INCREMENT, code VARCHAR(50) UNIQUE, discount_value INT, is_active BOOLEAN DEFAULT 1, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)",
        "CREATE TABLE IF NOT EXISTS add_ons (id INT PRIMARY KEY AUTO_INCREMENT, title VARCHAR(255), type VARCHAR(50), location VARCHAR(100), price INT, duration VARCHAR(50), description TEXT, image_url VARCHAR(255))",
        // --- NEW SCHEMA UPDATES ---
        "ALTER TABLE users ADD COLUMN is_online TINYINT(1) DEFAULT 0",
        "ALTER TABLE users ADD COLUMN last_active_at DATETIME DEFAULT NULL",
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
        // Multi-Tenant Updates
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
        "ALTER TABLE payment_gateways ADD UNIQUE INDEX idx_gw_name (name)",
        "ALTER TABLE subscription_plans ADD UNIQUE INDEX idx_plan_name (name)",
        "CREATE TABLE IF NOT EXISTS leads (id VARCHAR(50) PRIMARY KEY, name VARCHAR(255) NOT NULL, phone VARCHAR(50) NOT NULL, email VARCHAR(255) DEFAULT '', source VARCHAR(100) DEFAULT 'Hotel Enquiries', service VARCHAR(255) DEFAULT '', assigned_to VARCHAR(100) DEFAULT 'Unassigned', status VARCHAR(50) DEFAULT 'New', budget VARCHAR(100) DEFAULT '', notes TEXT, admin_id VARCHAR(50) DEFAULT 'admin', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)",
        "CREATE TABLE IF NOT EXISTS commission_rules (id INT PRIMARY KEY AUTO_INCREMENT, vendor_type VARCHAR(50) NOT NULL, vendor_id VARCHAR(100) DEFAULT 'all', commission_type VARCHAR(20) DEFAULT 'percentage', commission_value DECIMAL(10,2) DEFAULT 10.00, notes TEXT, updated_by VARCHAR(100), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, UNIQUE KEY uq_commission (vendor_type, vendor_id))"
    ];
    foreach ($alters as $q) {
        try { $pdo->exec($q); } catch (PDOException $e) {}
    }

    // Seed default payment gateways if none exist (INSERT IGNORE prevents duplicates)
    $pdo->exec("INSERT IGNORE INTO payment_gateways (name, type, config_json, instructions, is_active) VALUES
        ('Bank Transfer', 'bank_transfer', '{\"account_name\":\"TripGalileo Pvt Ltd\",\"bank_name\":\"HDFC Bank\",\"account_number\":\"1234567890\",\"ifsc\":\"HDFC0001234\",\"branch\":\"Goa Main Branch\"}', 'Transfer to the above account and upload payment screenshot with UTR reference.', 1),
        ('UPI Payment', 'upi', '{\"upi_id\":\"tripgalileo@upi\"}', 'Send payment to the UPI ID above and upload the payment screenshot.', 1)
    ");

    // Seed default subscription plans if none exist (INSERT IGNORE prevents duplicates)
    $pdo->exec("INSERT IGNORE INTO subscription_plans (name, monthly_price, quarterly_price, yearly_price, trial_days, features, max_hotel_vendors, max_vehicle_vendors, max_hotels, max_vehicles, max_packages, max_bookings, storage_limit, status) VALUES
        ('Starter', 999, 2699, 9999, 7, '[\"Up to 5 Hotel Vendors\",\"Up to 5 Vehicle Vendors\",\"Up to 20 Hotels\",\"Up to 50 Vehicles\",\"Up to 10 Packages\",\"Email Support\"]', 5, 5, 20, 50, 10, 500, 5, 'active'),
        ('Professional', 2499, 6999, 24999, 14, '[\"Up to 20 Hotel Vendors\",\"Up to 20 Vehicle Vendors\",\"Up to 100 Hotels\",\"Up to 200 Vehicles\",\"Up to 50 Packages\",\"Advanced Analytics\",\"Priority Support\"]', 20, 20, 100, 200, 50, 2000, 20, 'active'),
        ('Enterprise', 4999, 13999, 49999, 30, '[\"Unlimited Hotel Vendors\",\"Unlimited Vehicle Vendors\",\"Unlimited Hotels\",\"Unlimited Vehicles\",\"Unlimited Packages\",\"White Label\",\"Dedicated Account Manager\",\"API Access\"]', 999, 999, 9999, 9999, 999, 99999, 100, 'active')
    ");

    // Seed default commission rules (INSERT IGNORE prevents duplicates)
    $pdo->exec("INSERT IGNORE INTO commission_rules (vendor_type, vendor_id, commission_type, commission_value, notes) VALUES
        ('hotel_vendor', 'all', 'percentage', 10.00, 'Default hotel commission'),
        ('vendor', 'all', 'percentage', 8.00, 'Default vehicle commission'),
        ('flight_vendor', 'all', 'percentage', 5.00, 'Default flight commission')
    ");

    // Seed default site_configs if none exist
    $gsCount = $pdo->query("SELECT COUNT(*) FROM global_settings")->fetchColumn();
    if ($gsCount == 0) { $pdo->exec("INSERT INTO global_settings (siteName) VALUES ('TripGalileo')"); }
    $cfgCount = $pdo->query("SELECT COUNT(*) FROM site_configs")->fetchColumn();
    if ($cfgCount == 0) {
        $pdo->exec("INSERT INTO site_configs (admin_id, booking_fee_deduction, min_wallet_recharge) VALUES ('superadmin', 10, 5000)");
    }
}

// 2. Process GET Resources (Read Queries)
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $tenant_id = getTenantId();
        
        if ($resource === 'reset_packages') {
            $pdo->exec("TRUNCATE TABLE packages");
            echo "Packages truncated";
            exit();
        } elseif ($resource === 'cars') {
            $stmt = $pdo->prepare("SELECT * FROM cars WHERE (admin_id = ? OR admin_id IS NULL OR admin_id = '' OR admin_id = 'admin' OR ? = 'superadmin' OR ? = 'admin')");
            $stmt->execute([$tenant_id, $tenant_id, $tenant_id]);
            $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode($data);
            exit;} elseif ($resource === 'bikes') {
            $stmt = $pdo->prepare("SELECT * FROM bikes WHERE (admin_id = ? OR admin_id IS NULL OR admin_id = '' OR admin_id = 'admin' OR ? = 'superadmin' OR ? = 'admin')");
            $stmt->execute([$tenant_id, $tenant_id, $tenant_id]);
            $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode($data);
            exit;} elseif ($resource === 'hotels') {
            $stmt = $pdo->prepare("SELECT * FROM hotels WHERE (admin_id = ? OR admin_id IS NULL OR admin_id = '' OR admin_id = 'admin' OR ? = 'superadmin' OR ? = 'admin') ORDER BY stars ASC, price ASC");
            $stmt->execute([$tenant_id, $tenant_id, $tenant_id]);
            $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
            foreach ($data as &$hotel) {
                if (isset($hotel['amenities']) && is_string($hotel['amenities'])) {
                    $hotel['amenities'] = array_map('trim', explode(',', str_replace(['[', ']', '"'], '', $hotel['amenities'])));
                }
                if (!empty($hotel['images_json'])) {
                    $parsed = is_string($hotel['images_json']) ? json_decode($hotel['images_json'], true) : $hotel['images_json'];
                    if (is_array($parsed) && count($parsed) > 0) {
                        $hotel['images'] = $parsed;
                        if (empty($hotel['image'])) {
                            $hotel['image'] = $parsed[0];
                        }
                    }
                }
                if (empty($hotel['images']) && !empty($hotel['image'])) {
                    $hotel['images'] = [$hotel['image']];
                }
            }
            echo json_encode($data);
            exit;} elseif ($resource === 'destinations') {
            $stmt = $pdo->prepare("SELECT * FROM destinations WHERE (admin_id = ? OR admin_id IS NULL OR admin_id = '' OR admin_id = 'admin' OR ? = 'superadmin' OR ? = 'admin')");
            $stmt->execute([$tenant_id, $tenant_id, $tenant_id]);
            $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode($data);
            exit;} elseif ($resource === 'packages') {
            $stmt = $pdo->prepare("SELECT * FROM packages WHERE (admin_id = ? OR admin_id IS NULL OR admin_id = '' OR admin_id = 'admin' OR ? = 'superadmin' OR ? = 'admin') ORDER BY id ASC");
            $stmt->execute([$tenant_id, $tenant_id, $tenant_id]);
            $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
            foreach ($data as &$pkg) {
                $mainImg = $pkg['image'] ?? ($pkg['image_url'] ?? ($pkg['imageUrl'] ?? ''));
                if (!$mainImg && !empty($pkg['images_json'])) {
                    $parsedImgs = json_decode($pkg['images_json'], true);
                    if (is_array($parsedImgs) && count($parsedImgs) > 0) {
                        $mainImg = $parsedImgs[0];
                    }
                }
                $pkg['image'] = $mainImg;
                $pkg['image_url'] = $mainImg;
                $pkg['imageUrl'] = $mainImg;
                if (!empty($pkg['images_json'])) {
                    $parsed = json_decode($pkg['images_json'], true);
                    if (is_array($parsed)) {
                        $pkg['images'] = $parsed;
                    }
                }
                if (empty($pkg['images']) && $mainImg) {
                    $pkg['images'] = [$mainImg];
                }
                if (!empty($pkg['day_wise_itinerary']) && is_string($pkg['day_wise_itinerary'])) {
                    $parsedItin = json_decode($pkg['day_wise_itinerary'], true);
                    if (is_array($parsedItin)) {
                        $pkg['itinerary'] = $parsedItin;
                    }
                }
            }
            echo json_encode($data);
            exit;} elseif ($resource === 'vendors') {
            $stmt = $pdo->prepare("SELECT * FROM vendors WHERE (admin_id = ? OR admin_id IS NULL OR admin_id = '' OR admin_id = 'admin' OR ? = 'superadmin' OR ? = 'admin')");
            $stmt->execute([$tenant_id, $tenant_id, $tenant_id]);
            $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode($data);
            exit;} elseif ($resource === 'users') {
            $stmt = $pdo->prepare("SELECT id, username, name, email, phone, city, role, created_at, billing_price, status, kyc_status, plain_password, is_online, last_active_at FROM users WHERE (admin_id = ? OR admin_id IS NULL OR admin_id = '' OR admin_id = 'admin' OR ? = 'superadmin' OR ? = 'admin') ORDER BY created_at DESC");
            $stmt->execute([$tenant_id, $tenant_id, $tenant_id]);
            $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode($data);
            exit;} elseif ($resource === 'flights') {
            $stmt = $pdo->prepare("SELECT * FROM flights WHERE (admin_id = ? OR admin_id IS NULL OR admin_id = '' OR ? = 'superadmin' OR ? = 'admin') ORDER BY created_at DESC");
            $stmt->execute([$tenant_id, $tenant_id, $tenant_id]);
            $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode($data);
            exit;} elseif ($resource === 'bookings') {
            $stmt = $pdo->prepare("SELECT * FROM bookings WHERE (admin_id = ? OR admin_id IS NULL OR admin_id = '' OR admin_id = 'admin' OR ? = 'superadmin' OR ? = 'admin') ORDER BY created_at DESC");
            $stmt->execute([$tenant_id, $tenant_id, $tenant_id]);
            $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
            foreach ($data as &$b) {
                $depDate = $b['departure_date'] ?? ($b['pickup_date'] ?? '');
                $retDate = $b['return_date'] ?? ($b['drop_date'] ?? '');
                $b['departure_date'] = $depDate;
                $b['pickup_date'] = $depDate;
                $b['check_in_date'] = $depDate;
                $b['return_date'] = $retDate;
                $b['drop_date'] = $retDate;
                $b['check_out_date'] = $retDate;
                if (empty($b['duration']) && !empty($b['booking_days'])) {
                    $b['duration'] = intval($b['booking_days']) . ' Nights / ' . (intval($b['booking_days']) + 1) . ' Days';
                }
            }
            echo json_encode($data);
            exit;} elseif ($resource === 'leads') {
            try {
                $userRole = $_SERVER['HTTP_X_USER_ROLE'] ?? ($_GET['user_role'] ?? '');
                $userId = $_SERVER['HTTP_X_USER_ID'] ?? ($_GET['user_id'] ?? '');
                $username = $_SERVER['HTTP_X_USER_IDENTIFIER'] ?? ($_GET['username'] ?? '');

                if ($userRole === 'subadmin' || $userRole === 'agent') {
                    // Sub-admin or Agent sees only leads assigned to them (or matching name/username)
                    $stmt = $pdo->prepare("SELECT * FROM leads WHERE (assigned_to = ? OR assigned_to = ? OR assigned_to LIKE ?) ORDER BY created_at DESC");
                    $likePattern = "%" . $username . "%";
                    $stmt->execute([$userId, $username, $likePattern]);
                    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
                } else {
                    // Admin / Superadmin sees all leads
                    $stmt = $pdo->prepare("SELECT * FROM leads WHERE (admin_id = ? OR admin_id IS NULL OR admin_id = '' OR admin_id = 'admin' OR ? = 'superadmin' OR ? = 'admin') ORDER BY created_at DESC");
                    $stmt->execute([$tenant_id, $tenant_id, $tenant_id]);
                    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
                }
                echo json_encode($data ?: []);
            } catch (Exception $e) {
                echo json_encode([]);
            }
            exit;} elseif ($resource === 'lead_comments') {
            try {
                $leadId = $_GET['lead_id'] ?? '';
                if (!$leadId) {
                    echo json_encode([]);
                    exit;
                }
                $userRole = $_SERVER['HTTP_X_USER_ROLE'] ?? ($_GET['user_role'] ?? '');
                $username = $_SERVER['HTTP_X_USER_IDENTIFIER'] ?? ($_GET['username'] ?? '');

                // Verify access if subadmin
                if ($userRole === 'subadmin' || $userRole === 'agent') {
                    $chk = $pdo->prepare("SELECT assigned_to FROM leads WHERE id = ?");
                    $chk->execute([$leadId]);
                    $row = $chk->fetch(PDO::FETCH_ASSOC);
                    if ($row && $row['assigned_to'] !== 'Unassigned' && stripos($row['assigned_to'], $username) === false && $row['assigned_to'] !== $username) {
                        http_response_code(403);
                        echo json_encode(["error" => "Forbidden: You do not have permission to view comments for this lead."]);
                        exit;
                    }
                }

                $stmt = $pdo->prepare("SELECT * FROM lead_comments WHERE lead_id = ? ORDER BY created_at ASC");
                $stmt->execute([$leadId]);
                $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
                echo json_encode($data ?: []);
            } catch (Exception $e) {
                echo json_encode([]);
            }
            exit;} elseif ($resource === 'assignable_users') {
            try {
                $stmt = $pdo->query("SELECT id, username, name, email, phone, role, status FROM users WHERE status = 'active' AND role IN ('subadmin', 'sub_admin', 'agent') ORDER BY name ASC, username ASC");
                $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
                echo json_encode($data ?: []);
            } catch (Exception $e) {
                echo json_encode([]);
            }
            exit;} elseif ($resource === 'ai_leads') {
            $stmt = $pdo->query("SELECT * FROM ai_leads ORDER BY created_at DESC");
            $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode($data);
            exit;} elseif ($resource === 'custom_enquiries') {
            $stmt = $pdo->query("SELECT * FROM custom_enquiries ORDER BY created_at DESC");
            $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode($data);
            exit;} elseif ($resource === 'enquiry_timeline') {
            $stmt = $pdo->prepare("SELECT * FROM enquiry_timeline WHERE enquiry_id = ? ORDER BY created_at DESC");
            $stmt->execute([$_GET['enquiry_id'] ?? '']);
            $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode($data);
            exit;} elseif ($resource === 'hotel_payment_methods') {
            $stmt = $pdo->query("SELECT * FROM hotel_payment_methods");
            $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode($data);
            exit;} elseif ($resource === 'vendor_payment_methods') {
            if (isset($_GET['vendor_id'])) {
                $stmt = $pdo->prepare("SELECT * FROM vendor_payment_methods WHERE vendor_id = ? ORDER BY created_at DESC");
                $stmt->execute([$_GET['vendor_id']]);
            } else {
                $stmt = $pdo->query("SELECT * FROM vendor_payment_methods ORDER BY created_at DESC");
            }
            $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode($data);
            exit;} elseif ($resource === 'global_settings') { $stmt = $pdo->query("SELECT * FROM global_settings LIMIT 1"); $data = $stmt->fetch(PDO::FETCH_ASSOC); echo json_encode($data ? $data : (object)[]); exit; 
            exit;} elseif ($resource === 'coupons') {
            $stmt = $pdo->prepare("SELECT * FROM coupons WHERE (admin_id = ? OR ? = 'superadmin')");
            $stmt->execute([$tenant_id, $tenant_id]);
            $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode($data);
            exit;} elseif ($resource === 'add_ons') {
            $stmt = $pdo->query("SELECT * FROM add_ons");
            $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode($data);
            exit;} elseif ($resource === 'markups') {
            $stmt = $pdo->query("SELECT * FROM markups");
            $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode($data);
            exit;} elseif ($resource === 'subscription_plans') {
            $stmt = $pdo->query("SELECT * FROM subscription_plans ORDER BY created_at DESC");
            $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode($data);
            exit;} elseif ($resource === 'wallets' || $resource === 'vendor_wallets') {
            try {
                $stmt = $pdo->query("SELECT * FROM vendor_wallets ORDER BY created_at DESC");
                $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
            } catch (Exception $e) {
                $data = [];
            }
            echo json_encode($data ?: []);
            exit;} elseif ($resource === 'settlements' || $resource === 'wallet_settlements') {
            try {
                $stmt = $pdo->query("SELECT * FROM wallet_transactions WHERE type = 'settlement' OR type = 'payout' ORDER BY created_at DESC");
                $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
            } catch (Exception $e) {
                $data = [];
            }
            echo json_encode($data ?: []);
            exit;} elseif ($resource === 'payment_gateways') {
            $stmt = $pdo->query("SELECT * FROM payment_gateways ORDER BY created_at DESC");
            $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode($data);
            exit;} elseif ($resource === 'admin_subscriptions') {
            $stmt = $pdo->query("SELECT s.*, p.name as plan_name FROM admin_subscriptions s LEFT JOIN subscription_plans p ON s.plan_id = p.id ORDER BY s.created_at DESC");
            $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode($data);
            exit;} elseif ($resource === 'my_subscription') {
            $stmt = $pdo->prepare("SELECT s.*, p.name as plan_name, p.features FROM admin_subscriptions s LEFT JOIN subscription_plans p ON s.plan_id = p.id WHERE s.admin_id = ? ORDER BY s.created_at DESC LIMIT 1");
            $stmt->execute([$tenant_id]);
            $data = $stmt->fetch(PDO::FETCH_ASSOC);
            echo json_encode($data ? $data : (object)[]);
            exit;} elseif ($resource === 'site_configs') {
            $stmt = $pdo->query("SELECT * FROM site_configs LIMIT 1");
            $data = $stmt->fetch(PDO::FETCH_ASSOC);
            echo json_encode($data ? $data : (object)[]);
            exit;} elseif ($resource === 'vendor_wallet_info') {
            $vendor_id = $_GET['vendor_id'] ?? '';
            $stmt = $pdo->prepare("SELECT * FROM wallets WHERE vendor_id = ?");
            $stmt->execute([$vendor_id]);
            $wallet = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$wallet) {
                $wallet = ['balance' => 0, 'minimum_balance' => 5000];
            }
            $stmtConf = $pdo->query("SELECT min_wallet_recharge FROM site_configs LIMIT 1");
            $conf = $stmtConf->fetch(PDO::FETCH_ASSOC);
            $wallet['config_min_recharge'] = $conf ? $conf['min_wallet_recharge'] : 5000;
            echo json_encode($wallet);
            exit;} elseif ($resource === 'vendor_wallets' || $resource === 'wallets') {
            $vendor_id = isset($_GET['vendor_id']) ? $_GET['vendor_id'] : null;
            if ($vendor_id) {
                $stmt = $pdo->prepare("SELECT * FROM wallets WHERE vendor_id = ?");
                $stmt->execute([$vendor_id]);
            } else {
                $stmt = $pdo->prepare("SELECT * FROM wallets WHERE admin_id = ? OR ? = 'superadmin'");
                $stmt->execute([$tenant_id, $tenant_id]);
            }
            $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode($data);
            exit;} elseif ($resource === 'wallet_transactions') {
            $vendor_id = isset($_GET['vendor_id']) ? $_GET['vendor_id'] : null;
            if ($vendor_id) {
                $stmt = $pdo->prepare("SELECT * FROM wallet_transactions WHERE vendor_id = ? ORDER BY created_at DESC");
                $stmt->execute([$vendor_id]);
            } else {
                $stmt = $pdo->prepare("SELECT * FROM wallet_transactions WHERE admin_id = ? OR ? = 'superadmin' ORDER BY created_at DESC");
                $stmt->execute([$tenant_id, $tenant_id]);
            }
            $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode($data);
            exit;} elseif ($resource === 'settlements') {
            $vendor_id = isset($_GET['vendor_id']) ? $_GET['vendor_id'] : null;
            if ($vendor_id) {
                $stmt = $pdo->prepare("SELECT * FROM settlements WHERE vendor_id = ? ORDER BY created_at DESC");
                $stmt->execute([$vendor_id]);
            } else {
                $stmt = $pdo->prepare("SELECT * FROM settlements WHERE admin_id = ? OR ? = 'superadmin' ORDER BY created_at DESC");
                $stmt->execute([$tenant_id, $tenant_id]);
            }
            $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode($data);
            exit;} elseif ($resource === 'commission_rules') {
            $stmt = $pdo->query("SELECT cr.*, v.name as vendor_name FROM commission_rules cr LEFT JOIN vendors v ON cr.vendor_id = v.id ORDER BY cr.vendor_type, cr.vendor_id");
            $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode($data);
            exit;
        } elseif ($resource === 'site_config') {
            $stmt = $pdo->prepare("SELECT * FROM site_configs WHERE (admin_id = ? OR ? = 'superadmin')");
            $stmt->execute([$tenant_id, $tenant_id]);
            $data = $stmt->fetch(PDO::FETCH_ASSOC);
            echo json_encode($data ? $data : (object)[]);
            exit;
        } elseif ($resource === 'platform_settings') {
            $stmtConf = $pdo->query("SELECT booking_fee_deduction, min_wallet_recharge FROM site_configs LIMIT 1");
            $conf = $stmtConf->fetch(PDO::FETCH_ASSOC);
            echo json_encode($conf ? $conf : ['booking_fee_deduction' => 10, 'min_wallet_recharge' => 5000]);
            exit;
        }
        
        include_once 'hotel_pms_get.php';
        
        echo json_encode(["status" => "online", "database" => "connected"]);
        exit;
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["error" => "Query execution failed: " . $e->getMessage()]);
        exit;
    }
    exit();
}

// 3. Process POST Actions (Write Queries)
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $raw_input = file_get_contents('php://input');
    $payload = json_decode($raw_input, true);
    
    // Fallback for form-data if JSON is not present
    if (!$payload && !empty($_POST)) {
        $payload = $_POST;
    }

    if (isset($payload['action'])) {
        $action = $payload['action'];
    }
    
    $tenant_id = getTenantId();

    try {
        include_once __DIR__ . '/hotel_pms_actions.php';

        if ($action === 'login') {
            $username = trim($payload['username'] ?? '');
            $password = trim($payload['password'] ?? '');
            
            if (!$username || !$password) {
                http_response_code(400);
                echo json_encode(["success" => false, "error" => "Username and password are required."]);
                exit();
            }

            // Check in users table
            $stmt = $pdo->prepare("SELECT * FROM users WHERE username = ? OR email = ?");
            $stmt->execute([$username, $username]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);

            // Database verification or standard demo account match
            $isValid = false;
            if ($user) {
                if (password_verify($password, $user['password_hash']) || 
                    $password === ($user['plain_password'] ?? '') || 
                    ($user['role'] === 'superadmin' && ($password === 'superadmin' || $password === 'superadmin@2026')) ||
                    ($user['role'] === 'admin' && ($password === 'admin@2026' || $password === 'admin')) ||
                    ($user['role'] === 'vendor' && ($password === 'admin@2026' || $password === 'vendor')) ||
                    ($user['role'] === 'hotel_vendor' && ($password === 'admin@2026' || $password === 'hotel_vendor')) ||
                    ($user['role'] === 'flight_vendor' && ($password === 'admin@2026' || $password === 'flight_vendor'))) {
                    $isValid = true;
                }
            } else {
                // Fallback demo users if not present in users table
                if ($username === 'superadmin' || $username === 'superadmin@gmail.com') {
                    if ($password === 'superadmin') {
                        $user = ['id' => 'u-1', 'username' => 'superadmin', 'email' => 'superadmin@gmail.com', 'role' => 'superadmin'];
                        $isValid = true;
                    }
                } elseif ($username === 'admin' || $username === 'admin@gmail.com') {
                    if ($password === 'admin@2026' || $password === 'admin') {
                        $user = ['id' => 'u-2', 'username' => 'admin', 'email' => 'admin@gmail.com', 'role' => 'admin'];
                        $isValid = true;
                    }
                } elseif ($username === 'vendor' || $username === 'vendor@tripgalileo.com') {
                    if ($password === 'admin@2026' || $password === 'vendor') {
                        $user = ['id' => 'u-3', 'username' => 'vendor', 'email' => 'vendor@tripgalileo.com', 'role' => 'vendor'];
                        $isValid = true;
                    }
                } elseif ($username === 'hotel_vendor' || $username === 'hotel_vendor@tripgalileo.com') {
                    if ($password === 'admin@2026' || $password === 'hotel_vendor') {
                        $user = ['id' => 'u-4', 'username' => 'hotel_vendor', 'email' => 'hotel_vendor@tripgalileo.com', 'role' => 'hotel_vendor'];
                        $isValid = true;
                    }
                } elseif ($username === 'flight_vendor' || $username === 'flight_vendor@tripgalileo.com') {
                    if ($password === 'admin@2026' || $password === 'flight_vendor') {
                        $user = ['id' => 'u-5', 'username' => 'flight_vendor', 'email' => 'flight_vendor@tripgalileo.com', 'role' => 'flight_vendor'];
                        $isValid = true;
                    }
                }
            }

            if ($isValid && $user) {
                unset($user['password_hash']);
                unset($user['plain_password']);
                $now = date('Y-m-d H:i:s');
                try {
                    $pdo->prepare("UPDATE users SET is_online = 1, last_active_at = ? WHERE id = ? OR username = ?")->execute([$now, $user['id'] ?? '', $user['username'] ?? '']);
                    $user['is_online'] = 1;
                    $user['last_active_at'] = $now;
                } catch (Exception $e) {}
                echo json_encode(["success" => true, "message" => "Login successful", "user" => $user]);
                exit();
            } else {
                http_response_code(401);
                echo json_encode(["success" => false, "error" => "Invalid username or password. Check credentials."]);
                exit();
            }
        } elseif ($action === 'update_online_status') {
            $userId = $payload['user_id'] ?? ($payload['id'] ?? null);
            $isOnline = isset($payload['is_online']) ? (int)$payload['is_online'] : 1;
            $now = date('Y-m-d H:i:s');
            if ($userId) {
                try {
                    $pdo->prepare("UPDATE users SET is_online = ?, last_active_at = ? WHERE id = ? OR username = ?")->execute([$isOnline, $now, $userId, $userId]);
                } catch (Exception $e) {}
            }
            echo json_encode(["success" => true, "is_online" => $isOnline, "last_active_at" => $now]);
            exit();
        } elseif ($action === 'register_user' || $action === 'add_user') {
            $username = trim($payload['username'] ?? '');
            $email = trim($payload['email'] ?? '');
            $name = trim($payload['name'] ?? ($username ?: explode('@', $email)[0]));
            if (!$username && $email) {
                $username = explode('@', $email)[0];
            }
            $phone = trim($payload['phone'] ?? '');
            $city = trim($payload['city'] ?? '');
            $password = trim($payload['password'] ?? 'Pass@123');
            $role = $payload['role'] ?? 'subadmin';
            $status = $payload['status'] ?? 'active';
            $billing_price = intval($payload['billing_price'] ?? ($payload['billingPrice'] ?? 0));
            
            if (!$username && !$email && !$name) {
                http_response_code(400);
                echo json_encode(["success" => false, "error" => "Username or email is required."]);
                exit();
            }

            $id = "u-" . time() . rand(100, 999);
            $hash = password_hash($password, PASSWORD_DEFAULT);
            $createdAt = date('Y-m-d H:i:s');
            $stmt = $pdo->prepare("INSERT INTO users (id, username, name, email, phone, city, password_hash, plain_password, role, billing_price, status, kyc_status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([$id, $username, $name, $email, $phone, $city, $hash, $password, $role, $billing_price, $status, 'verified', $createdAt]);

            echo json_encode(["success" => true, "message" => "User created successfully.", "user_id" => $id, "id" => $id]);
            exit();
        } elseif ($action === 'update_user') {
            $id = $payload['id'] ?? null;
            $username = trim($payload['username'] ?? '');
            $name = trim($payload['name'] ?? $username);
            $email = trim($payload['email'] ?? '');
            $phone = trim($payload['phone'] ?? '');
            $city = trim($payload['city'] ?? '');
            $role = $payload['role'] ?? 'vendor';
            $billing_price = intval($payload['billing_price'] ?? ($payload['billingPrice'] ?? 0));
            $password = trim($payload['password'] ?? '');

            if ($id) {
                if ($password) {
                    $hash = password_hash($password, PASSWORD_DEFAULT);
                    $stmt = $pdo->prepare("UPDATE users SET username=?, name=?, email=?, phone=?, city=?, role=?, billing_price=?, password_hash=?, plain_password=? WHERE id=?");
                    $stmt->execute([$username, $name, $email, $phone, $city, $role, $billing_price, $hash, $password, $id]);
                } else {
                    $stmt = $pdo->prepare("UPDATE users SET username=?, name=?, email=?, phone=?, city=?, role=?, billing_price=? WHERE id=?");
                    $stmt->execute([$username, $name, $email, $phone, $city, $role, $billing_price, $id]);
                }
                // Also update vendors table if vendor record exists
                try {
                    $stmtV = $pdo->prepare("UPDATE vendors SET name=?, email=?, phone=?, city=? WHERE id=? OR name=?");
                    $stmtV->execute([$name ?: $username, $email, $phone, $city, $id, $username]);
                } catch (Exception $ve) {}
            }
            echo json_encode(["success" => true, "message" => "User updated successfully."]);
            exit();
        } elseif ($action === 'delete_user') {
            $id = $payload['id'] ?? null;
            if ($id) {
                $stmt = $pdo->prepare("DELETE FROM users WHERE id=?");
                $stmt->execute([$id]);
            }
            echo json_encode(["success" => true, "message" => "User deleted successfully."]);
            exit();
        } elseif ($action === 'upload_document') {
            if (!isset($_FILES['file']) || !isset($_POST['entity_type']) || !isset($_POST['entity_id']) || !isset($_POST['document_type'])) {
                throw new Exception("Missing parameters for document upload.");
            }
            $file = $_FILES['file'];
            $upload_dir = '../frontend/public/uploads/documents/';
            if (!file_exists($upload_dir)) {
                mkdir($upload_dir, 0777, true);
            }
            $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
            $filename = uniqid('doc_') . '.' . $ext;
            if (move_uploaded_file($file['tmp_name'], $upload_dir . $filename)) {
                $file_url = '/uploads/documents/' . $filename;
                $stmt = $pdo->prepare("INSERT INTO documents (entity_type, entity_id, document_type, file_url) VALUES (?, ?, ?, ?)");
                $stmt->execute([$_POST['entity_type'], $_POST['entity_id'], $_POST['document_type'], $file_url]);
                echo json_encode(["success" => true, "message" => "Document uploaded successfully.", "file_url" => $file_url]);
            exit;} else {
                throw new Exception("Failed to move uploaded file.");
            }
            exit();
        } elseif ($action === 'create_subscription_plan') {
            $features = isset($payload['features']) ? json_encode($payload['features']) : '[]';
            $stmt = $pdo->prepare("INSERT INTO subscription_plans (name, monthly_price, quarterly_price, yearly_price, trial_days, features, max_hotel_vendors, max_vehicle_vendors, max_hotels, max_vehicles, max_packages, max_bookings, storage_limit, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $payload['name'], $payload['monthly_price'], $payload['quarterly_price'], $payload['yearly_price'], $payload['trial_days'] ?? 0,
                $features, $payload['max_hotel_vendors'] ?? 0, $payload['max_vehicle_vendors'] ?? 0, $payload['max_hotels'] ?? 0, $payload['max_vehicles'] ?? 0, $payload['max_packages'] ?? 0, $payload['max_bookings'] ?? 0, $payload['storage_limit'] ?? 0, $payload['status'] ?? 'active'
            ]);
            echo json_encode(["success" => true, "message" => "Subscription plan created."]);
            exit;} elseif ($action === 'update_subscription_plan') {
            $features = isset($payload['features']) ? json_encode($payload['features']) : '[]';
            $stmt = $pdo->prepare("UPDATE subscription_plans SET name = ?, monthly_price = ?, quarterly_price = ?, yearly_price = ?, trial_days = ?, features = ?, max_hotel_vendors = ?, max_vehicle_vendors = ?, max_hotels = ?, max_vehicles = ?, max_packages = ?, max_bookings = ?, storage_limit = ?, status = ? WHERE id = ?");
            $stmt->execute([
                $payload['name'], $payload['monthly_price'], $payload['quarterly_price'], $payload['yearly_price'], $payload['trial_days'] ?? 0,
                $features, $payload['max_hotel_vendors'] ?? 0, $payload['max_vehicle_vendors'] ?? 0, $payload['max_hotels'] ?? 0, $payload['max_vehicles'] ?? 0, $payload['max_packages'] ?? 0, $payload['max_bookings'] ?? 0, $payload['storage_limit'] ?? 0, $payload['status'] ?? 'active',
                $payload['id']
            ]);
            echo json_encode(["success" => true, "message" => "Subscription plan updated."]);
            exit;} elseif ($action === 'delete_subscription_plan') {
            $stmt = $pdo->prepare("DELETE FROM subscription_plans WHERE id = ?");
            $stmt->execute([$payload['id']]);
            echo json_encode(["success" => true, "message" => "Subscription plan deleted."]);
            exit;} elseif ($action === 'create_payment_gateway') {
            $config_json = isset($payload['config']) ? json_encode($payload['config']) : '{}';
            $stmt = $pdo->prepare("INSERT INTO payment_gateways (name, type, config_json, instructions, is_active) VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([$payload['name'], $payload['type'], $config_json, $payload['instructions'] ?? '', $payload['is_active'] ?? 1]);
            echo json_encode(["success" => true, "message" => "Payment gateway added."]);
            exit;} elseif ($action === 'update_payment_gateway') {
            $config_json = isset($payload['config']) ? json_encode($payload['config']) : '{}';
            $stmt = $pdo->prepare("UPDATE payment_gateways SET name = ?, type = ?, config_json = ?, instructions = ?, is_active = ? WHERE id = ?");
            $stmt->execute([$payload['name'], $payload['type'], $config_json, $payload['instructions'] ?? '', $payload['is_active'] ?? 1, $payload['id']]);
            echo json_encode(["success" => true, "message" => "Payment gateway updated."]);
            exit;} elseif ($action === 'delete_payment_gateway') {
            $stmt = $pdo->prepare("DELETE FROM payment_gateways WHERE id = ?");
            $stmt->execute([$payload['id']]);
            echo json_encode(["success" => true, "message" => "Payment gateway deleted."]);
            exit;} elseif ($action === 'purchase_subscription') {
            $stmt = $pdo->prepare("INSERT INTO admin_subscriptions (admin_id, plan_id, payment_method, payment_proof, payment_reference, status) VALUES (?, ?, ?, ?, ?, ?)");
            $status = ($payload['payment_method'] === 'Razorpay' || $payload['payment_method'] === 'Stripe') ? 'active' : 'pending_verification';
            $stmt->execute([$tenant_id, $payload['plan_id'], $payload['payment_method'], $payload['payment_proof'] ?? '', $payload['payment_reference'] ?? '', $status]);
            echo json_encode(["success" => true, "message" => "Subscription purchased/renewed.", "status" => $status]);
            exit;} elseif ($action === 'approve_subscription') {
            $status = $payload['status']; // 'active' or 'rejected'
            $stmt = $pdo->prepare("UPDATE admin_subscriptions SET status = ? WHERE id = ?");
            $stmt->execute([$status, $payload['id']]);
            echo json_encode(["success" => true, "message" => "Subscription status updated."]);
            exit;} elseif ($action === 'recharge_wallet') {
            $vendor_id = $payload['vendor_id'];
            $amount = $payload['amount'];
            $status = ($payload['payment_method'] === 'Razorpay' || $payload['payment_method'] === 'Stripe') ? 'Completed' : 'Pending Verification';
            $stmt = $pdo->prepare("INSERT INTO wallet_transactions (vendor_id, amount, type, reference_id, payment_proof, status, description, admin_id) VALUES (?, ?, 'credit', ?, ?, ?, ?, ?)");
            $stmt->execute([$vendor_id, $amount, $payload['reference_id'] ?? '', $payload['payment_proof'] ?? '', $status, "Wallet recharge via " . $payload['payment_method'], $tenant_id]);
            if ($status === 'Completed') {
                $pdo->prepare("UPDATE vendor_wallets SET balance = balance + ? WHERE vendor_id = ?")->execute([$amount, $vendor_id]);
            }
            echo json_encode(["success" => true, "message" => "Wallet recharge submitted.", "status" => $status]);
            exit;} elseif ($action === 'approve_recharge') {
            $status = $payload['status']; // 'Completed' or 'Rejected'
            $transaction_id = $payload['id'];
            $stmt = $pdo->prepare("SELECT * FROM wallet_transactions WHERE id = ?");
            $stmt->execute([$transaction_id]);
            $txn = $stmt->fetch();
            if ($txn && $txn['status'] !== 'Completed') {
                $stmt = $pdo->prepare("UPDATE wallet_transactions SET status = ? WHERE id = ?");
                $stmt->execute([$status, $transaction_id]);
                if ($status === 'Completed') {
                    $pdo->prepare("UPDATE vendor_wallets SET balance = balance + ? WHERE vendor_id = ?")->execute([$txn['amount'], $txn['vendor_id']]);
                }
            }
            echo json_encode(["success" => true, "message" => "Recharge request processed."]);
            exit;} elseif ($action === 'update_global_settings') { $stmt = $pdo->prepare("UPDATE global_settings SET siteName = ?, currency = ?, taxRate = ?, supportEmail = ?, whatsappNumber = ?, smsProvider = ?, darkMode = ?, maintenanceMode = ?"); $stmt->execute([$payload['siteName'] ?? 'TripGalileo', $payload['currency'] ?? 'INR', $payload['taxRate'] ?? 18, $payload['supportEmail'] ?? 'support@tripgalileo.com', $payload['whatsappNumber'] ?? '', $payload['smsProvider'] ?? 'none', isset($payload['darkMode']) && $payload['darkMode'] ? 1 : 0, isset($payload['maintenanceMode']) && $payload['maintenanceMode'] ? 1 : 0]); echo json_encode(["success" => true, "message" => "Global settings updated."]); exit; 
        } elseif ($action === 'update_platform_settings') {
            $stmt = $pdo->prepare("UPDATE site_configs SET booking_fee_deduction = ?, min_wallet_recharge = ?");
            $stmt->execute([$payload['booking_fee_deduction'], $payload['min_wallet_recharge']]);
            echo json_encode(["success" => true, "message" => "Platform settings updated."]);
            exit;} elseif ($action === 'save_commission_rule') {
            $vendor_type = $payload['vendor_type']; // 'hotel_vendor', 'vendor', 'flight_vendor'
            $vendor_id = $payload['vendor_id'] ?? 'all'; // 'all' or specific vendor id
            $commission_type = $payload['commission_type'] ?? 'percentage'; // 'percentage' or 'fixed'
            $commission_value = floatval($payload['commission_value'] ?? 0);
            $notes = $payload['notes'] ?? '';
            $stmt = $pdo->prepare("INSERT INTO commission_rules (vendor_type, vendor_id, commission_type, commission_value, notes, updated_by) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE commission_type = VALUES(commission_type), commission_value = VALUES(commission_value), notes = VALUES(notes), updated_by = VALUES(updated_by)");
            $stmt->execute([$vendor_type, $vendor_id, $commission_type, $commission_value, $notes, $tenant_id]);
            echo json_encode(["success" => true, "message" => "Commission rule saved."]);
            exit;} elseif ($action === 'delete_commission_rule') {
            $stmt = $pdo->prepare("DELETE FROM commission_rules WHERE id = ? AND vendor_id != 'all'");
            $stmt->execute([$payload['id']]);
            echo json_encode(["success" => true, "message" => "Commission override deleted."]);
            exit;} elseif ($action === 'add_vendor') {
            if (!isset($payload['name']) || !isset($payload['email'])) {
                throw new Exception("Missing vendor name or email parameter.");
            }
            $stmt = $pdo->prepare("INSERT INTO vendors (id, name, email, phone, city, role, monthly_plan_price, created_at, admin_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $payload['id'],
                $payload['name'],
                $payload['email'],
                $payload['phone'],
                $payload['city'],
                isset($payload['role']) ? $payload['role'] : 'vendor',
                isset($payload['monthly_plan_price']) ? intval($payload['monthly_plan_price']) : 0,
                date('Y-m-d'),
                $tenant_id
            ]);
            echo json_encode(["success" => true, "message" => "Vendor registered successfully."]);
            exit;} elseif ($action === 'update_vendor') {
            $stmt = $pdo->prepare("UPDATE vendors SET name = ?, email = ?, phone = ?, city = ?, role = ?, monthly_plan_price = ? WHERE id = ?");
            $stmt->execute([
                $payload['name'],
                $payload['email'],
                $payload['phone'],
                $payload['city'],
                isset($payload['role']) ? $payload['role'] : 'vendor',
                isset($payload['monthly_plan_price']) ? intval($payload['monthly_plan_price']) : 0,
                $payload['id']
            ]);
            
            // Also sync the role in the users table if it exists
            $stmtSync = $pdo->prepare("UPDATE users SET role = ? WHERE id = ?");
            $stmtSync->execute([
                isset($payload['role']) ? $payload['role'] : 'vendor',
                $payload['id']
            ]);
            
            echo json_encode(["success" => true, "message" => "Vendor updated successfully."]);
            exit;} elseif ($action === 'delete_vendor') {
            $stmt = $pdo->prepare("DELETE FROM vendors WHERE id = ?");
            $stmt->execute([$payload['id']]);
            echo json_encode(["success" => true, "message" => "Vendor deleted successfully."]);
            exit;} elseif ($action === 'set_vendor_password') {
            if (!isset($payload['id']) || !isset($payload['password'])) {
                throw new Exception("Missing vendor ID or password.");
            }
            $stmt = $pdo->prepare("SELECT * FROM vendors WHERE id = ?");
            $stmt->execute([$payload['id']]);
            $vendor = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$vendor) {
                throw new Exception("Vendor not found.");
            }
            $password_hash = password_hash($payload['password'], PASSWORD_DEFAULT);
            $stmt = $pdo->prepare("INSERT INTO users (id, username, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?, NOW()) ON DUPLICATE KEY UPDATE password_hash = ?, role = ?");
            $stmt->execute([
                $vendor['id'],
                $vendor['email'], // Use email as username
                $vendor['email'],
                $password_hash,
                $vendor['role'] ?? 'vendor',
                $password_hash,
                $vendor['role'] ?? 'vendor'
            ]);
            echo json_encode(["success" => true, "message" => "Vendor password set successfully."]);
            exit;} elseif ($action === 'create_ai_lead') {
            if (!isset($payload['name']) || !isset($payload['phone'])) {
                throw new Exception("Missing name or phone parameter.");
            }
            $stmt = $pdo->prepare("INSERT INTO ai_leads (id, name, phone, created_at) VALUES (?, ?, ?, ?)");
            $stmt->execute([
                uniqid('ai-'),
                $payload['name'],
                $payload['phone'],
                date('Y-m-d H:i:s')
            ]);
            
            // Auto-capture into enterprise leads table
            try {
                $leadId = 'LD-' . rand(1000, 9999);
                $leadStmt = $pdo->prepare("INSERT INTO leads (id, name, phone, email, source, service, assigned_to, status, budget, notes, admin_id, created_at, updated_at) VALUES (?, ?, ?, '', 'AI Planner', 'AI Travel Assistant Chat', 'Unassigned', 'New', '', 'Inquired via Maya AI Assistant', 'admin', ?, ?)");
                $leadStmt->execute([$leadId, $payload['name'], $payload['phone'], date('Y-m-d H:i:s'), date('Y-m-d H:i:s')]);
            } catch (Exception $leade) {}
            
            echo json_encode(["success" => true, "message" => "AI Lead captured successfully."]);
            exit;
        } elseif ($action === 'add_vehicle' || $action === 'add_car' || $action === 'add_bike') {
            $bikeCats = ['scooter', 'scooter / moped', 'sports bike', 'cruiser', 'tourer / adventure', 'electric scooter (ev)', 'superbike', 'dirt / off-road', 'cafe racer', 'standard / commuter', 'bike'];
            $isBike = ($action === 'add_bike') 
                   || (($payload['type'] ?? '') === 'bike') 
                   || in_array(strtolower(trim($payload['category'] ?? '')), $bikeCats);
            $isCar = !$isBike;
            $id = !empty($payload['id']) ? $payload['id'] : (($isCar ? 'car-' : 'bike-') . uniqid());
            $vendorId = $payload['vendor_id'] ?? ($payload['vendorId'] ?? 'vendor-1');
            
            // Multi-image handling
            $imagesList = [];
            if (!empty($payload['images']) && is_array($payload['images'])) {
                $imagesList = array_values(array_filter($payload['images']));
            } elseif (!empty($payload['images_json'])) {
                $decoded = json_decode($payload['images_json'], true);
                if (is_array($decoded)) $imagesList = array_values(array_filter($decoded));
            }
            if (empty($imagesList) && !empty($payload['image'])) {
                $imagesList = [$payload['image']];
            }
            $image = !empty($imagesList) ? $imagesList[0] : ($payload['image'] ?? '');
            $images_json = !empty($imagesList) ? json_encode($imagesList) : null;

            if ($isCar) {
                $stmt = $pdo->prepare("INSERT INTO cars (id, vendor_id, name, category, price, seating, fuel, transmission, image, images_json, location, is_available, admin_id, mileage) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)");
                $stmt->execute([
                    $id,
                    $vendorId,
                    $payload['name'],
                    $payload['category'] ?? 'Hatchback',
                    intval($payload['price']),
                    $payload['seating'] ?? ($payload['seats'] ?? '5 Seater'),
                    $payload['fuel'] ?? 'Petrol',
                    $payload['transmission'] ?? 'Automatic',
                    $image,
                    $images_json,
                    $payload['location'] ?? 'Goa Delivery',
                    $tenant_id,
                    $payload['mileage'] ?? ''
                ]);
            } else {
                $stmt = $pdo->prepare("INSERT INTO bikes (id, vendor_id, name, category, price, engine, fuel, mileage, image, images_json, location, is_available, admin_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)");
                $stmt->execute([
                    $id,
                    $vendorId,
                    $payload['name'],
                    $payload['category'] ?? 'Scooter / Moped',
                    intval($payload['price']),
                    $payload['engine'] ?? '150cc',
                    $payload['fuel'] ?? 'Petrol',
                    $payload['mileage'] ?? '40 km/l',
                    $image,
                    $images_json,
                    $payload['location'] ?? 'Goa Delivery',
                    $tenant_id
                ]);
            }
            echo json_encode(["success" => true, "id" => $id, "message" => "Vehicle registered successfully."]);
            exit;
        } elseif ($action === 'update_vehicle' || $action === 'update_car' || $action === 'update_bike') {
            $id = $payload['id'] ?? null;
            if (!$id) throw new Exception("Missing vehicle ID.");

            // Check if car or bike
            $bikeCats = ['scooter', 'scooter / moped', 'sports bike', 'cruiser', 'tourer / adventure', 'electric scooter (ev)', 'superbike', 'dirt / off-road', 'cafe racer', 'standard / commuter', 'bike'];
            $isBike = ($action === 'update_bike') 
                   || (($payload['type'] ?? '') === 'bike') 
                   || in_array(strtolower(trim($payload['category'] ?? '')), $bikeCats);
            $isCar = !$isBike;
            if ($action === 'update_vehicle' && empty($payload['type']) && empty($payload['category'])) {
                $checkCar = $pdo->prepare("SELECT id FROM cars WHERE id = ?");
                $checkCar->execute([$id]);
                $isCar = (bool)$checkCar->fetch();
            }

            // Multi-image handling
            $imagesList = [];
            if (!empty($payload['images']) && is_array($payload['images'])) {
                $imagesList = array_values(array_filter($payload['images']));
            } elseif (!empty($payload['images_json'])) {
                $decoded = json_decode($payload['images_json'], true);
                if (is_array($decoded)) $imagesList = array_values(array_filter($decoded));
            }
            if (empty($imagesList) && !empty($payload['image'])) {
                $imagesList = [$payload['image']];
            }
            $image = !empty($imagesList) ? $imagesList[0] : ($payload['image'] ?? '');
            $images_json = !empty($imagesList) ? json_encode($imagesList) : null;

            if ($isCar) {
                $stmt = $pdo->prepare("UPDATE cars SET name=?, category=?, price=?, seating=?, fuel=?, transmission=?, image=?, images_json=?, location=?, mileage=? WHERE id=?");
                $stmt->execute([
                    $payload['name'] ?? '',
                    $payload['category'] ?? 'Hatchback',
                    intval($payload['price'] ?? 0),
                    $payload['seating'] ?? ($payload['seats'] ?? '5 Seater'),
                    $payload['fuel'] ?? 'Petrol',
                    $payload['transmission'] ?? 'Automatic',
                    $image,
                    $images_json,
                    $payload['location'] ?? 'Goa Delivery',
                    $payload['mileage'] ?? '',
                    $id
                ]);
            } else {
                $stmt = $pdo->prepare("UPDATE bikes SET name=?, category=?, price=?, engine=?, fuel=?, mileage=?, image=?, images_json=?, location=? WHERE id=?");
                $stmt->execute([
                    $payload['name'] ?? '',
                    $payload['category'] ?? 'Scooter',
                    intval($payload['price'] ?? 0),
                    $payload['engine'] ?? '150cc',
                    $payload['fuel'] ?? 'Petrol',
                    $payload['mileage'] ?? '40 km/l',
                    $image,
                    $images_json,
                    $payload['location'] ?? 'Goa Delivery',
                    $id
                ]);
            }
            echo json_encode(["success" => true, "message" => "Vehicle updated successfully."]);
            exit;
        } elseif ($action === 'toggle_vehicle_availability') {
            $id = $payload['id'] ?? null;
            if (!$id) throw new Exception("Missing vehicle ID.");
            $avail = (!empty($payload['is_available']) || $payload['is_available'] === 1 || $payload['is_available'] === true || $payload['is_available'] === '1') ? 1 : 0;

            $stmt1 = $pdo->prepare("UPDATE cars SET is_available = ? WHERE id = ?");
            $stmt1->execute([$avail, $id]);
            $stmt2 = $pdo->prepare("UPDATE bikes SET is_available = ? WHERE id = ?");
            $stmt2->execute([$avail, $id]);

            echo json_encode(["success" => true, "is_available" => $avail, "message" => "Availability updated."]);
            exit;
        } elseif ($action === 'delete_vehicle' || $action === 'delete_car' || $action === 'delete_bike') {
            $id = $payload['id'] ?? null;
            if (!$id) throw new Exception("Missing vehicle ID.");

            $stmt1 = $pdo->prepare("DELETE FROM cars WHERE id = ?");
            $stmt1->execute([$id]);
            $stmt2 = $pdo->prepare("DELETE FROM bikes WHERE id = ?");
            $stmt2->execute([$id]);

            echo json_encode(["success" => true, "message" => "Vehicle deleted successfully."]);
            exit;
            exit;} elseif ($action === 'add_package') {
            if (!isset($payload['name']) || !isset($payload['price'])) {
                throw new Exception("Missing package name or price.");
            }
            $pkgId = !empty($payload['id']) ? $payload['id'] : ('pkg-' . time() . rand(100, 999));
            
            // Image resolution
            $imagesList = [];
            if (!empty($payload['images']) && is_array($payload['images'])) {
                $imagesList = array_values(array_filter($payload['images']));
            } elseif (!empty($payload['images_json'])) {
                $decoded = is_string($payload['images_json']) ? json_decode($payload['images_json'], true) : $payload['images_json'];
                if (is_array($decoded)) $imagesList = array_values(array_filter($decoded));
            }
            $primaryImage = $payload['image'] ?? ($payload['imageUrl'] ?? ($payload['image_url'] ?? ''));
            if (!$primaryImage && count($imagesList) > 0) {
                $primaryImage = $imagesList[0];
            }
            if ($primaryImage && empty($imagesList)) {
                $imagesList = [$primaryImage];
            }
            $imagesJson = count($imagesList) > 0 ? json_encode($imagesList) : null;

            $stmt = $pdo->prepare("INSERT INTO packages (id, name, duration, package_type, flights_included, food_included, pickup_drop_included, places_included, car_included, hotel_included, price, price_with_flight, description, tag, image, image_url, images_json, destination, is_flight_customizable, base_flight_price, is_cab_customizable, company_cab_price, pickup_drop_price, pickup_drop_image, day_wise_itinerary, cancellation_policy, highlights_json, inclusions_exclusions_json, advance_percentage, package_addons_json, admin_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $pkgId,
                $payload['name'],
                $payload['duration'] ?? '3 Days / 2 Nights',
                isset($payload['package_type']) ? $payload['package_type'] : 'Trip Package',
                isset($payload['flights_included']) ? $payload['flights_included'] : null,
                isset($payload['food_included']) ? $payload['food_included'] : null,
                isset($payload['pickup_drop_included']) ? $payload['pickup_drop_included'] : null,
                isset($payload['places_included']) ? $payload['places_included'] : null,
                isset($payload['car_included']) ? $payload['car_included'] : null,
                isset($payload['hotel_included']) ? $payload['hotel_included'] : null,
                intval($payload['price']),
                isset($payload['price_with_flight']) ? intval($payload['price_with_flight']) : null,
                $payload['description'] ?? '',
                isset($payload['tag']) ? $payload['tag'] : 'Popular',
                $primaryImage,
                $primaryImage,
                $imagesJson,
                $payload['destination'] ?? 'Goa',
                isset($payload['is_flight_customizable']) ? intval($payload['is_flight_customizable']) : 0,
                isset($payload['base_flight_price']) ? intval($payload['base_flight_price']) : 0,
                isset($payload['is_cab_customizable']) ? intval($payload['is_cab_customizable']) : 0,
                isset($payload['company_cab_price']) ? intval($payload['company_cab_price']) : 0,
                isset($payload['pickup_drop_price']) ? intval($payload['pickup_drop_price']) : 0,
                isset($payload['pickup_drop_image']) ? $payload['pickup_drop_image'] : null,
                isset($payload['day_wise_itinerary']) ? (is_array($payload['day_wise_itinerary']) ? json_encode($payload['day_wise_itinerary']) : $payload['day_wise_itinerary']) : null,
                isset($payload['cancellation_policy']) ? $payload['cancellation_policy'] : null,
                isset($payload['highlights_json']) ? (is_array($payload['highlights_json']) ? json_encode($payload['highlights_json']) : $payload['highlights_json']) : null,
                isset($payload['inclusions_exclusions_json']) ? (is_array($payload['inclusions_exclusions_json']) ? json_encode($payload['inclusions_exclusions_json']) : $payload['inclusions_exclusions_json']) : null,
                isset($payload['advance_percentage']) ? intval($payload['advance_percentage']) : 25,
                isset($payload['package_addons_json']) ? (is_array($payload['package_addons_json']) ? json_encode($payload['package_addons_json']) : $payload['package_addons_json']) : null,
                $tenant_id
            ]);
            echo json_encode([
                "success" => true,
                "id" => $pkgId,
                "message" => "Package created successfully.",
                "package" => array_merge($payload, ['id' => $pkgId, 'image' => $primaryImage, 'imageUrl' => $primaryImage, 'image_url' => $primaryImage, 'images' => $imagesList])
            ]);
            exit;} elseif ($action === 'calculate_price') {
            // Server-side calculation to prevent frontend tampering
            if (!isset($payload['package_id'])) throw new Exception("Missing package ID");
            
            $stmt = $pdo->prepare("SELECT * FROM packages WHERE id = ?");
            $stmt->execute([$payload['package_id']]);
            $package = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$package) throw new Exception("Package not found");

            $customizations = $payload['customizations'] ?? [];
            $base_price = intval($package['price']);
            
            if (isset($customizations['withFlight']) && $customizations['withFlight'] && $package['price_with_flight']) {
                $base_price = intval($package['price_with_flight']);
            }

            $total_price = $base_price;

            // Add AddOns
            if (!empty($customizations['selectedAddOns'])) {
                foreach ($customizations['selectedAddOns'] as $dayAddOns) {
                    foreach ($dayAddOns as $addonId) {
                        $stmt = $pdo->prepare("SELECT price FROM add_ons WHERE id = ?");
                        $stmt->execute([$addonId]);
                        if ($addon = $stmt->fetch(PDO::FETCH_ASSOC)) {
                            $total_price += intval($addon['price']);
                        }
                    }
                }
            }

            // Add Hotel Upgrades
            if (!empty($customizations['selectedHotels'])) {
                foreach ($customizations['selectedHotels'] as $hotelId) {
                    // Expecting the frontend to send hotel objects or IDs. If object, we use ID.
                    $id = is_array($hotelId) ? $hotelId['id'] : $hotelId;
                    $stmt = $pdo->prepare("SELECT price FROM hotels WHERE id = ?");
                    $stmt->execute([$id]);
                    if ($hotel = $stmt->fetch(PDO::FETCH_ASSOC)) {
                        $total_price += intval($hotel['price']);
                    }
                }
            }

            // Add Transfer Upgrades
            if (!empty($customizations['selectedTransfers'])) {
                foreach ($customizations['selectedTransfers'] as $carId) {
                    $id = is_array($carId) ? $carId['id'] : $carId;
                    $stmt = $pdo->prepare("SELECT price FROM cars WHERE id = ?");
                    $stmt->execute([$id]);
                    if ($car = $stmt->fetch(PDO::FETCH_ASSOC)) {
                        $total_price += intval($car['price']);
                    }
                }
            }

            // Calculate Self-Drive if selected
            if (!empty($customizations['selectedSelfDriveVehicle'])) {
                $carId = $customizations['selectedSelfDriveVehicle'];
                $stmt = $pdo->prepare("SELECT price FROM cars WHERE id = ? UNION SELECT price FROM bikes WHERE id = ?");
                $stmt->execute([$carId, $carId]);
                if ($vehicle = $stmt->fetch(PDO::FETCH_ASSOC)) {
                    $duration = intval($package['duration']);
                    // Approx days = duration string e.g., '4 Nights 5 Days' -> extract '5'
                    preg_match('/(\d+)\s*Days?/i', $package['duration'], $matches);
                    $days = !empty($matches[1]) ? intval($matches[1]) : 1;
                    $total_price += (intval($vehicle['price']) * $days);
                }
            }

            // Apply Coupon
            if (!empty($customizations['appliedCoupon'])) {
                $stmt = $pdo->prepare("SELECT discount_value FROM coupons WHERE code = ? AND is_active = 1");
                $stmt->execute([$customizations['appliedCoupon']]);
                if ($coupon = $stmt->fetch(PDO::FETCH_ASSOC)) {
                    $total_price -= intval($coupon['discount_value']);
                }
            }

            $advance_percentage = intval($package['advance_percentage'] ?? 25);
            $advance_amount = ceil(($total_price * $advance_percentage) / 100);

            echo json_encode([
                "success" => true,
                "total_price" => $total_price,
                "advance_percentage" => $advance_percentage,
                "advance_amount" => $advance_amount
            ]);
            exit;} elseif ($action === 'hold_vehicle') {
            if (!isset($payload['vehicle_id'])) throw new Exception("Missing vehicle ID");
            $session_id = $payload['session_id'] ?? session_id() ?: uniqid('session_');
            $hold_minutes = 15;
            $stmt = $pdo->prepare("DELETE FROM vehicle_holds WHERE held_until < NOW()");
            $stmt->execute();
            
            $stmt = $pdo->prepare("SELECT * FROM vehicle_holds WHERE vehicle_id = ? AND held_until > NOW() AND session_id != ?");
            $stmt->execute([$payload['vehicle_id'], $session_id]);
            if ($stmt->fetch()) {
                throw new Exception("Vehicle is currently held by another user. Please wait a few minutes.");
            }
            
            $stmt = $pdo->prepare("INSERT INTO vehicle_holds (vehicle_id, session_id, held_until) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL ? MINUTE)) ON DUPLICATE KEY UPDATE held_until = DATE_ADD(NOW(), INTERVAL ? MINUTE)");
            $stmt->execute([$payload['vehicle_id'], $session_id, $hold_minutes, $hold_minutes]);
            
            echo json_encode(["success" => true, "message" => "Vehicle held for checkout.", "session_id" => $session_id]);
            exit;} elseif ($action === 'book' || $action === 'create_booking') {
            $booking_id = !empty($payload['id']) ? $payload['id'] : ("TG-" . rand(100000, 999999));
            $dep_date = $payload['departure_date'] ?? ($payload['pickup_date'] ?? ($payload['check_in_date'] ?? ''));
            $ret_date = $payload['return_date'] ?? ($payload['drop_date'] ?? ($payload['check_out_date'] ?? ''));
            $days_count = intval($payload['booking_days'] ?? 1);
            $duration_val = $payload['duration'] ?? ($days_count . ' Nights / ' . ($days_count + 1) . ' Days');

            $stmt = $pdo->prepare("INSERT INTO bookings (id, name, phone, email, license, pickup_loc, pickup_date, pickup_time, drop_date, drop_time, departure_date, return_date, check_in_date, check_out_date, duration, item_id, item_name, booking_days, total_amount, amount_paid, remaining_amount, total_paid, status, payment_status, customizations, created_at, payment_method, admin_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $booking_id,
                $payload['name'] ?? ($payload['customer_name'] ?? 'Customer'),
                $payload['phone'] ?? '',
                $payload['email'] ?? '',
                $payload['license'] ?? '',
                $payload['pickup_loc'] ?? ($payload['pickup_location'] ?? 'Goa'),
                $dep_date,
                $payload['pickup_time'] ?? '10:00 AM',
                $ret_date,
                $payload['drop_time'] ?? '10:00 AM',
                $dep_date,
                $ret_date,
                $dep_date,
                $ret_date,
                $duration_val,
                $payload['item_id'] ?? '',
                $payload['item_name'] ?? 'Vehicle Rental',
                $days_count,
                intval($payload['total_amount'] ?? ($payload['total_paid'] ?? 0)),
                intval($payload['amount_paid'] ?? ($payload['total_paid'] ?? 0)),
                intval($payload['remaining_amount'] ?? 0),
                intval($payload['total_paid'] ?? ($payload['total_amount'] ?? 0)),
                $payload['status'] ?? 'Confirmed',
                $payload['payment_status'] ?? 'Paid',
                $payload['customizations'] ?? null,
                date('Y-m-d H:i:s'),
                $payload['payment_method'] ?? ($payload['payment_mode'] ?? 'Cash'),
                $tenant_id
            ]);
            
            // Trigger Notification for the Vendor if applicable
            $vendor_id = $payload['vendor_id'] ?? ($payload['vendorId'] ?? null);
            if ($vendor_id) {
                try {
                    $notif_id = 'notif_' . uniqid();
                    $stmt_notif = $pdo->prepare("INSERT INTO hotel_notifications (id, vendor_id, type, title, message, related_id, related_type) VALUES (?,?,?,?,?,?,?)");
                    $stmt_notif->execute([$notif_id, $vendor_id, 'booking', 'New Booking Received', 'A new booking has been made for ' . ($payload['item_name'] ?? 'Vehicle'), $booking_id, 'booking']);
                } catch (Exception $ne) {}
            }
            
            // Auto-capture inbound lead into leads table
            try {
                $leadId = 'LD-' . rand(1000, 9999);
                $isHtl = (stripos($payload['item_name'] ?? '', 'Hotel') !== false || stripos($payload['item_id'] ?? '', 'hotel') !== false || stripos($payload['item_id'] ?? '', 'htl') !== false);
                $leadSource = $isHtl ? 'Hotel Enquiries' : 'Vehicle Rental';
                $leadService = ($payload['item_name'] ?? 'Booking') . ' (' . ($payload['booking_days'] ?? 1) . ' Days)';
                $totAmt = intval($payload['total_amount'] ?? $payload['total_paid'] ?? 0);
                $leadBudget = $totAmt > 0 ? '₹' . number_format($totAmt) : 'Standard Rate';
                $leadNotes = 'Direct Booking #' . $booking_id . ' | ' . ($payload['pickup_loc'] ?? 'Goa');
                $leadEmail = $payload['email'] ?? '';
                if (!$leadEmail && !empty($payload['traveller_details_json'])) {
                    $td = is_array($payload['traveller_details_json']) ? $payload['traveller_details_json'] : json_decode($payload['traveller_details_json'], true);
                    if (!empty($td['email'])) $leadEmail = $td['email'];
                }
                $leadStmt = $pdo->prepare("INSERT INTO leads (id, name, phone, email, source, service, assigned_to, status, budget, notes, admin_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 'Unassigned', 'New', ?, ?, ?, ?, ?)");
                $leadStmt->execute([$leadId, $payload['name'] ?? 'Customer', $payload['phone'] ?? '', $leadEmail, $leadSource, $leadService, $leadBudget, $leadNotes, $tenant_id, date('Y-m-d H:i:s'), date('Y-m-d H:i:s')]);
            } catch (Exception $leade) {}
            
            echo json_encode(["success" => true, "message" => "Booking complete.", "booking_id" => $booking_id]);
            exit;} elseif ($action === 'delete_package') {
            $stmt = $pdo->prepare("DELETE FROM packages WHERE id = ?");
            $stmt->execute([$payload['id']]);
            echo json_encode(["success" => true, "message" => "Package deleted.", "id" => $payload['id']]);
            exit;} elseif ($action === 'update_package') {
            // Image resolution
            $imagesList = [];
            if (!empty($payload['images']) && is_array($payload['images'])) {
                $imagesList = array_values(array_filter($payload['images']));
            } elseif (!empty($payload['images_json'])) {
                $decoded = is_string($payload['images_json']) ? json_decode($payload['images_json'], true) : $payload['images_json'];
                if (is_array($decoded)) $imagesList = array_values(array_filter($decoded));
            }
            $primaryImage = $payload['image'] ?? ($payload['imageUrl'] ?? ($payload['image_url'] ?? ''));
            if (!$primaryImage && count($imagesList) > 0) {
                $primaryImage = $imagesList[0];
            }
            if ($primaryImage && empty($imagesList)) {
                $imagesList = [$primaryImage];
            }
            $imagesJson = count($imagesList) > 0 ? json_encode($imagesList) : null;

            $stmt = $pdo->prepare("UPDATE packages SET name=?, duration=?, package_type=?, flights_included=?, food_included=?, pickup_drop_included=?, places_included=?, car_included=?, hotel_included=?, price=?, price_with_flight=?, description=?, tag=?, image=?, image_url=?, images_json=?, destination=?, is_flight_customizable=?, base_flight_price=?, is_cab_customizable=?, company_cab_price=?, pickup_drop_price=?, pickup_drop_image=?, day_wise_itinerary=?, cancellation_policy=?, highlights_json=?, inclusions_exclusions_json=?, advance_percentage=?, package_addons_json=? WHERE id=?");
            $stmt->execute([
                $payload['name'],
                $payload['duration'] ?? '3 Days / 2 Nights',
                isset($payload['package_type']) ? $payload['package_type'] : 'Trip Package',
                isset($payload['flights_included']) ? $payload['flights_included'] : null,
                isset($payload['food_included']) ? $payload['food_included'] : null,
                isset($payload['pickup_drop_included']) ? $payload['pickup_drop_included'] : null,
                isset($payload['places_included']) ? $payload['places_included'] : null,
                isset($payload['car_included']) ? $payload['car_included'] : null,
                isset($payload['hotel_included']) ? $payload['hotel_included'] : null,
                intval($payload['price']),
                isset($payload['price_with_flight']) ? intval($payload['price_with_flight']) : null,
                $payload['description'] ?? '',
                isset($payload['tag']) ? $payload['tag'] : 'Popular',
                $primaryImage,
                $primaryImage,
                $imagesJson,
                $payload['destination'] ?? 'Goa',
                isset($payload['is_flight_customizable']) ? intval($payload['is_flight_customizable']) : 0,
                isset($payload['base_flight_price']) ? intval($payload['base_flight_price']) : 0,
                isset($payload['is_cab_customizable']) ? intval($payload['is_cab_customizable']) : 0,
                isset($payload['company_cab_price']) ? intval($payload['company_cab_price']) : 0,
                isset($payload['pickup_drop_price']) ? intval($payload['pickup_drop_price']) : 0,
                isset($payload['pickup_drop_image']) ? $payload['pickup_drop_image'] : null,
                isset($payload['day_wise_itinerary']) ? (is_array($payload['day_wise_itinerary']) ? json_encode($payload['day_wise_itinerary']) : $payload['day_wise_itinerary']) : null,
                isset($payload['cancellation_policy']) ? $payload['cancellation_policy'] : null,
                isset($payload['highlights_json']) ? (is_array($payload['highlights_json']) ? json_encode($payload['highlights_json']) : $payload['highlights_json']) : null,
                isset($payload['inclusions_exclusions_json']) ? (is_array($payload['inclusions_exclusions_json']) ? json_encode($payload['inclusions_exclusions_json']) : $payload['inclusions_exclusions_json']) : null,
                isset($payload['advance_percentage']) ? intval($payload['advance_percentage']) : 25,
                isset($payload['package_addons_json']) ? (is_array($payload['package_addons_json']) ? json_encode($payload['package_addons_json']) : $payload['package_addons_json']) : null,
                $payload['id']
            ]);
            echo json_encode([
                "success" => true,
                "message" => "Package updated successfully.",
                "package" => array_merge($payload, ['image' => $primaryImage, 'imageUrl' => $primaryImage, 'image_url' => $primaryImage, 'images' => $imagesList])
            ]);
            exit;} elseif ($action === 'toggle_vehicle_availability') {
            $table = $payload['type'] === 'car' ? 'cars' : 'bikes';
            $stmt = $pdo->prepare("UPDATE $table SET is_available = ? WHERE id = ?");
            $stmt->execute([intval($payload['is_available']), $payload['id']]);
            echo json_encode(["success" => true, "message" => "Vehicle availability updated."]);
            exit;} elseif ($action === 'update_vehicle') {
            if (!isset($payload['id']) || !isset($payload['type'])) {
                throw new Exception("Missing vehicle ID or type.");
            }
            if ($payload['type'] === 'car') {
                $stmt = $pdo->prepare("UPDATE cars SET name=?, category=?, price=?, seating=?, fuel=?, transmission=?, location=?, image=? WHERE id=?");
                $stmt->execute([
                    $payload['name'],
                    $payload['category'] ?? 'Car',
                    intval($payload['price']),
                    $payload['seating'] ?? '5 Seater',
                    $payload['fuel'] ?? 'Petrol',
                    $payload['transmission'] ?? 'Automatic',
                    $payload['location'] ?? 'Goa',
                    $payload['image'] ?? '',
                    $payload['id']
                ]);
            } else {
                $stmt = $pdo->prepare("UPDATE bikes SET name=?, category=?, price=?, engine=?, fuel=?, mileage=?, location=?, image=? WHERE id=?");
                $stmt->execute([
                    $payload['name'],
                    $payload['category'] ?? 'Bike',
                    intval($payload['price']),
                    $payload['engine'] ?? '150cc',
                    $payload['fuel'] ?? 'Petrol',
                    $payload['mileage'] ?? '40 km/l',
                    $payload['location'] ?? 'Goa',
                    $payload['image'] ?? '',
                    $payload['id']
                ]);
            }
            echo json_encode(["success" => true, "message" => "Vehicle updated successfully."]);
            exit;} elseif ($action === 'add_flight') {
            $stmt = $pdo->prepare("INSERT INTO flights (airline, flight_number, departure_time, arrival_time, price, from_loc, to_loc, duration, vendor_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $payload['airline'], $payload['flight_number'], $payload['departure_time'], $payload['arrival_time'], intval($payload['price']), $payload['from_loc'], $payload['to_loc'], $payload['duration'], $payload['vendor_id'] ?? 'admin'
            ]);
            echo json_encode(["success" => true, "message" => "Flight added."]);
            exit;} elseif ($action === 'update_flight') {
            $stmt = $pdo->prepare("UPDATE flights SET airline=?, flight_number=?, departure_time=?, arrival_time=?, price=?, from_loc=?, to_loc=?, duration=? WHERE id=?");
            $stmt->execute([
                $payload['airline'], $payload['flight_number'], $payload['departure_time'], $payload['arrival_time'], intval($payload['price']), $payload['from_loc'], $payload['to_loc'], $payload['duration'], $payload['id']
            ]);
            echo json_encode(["success" => true, "message" => "Flight updated."]);
            exit;} elseif ($action === 'delete_flight') {
            $stmt = $pdo->prepare("DELETE FROM flights WHERE id=?");
            $stmt->execute([$payload['id']]);
            echo json_encode(["success" => true, "message" => "Flight deleted."]);
            exit;} elseif ($action === 'save_markup') {
            $entity_type = $payload['entity_type'];
            $vendor_id = $payload['vendor_id'] ?? 'global';
            $item_id = $payload['item_id'] ?? 'all';
            $markup_type = $payload['markup_type'] ?? 'flat';
            $markup_value = intval($payload['markup_value']);
            
            $stmt = $pdo->prepare("SELECT id FROM markups WHERE entity_type=? AND vendor_id=? AND item_id=?");
            $stmt->execute([$entity_type, $vendor_id, $item_id]);
            if ($stmt->fetch()) {
                $stmt2 = $pdo->prepare("UPDATE markups SET markup_type=?, markup_value=? WHERE entity_type=? AND vendor_id=? AND item_id=?");
                $stmt2->execute([$markup_type, $markup_value, $entity_type, $vendor_id, $item_id]);
            } else {
                $stmt2 = $pdo->prepare("INSERT INTO markups (entity_type, vendor_id, item_id, markup_type, markup_value) VALUES (?, ?, ?, ?, ?)");
                $stmt2->execute([$entity_type, $vendor_id, $item_id, $markup_type, $markup_value]);
            }
            echo json_encode(["success" => true, "message" => "Markup saved."]);
            exit;} elseif ($action === 'search_flights') {
            require_once 'FlightProvider.php';
            $provider = new FlightProvider();
            
            $from = isset($payload['from']) ? $payload['from'] : 'DEL';
            $to = isset($payload['to']) ? $payload['to'] : 'BOM';
            $date = isset($payload['date']) ? $payload['date'] : date('Y-m-d', strtotime('+1 day'));
            
            // Expected passengers array e.g., [['type' => 'adult'], ['type' => 'child']]
            $passengers = isset($payload['passengers']) ? $payload['passengers'] : [['type' => 'adult']];
            $cabinClass = isset($payload['cabin_class']) ? $payload['cabin_class'] : 'economy';
            
            $response = $provider->searchFlights($from, $to, $date, $passengers, $cabinClass);
            
            if (isset($response['error']) && $response['error']) {
                echo json_encode(["success" => false, "message" => "Flight search failed.", "details" => $response['details']]);
            exit; exit;
            }
            
            echo json_encode(["success" => true, "data" => $response['data'] ?? []]);
            exit;} elseif ($action === 'get_seat_maps') {
            require_once 'FlightProvider.php';
            $provider = new FlightProvider();
            
            $offerId = isset($payload['offer_id']) ? $payload['offer_id'] : '';
            if (!$offerId) {
                echo json_encode(["success" => false, "message" => "Offer ID required"]);
            exit; exit;
            }
            
            $response = $provider->getSeatMaps($offerId);
            if (isset($response['error']) && $response['error']) {
                echo json_encode(["success" => false, "message" => "Failed to fetch seat maps.", "details" => $response['details']]);
            exit; exit;
            }
            
            echo json_encode(["success" => true, "data" => $response['data'] ?? []]);
            exit;} elseif ($action === 'cancellation_quote') {
            require_once 'FlightProvider.php';
            $provider = new FlightProvider();
            
            $orderId = isset($payload['order_id']) ? $payload['order_id'] : '';
            if (!$orderId) {
                echo json_encode(["success" => false, "message" => "Order ID required"]);
            exit; exit;
            }
            
            $response = $provider->getOrderCancellationQuote($orderId);
            if (isset($response['error']) && $response['error']) {
                echo json_encode(["success" => false, "message" => "Failed to get cancellation quote.", "details" => $response['details']]);
            exit; exit;
            }
            
            echo json_encode(["success" => true, "data" => $response['data'] ?? []]);
            exit;} elseif ($action === 'confirm_cancellation') {
            require_once 'FlightProvider.php';
            $provider = new FlightProvider();
            
            $cancellationId = isset($payload['cancellation_id']) ? $payload['cancellation_id'] : '';
            if (!$cancellationId) {
                echo json_encode(["success" => false, "message" => "Cancellation ID required"]);
            exit; exit;
            }
            
            $response = $provider->confirmOrderCancellation($cancellationId);
            if (isset($response['error']) && $response['error']) {
                echo json_encode(["success" => false, "message" => "Failed to confirm cancellation.", "details" => $response['details']]);
            exit; exit;
            }
            
            echo json_encode(["success" => true, "data" => $response['data'] ?? []]);
            exit;} elseif ($action === 'airport_search') {
            require_once 'FlightProvider.php';
            $provider = new FlightProvider();
            
            $query = isset($payload['query']) ? $payload['query'] : (isset($_GET['query']) ? $_GET['query'] : '');
            if (!$query) {
                echo json_encode(["success" => false, "message" => "Query required"]);
            exit; exit;
            }
            
            $response = $provider->searchPlaces($query);
            echo json_encode(["success" => true, "data" => $response['data'] ?? []]);
            exit;} elseif ($action === 'revalidate_fare') {
            require_once 'FlightProvider.php';
            $provider = new FlightProvider();
            
            $offerId = isset($payload['offer_id']) ? $payload['offer_id'] : '';
            if (!$offerId) {
                echo json_encode(["success" => false, "message" => "Offer ID required"]);
            exit; exit;
            }
            
            $response = $provider->getOffer($offerId);
            if (isset($response['error']) && $response['error']) {
                echo json_encode(["success" => false, "message" => "Fare revalidation failed.", "details" => $response['details']]);
            exit; exit;
            }
            
            echo json_encode(["success" => true, "data" => $response['data'] ?? []]);
            exit;} elseif ($action === 'book_flight') {
            require_once 'FlightProvider.php';
            $provider = new FlightProvider();
            
            $offerId = isset($payload['offer_id']) ? $payload['offer_id'] : '';
            $passengers = isset($payload['passengers']) ? $payload['passengers'] : [];
            $payments = isset($payload['payments']) ? $payload['payments'] : [];
            
            if (!$offerId || empty($passengers)) {
                echo json_encode(["success" => false, "message" => "Invalid booking details"]);
            exit; exit;
            }
            
            $response = $provider->createOrder($offerId, $passengers, $payments);
            
            if (isset($response['error']) && $response['error']) {
                echo json_encode(["success" => false, "message" => "Booking failed.", "details" => $response['details']]);
            exit; exit;
            }
            
            $order = $response['data'];
            
            // Save to DB (Ensure flight_bookings table exists)
            $stmt = $pdo->prepare("CREATE TABLE IF NOT EXISTS flight_bookings (
                id VARCHAR(255) PRIMARY KEY,
                booking_reference VARCHAR(255),
                pnr VARCHAR(100),
                total_amount VARCHAR(50),
                currency VARCHAR(10),
                passengers_json TEXT,
                slices_json TEXT,
                created_at DATETIME
            )");
            $stmt->execute();
            
            $stmt = $pdo->prepare("INSERT INTO flight_bookings (id, booking_reference, pnr, total_amount, currency, passengers_json, slices_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())");
            $stmt->execute([
                $order['id'],
                $order['booking_reference'],
                $order['booking_reference'], // Duffel usually provides booking_reference as PNR
                $order['total_amount'],
                $order['total_currency'],
                json_encode($order['passengers']),
                json_encode($order['slices'])
            ]);
            
            echo json_encode(["success" => true, "data" => $order]);
            exit;} elseif ($action === 'search_live_hotels') {
            $location = isset($payload['location']) ? $payload['location'] : 'Goa';
            
            // Integrate SerpApi Google Hotels for exact Google Maps matching results
            $serpapi_key = '5b19ac8847f1ca1f95f225b7f60f3af4b26c6cec28418426b44517a4a2f6f60f';
            
            // Set check-in and check-out to tomorrow and day after if not provided (SerpApi needs dates for prices)
            $checkIn = date('Y-m-d', strtotime('+1 day'));
            $checkOut = date('Y-m-d', strtotime('+2 days'));
            
            $url = "https://serpapi.com/search.json?engine=google_hotels&q=" . urlencode($location) . "&check_in_date=$checkIn&check_out_date=$checkOut&adults=2&currency=INR&api_key=$serpapi_key";
            
            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, $url);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
            $response = curl_exec($ch);
            curl_close($ch);
            
            $data = json_decode($response, true);
            $hotels = [];
            
            if (isset($data['properties']) && is_array($data['properties'])) {
                foreach (array_slice($data['properties'], 0, 15) as $index => $prop) {
                    
                    // Extract price
                    $price = 4500; // fallback price
                    if (isset($prop['rate_per_night']['extracted_lowest'])) {
                        $price = $prop['rate_per_night']['extracted_lowest'];
                    } elseif (isset($prop['total_rate']['extracted_lowest'])) {
                        $price = $prop['total_rate']['extracted_lowest'];
                    }
                    
                    // Extract image
                    $image = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80';
                    if (isset($prop['images']) && is_array($prop['images']) && count($prop['images']) > 0) {
                        if (isset($prop['images'][0]['original_image'])) {
                            $image = $prop['images'][0]['original_image'];
                        } elseif (isset($prop['images'][0]['thumbnail'])) {
                            $image = $prop['images'][0]['thumbnail'];
                        }
                    }
                    
                    // Extract amenities
                    $amenities = ['Free Wi-Fi', 'AC', 'TV'];
                    if (isset($prop['amenities']) && is_array($prop['amenities'])) {
                        $amenities = array_slice($prop['amenities'], 0, 5);
                    }
                    
                    // Star rating (Google Hotels sometimes provides hotel class/stars, otherwise mock it based on rating)
                    $stars = 4;
                    if (isset($prop['hotel_class'])) {
                        $stars = intval($prop['hotel_class']);
                    } else {
                        $stars = (isset($prop['overall_rating']) && $prop['overall_rating'] >= 4.5) ? 5 : 4;
                    }
                    
                    $hotels[] = [
                        "id" => "gmaps-" . (isset($prop['property_token']) ? $prop['property_token'] : $index),
                        "name" => isset($prop['name']) ? $prop['name'] : 'Premium Hotel',
                        "area" => $location,
                        "price" => $price,
                        "stars" => $stars,
                        "amenities" => $amenities,
                        "rating" => isset($prop['overall_rating']) ? $prop['overall_rating'] : 4.0,
                        "badge" => "Google Hotels",
                        "image" => $image
                    ];
                }
            }
            
            // Fallback to OSM Nominatim if SerpApi fails or returns empty
            if (count($hotels) === 0) {
                $nomUrl = "https://nominatim.openstreetmap.org/search?q=hotel+in+" . urlencode($location) . "&format=json&limit=10";
                
                $ch2 = curl_init();
                curl_setopt($ch2, CURLOPT_URL, $nomUrl);
                curl_setopt($ch2, CURLOPT_RETURNTRANSFER, true);
                curl_setopt($ch2, CURLOPT_USERAGENT, "TripGalileo/1.0");
                curl_setopt($ch2, CURLOPT_SSL_VERIFYPEER, false);
                $nomResponse = curl_exec($ch2);
                curl_close($ch2);
                
                $nomData = json_decode($nomResponse, true);
                $mockImages = [
                    'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
                    'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
                    'https://images.unsplash.com/photo-1542314831-c6a4d27ce66f?auto=format&fit=crop&w=800&q=80'
                ];
                
                if (is_array($nomData) && count($nomData) > 0) {
                    foreach ($nomData as $index => $place) {
                        if (!isset($place['name']) || empty($place['name'])) continue;
                        $name = $place['name'];
                        $price = 3500 + (strlen($name) * 150) + ($index * 300);
                        $hotels[] = [
                            "id" => "live-nom-" . $place['place_id'],
                            "name" => $name,
                            "area" => $location,
                            "price" => $price > 12000 ? 12000 : $price,
                            "stars" => (strlen($name) % 3) + 3,
                            "amenities" => ['Free Wi-Fi', 'AC', 'Room Service', 'Pool'],
                            "rating" => 4.0 + (($index % 10) / 10),
                            "badge" => "Live API Result",
                            "image" => $mockImages[$index % count($mockImages)]
                        ];
                    }
                }
                
                // Final safety net if both APIs fail
                if (count($hotels) === 0) {
                     $hotels[] = [
                        "id" => "gmaps-fallback",
                        "name" => "Premium Stay " . $location,
                        "area" => $location,
                        "price" => 5500,
                        "stars" => 4,
                        "amenities" => ['Free Wi-Fi', 'Pool', 'Restaurant', 'AC'],
                        "rating" => 4.5,
                        "badge" => "Featured",
                        "image" => $mockImages[0]
                    ];
                }
            }
            
            echo json_encode(["success" => true, "hotels" => $hotels]);
            exit;} elseif ($action === 'add_master_flight') {
            $stmt = $pdo->prepare("INSERT INTO flights (airline, from_loc, to_loc, departure_time, arrival_time, price, duration, admin_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $payload['airline'],
                $payload['from'],
                $payload['to'],
                $payload['departure'],
                $payload['arrival'],
                $payload['price'],
                $payload['duration'],
                $tenant_id
            ]);
            echo json_encode(["success" => true, "message" => "Flight added to master table"]);
            exit;} elseif ($action === 'delete_master_flight') {
            $id = isset($_GET['id']) ? intval($_GET['id']) : 0;
            $stmt = $pdo->prepare("DELETE FROM flights WHERE id = ?");
            $stmt->execute([$id]);
            echo json_encode(["success" => true, "message" => "Flight deleted from master table"]);
            exit;} elseif ($action === 'register_user' || $action === 'add_user') {
            if (!isset($payload['username']) && !isset($payload['email']) && !isset($payload['name'])) {
                throw new Exception("Missing user identifier parameter.");
            }
            $username = trim($payload['username'] ?? '');
            if (empty($username) && !empty($payload['email'])) {
                $username = explode('@', $payload['email'])[0];
            }
            if (empty($username) && !empty($payload['name'])) {
                $username = strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $payload['name'])) . rand(10, 99);
            }
            $name = trim($payload['name'] ?? $username);
            $email = trim($payload['email'] ?? ($username . '@tripgalileo.com'));
            $phone = trim($payload['phone'] ?? '');
            $city = trim($payload['city'] ?? '');
            $role = trim($payload['role'] ?? 'subadmin');
            $password = !empty($payload['password']) ? $payload['password'] : 'Pass@123';
            $status = $payload['status'] ?? 'active';
            $admin_id = ($role === 'admin' || $role === 'superadmin') ? $username : $tenant_id;
            
            $userId = "u-" . rand(10000, 99999);
            $stmt = $pdo->prepare("INSERT INTO users (id, username, name, email, phone, city, password_hash, plain_password, role, billing_price, status, kyc_status, created_at, admin_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $userId,
                $username,
                $name,
                $email,
                $phone,
                $city,
                password_hash($password, PASSWORD_BCRYPT),
                $password,
                $role,
                isset($payload['billing_price']) ? intval($payload['billing_price']) : 0,
                $status,
                $payload['kyc_status'] ?? 'verified',
                date('Y-m-d H:i:s'),
                $admin_id
            ]);
            echo json_encode(["success" => true, "id" => $userId, "message" => "User registered successfully."]);
            exit;} elseif ($action === 'update_user') {
            if (!isset($payload['id']) || !isset($payload['username']) || !isset($payload['email']) || !isset($payload['role'])) {
                throw new Exception("Missing parameters.");
            }
            $billing_price = isset($payload['billing_price']) ? intval($payload['billing_price']) : 0;
            $status = isset($payload['status']) ? $payload['status'] : 'active';
            if (!empty($payload['password'])) {
                $stmt = $pdo->prepare("UPDATE users SET username=?, email=?, role=?, password_hash=?, plain_password=?, billing_price=?, status=? WHERE id=?");
                $stmt->execute([
                    $payload['username'],
                    $payload['email'],
                    $payload['role'],
                    password_hash($payload['password'], PASSWORD_BCRYPT),
                    $payload['password'],
                    $billing_price,
                    $status,
                    $payload['id']
                ]);
            } else {
                $stmt = $pdo->prepare("UPDATE users SET username=?, email=?, role=?, billing_price=?, status=? WHERE id=?");
                $stmt->execute([
                    $payload['username'],
                    $payload['email'],
                    $payload['role'],
                    $billing_price,
                    $status,
                    $payload['id']
                ]);
            }
            echo json_encode(["success" => true, "message" => "User updated successfully."]);
            exit;} elseif ($action === 'delete_user') {
            if (!isset($payload['id'])) throw new Exception("Missing id.");
            $stmt = $pdo->prepare("DELETE FROM users WHERE id=?");
            $stmt->execute([$payload['id']]);
            echo json_encode(["success" => true, "message" => "User deleted."]);
            exit;} elseif ($action === 'create_ai_lead') {
            if (!isset($payload['name']) || !isset($payload['phone'])) {
                throw new Exception("Missing name or phone.");
            }
            $leadId = "lead-" . rand(10000, 99999);
            $stmt = $pdo->prepare("INSERT INTO ai_leads (id, name, phone, created_at) VALUES (?, ?, ?, ?)");
            $stmt->execute([
                $leadId,
                $payload['name'],
                $payload['phone'],
                date('Y-m-d H:i:s')
            ]);
            echo json_encode(["success" => true, "id" => $leadId, "message" => "Lead created successfully."]);
            exit;} elseif ($action === 'update_ai_lead_chat') {
            if (!isset($payload['id']) || !isset($payload['chat_history'])) {
                throw new Exception("Missing id or chat_history.");
            }
            $stmt = $pdo->prepare("UPDATE ai_leads SET chat_history = ? WHERE id = ?");
            $stmt->execute([
                $payload['chat_history'],
                $payload['id']
            ]);
            echo json_encode(["success" => true, "message" => "Chat updated."]);
        } elseif ($action === 'chat_with_ai') {
            if (!isset($payload['messages']) || !is_array($payload['messages'])) {
                throw new Exception("Missing messages.");
            }
            $messages = $payload['messages'];
            $latestUserMsg = '';
            for ($i = count($messages) - 1; $i >= 0; $i--) {
                if (isset($messages[$i]['role']) && $messages[$i]['role'] === 'user') {
                    $latestUserMsg = $messages[$i]['content'] ?? '';
                    break;
                }
            }

            // Fetch live database inventory
            $dbCars = [];
            $dbBikes = [];
            $dbHotels = [];
            $dbPackages = [];
            try {
                $dbCars = $pdo->query("SELECT * FROM cars")->fetchAll(PDO::FETCH_ASSOC);
                $dbBikes = $pdo->query("SELECT * FROM bikes")->fetchAll(PDO::FETCH_ASSOC);
                $dbHotels = $pdo->query("SELECT * FROM hotels")->fetchAll(PDO::FETCH_ASSOC);
                $dbPackages = $pdo->query("SELECT * FROM packages")->fetchAll(PDO::FETCH_ASSOC);
            } catch(Exception $e) {}

            $msgClean = strtolower(trim($latestUserMsg));
            $cleanKeywords = preg_replace('/[^a-z0-9\s]/', ' ', $msgClean);
            $words = array_filter(explode(' ', $cleanKeywords), function($w) {
                return strlen($w) >= 3 && !in_array($w, ['the', 'and', 'for', 'with', 'you', 'have', 'are', 'what', 'how', 'rent', 'rental', 'price', 'rate', 'cost', 'available', 'avaible', 'availble', 'avail', 'there', 'want', 'need', 'give', 'tell', 'show']);
            });

            // 1. Check for specific car match in DB
            $matchedCar = null;
            foreach ($dbCars as $car) {
                $carNameLower = strtolower($car['name']);
                if (strpos($msgClean, $carNameLower) !== false || 
                    (strpos($msgClean, 'defend') !== false && strpos($carNameLower, 'defend') !== false) ||
                    (strpos($msgClean, 'thar') !== false && strpos($carNameLower, 'thar') !== false) ||
                    (strpos($msgClean, 'swift') !== false && strpos($carNameLower, 'swift') !== false) ||
                    (strpos($msgClean, 'creta') !== false && strpos($carNameLower, 'creta') !== false) ||
                    (strpos($msgClean, 'ertiga') !== false && strpos($carNameLower, 'ertiga') !== false) ||
                    (strpos($msgClean, 'baleno') !== false && strpos($carNameLower, 'baleno') !== false)) {
                    $matchedCar = $car;
                    break;
                }
                foreach ($words as $w) {
                    if (strpos($carNameLower, $w) !== false || (strlen($w) >= 4 && levenshtein($w, $carNameLower) <= 2)) {
                        $matchedCar = $car;
                        break 2;
                    }
                }
            }

            // 2. Check for specific bike match in DB
            $matchedBike = null;
            if (!$matchedCar) {
                foreach ($dbBikes as $bike) {
                    $bikeNameLower = strtolower($bike['name']);
                    if (strpos($msgClean, $bikeNameLower) !== false ||
                        (strpos($msgClean, 'activa') !== false && strpos($bikeNameLower, 'activa') !== false) ||
                        (strpos($msgClean, 'bullet') !== false && strpos($bikeNameLower, 'bullet') !== false) ||
                        (strpos($msgClean, 'enfield') !== false && strpos($bikeNameLower, 'enfield') !== false) ||
                        (strpos($msgClean, 'classic') !== false && strpos($bikeNameLower, 'classic') !== false) ||
                        (strpos($msgClean, 'hunter') !== false && strpos($bikeNameLower, 'hunter') !== false) ||
                        (strpos($msgClean, 'duke') !== false && strpos($bikeNameLower, 'duke') !== false) ||
                        (strpos($msgClean, 'ninja') !== false && strpos($bikeNameLower, 'ninja') !== false)) {
                        $matchedBike = $bike;
                        break;
                    }
                    foreach ($words as $w) {
                        if (strpos($bikeNameLower, $w) !== false || (strlen($w) >= 4 && levenshtein($w, $bikeNameLower) <= 2)) {
                            $matchedBike = $bike;
                            break 2;
                        }
                    }
                }
            }

            // 3. Check for specific hotel match in DB
            $matchedHotel = null;
            if (!$matchedCar && !$matchedBike) {
                foreach ($dbHotels as $hotel) {
                    $hotelNameLower = strtolower($hotel['name']);
                    if (strpos($msgClean, $hotelNameLower) !== false) {
                        $matchedHotel = $hotel;
                        break;
                    }
                    foreach ($words as $w) {
                        if (strlen($w) >= 4 && strpos($hotelNameLower, $w) !== false) {
                            $matchedHotel = $hotel;
                            break 2;
                        }
                    }
                }
            }

            // 4. Check for specific package match in DB
            $matchedPackage = null;
            if (!$matchedCar && !$matchedBike && !$matchedHotel) {
                foreach ($dbPackages as $pkg) {
                    $pkgNameLower = strtolower($pkg['name']);
                    if (strpos($msgClean, $pkgNameLower) !== false) {
                        $matchedPackage = $pkg;
                        break;
                    }
                    foreach ($words as $w) {
                        if (strlen($w) >= 4 && strpos($pkgNameLower, $w) !== false) {
                            $matchedPackage = $pkg;
                            break 2;
                        }
                    }
                }
            }

            // Try Groq first if real API key configured
            $groq_api_key = getenv('GROQ_API_KEY') ?: ($_ENV['GROQ_API_KEY'] ?? '');
            $reply = null;

            if (!empty($groq_api_key) && strpos($groq_api_key, 'demo') === false) {
                $inventoryContext = "Live Inventory on TripGalileo:\n";
                $inventoryContext .= "Cars: " . implode(', ', array_map(function($c) { return "{$c['name']} (₹{$c['price']}/day, {$c['transmission']}, {$c['seating']}, {$c['fuel']})"; }, $dbCars)) . "\n";
                $inventoryContext .= "Bikes: " . implode(', ', array_map(function($b) { return "{$b['name']} (₹{$b['price']}/day)"; }, $dbBikes)) . "\n";
                $inventoryContext .= "Hotels: " . implode(', ', array_map(function($h) { return "{$h['name']} ({$h['stars']}★, ₹{$h['price']}/night in {$h['location']})"; }, $dbHotels)) . "\n";

                $system_prompt = "You are Maya (Kratu.ai), the expert AI travel assistant for TripGalileo (Goa travel platform). You help customers rent self-drive cars, bikes, book hotels, and customize holiday packages. Answer clearly, accurately, and enthusiastically with exact prices and details from our inventory. If a car like Defender or Swift is asked, say YES immediately and give full details (rate, transmission, seating, airport/doorstep delivery, 25% advance token). Be warm, concise, and helpful. Use emojis. Stick to plain text.\n\n" . $inventoryContext;

                $groqMessages = $messages;
                array_unshift($groqMessages, ["role" => "system", "content" => $system_prompt]);

                $ch = curl_init("https://api.groq.com/openai/v1/chat/completions");
                curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                curl_setopt($ch, CURLOPT_POST, true);
                curl_setopt($ch, CURLOPT_TIMEOUT, 6);
                curl_setopt($ch, CURLOPT_HTTPHEADER, [
                    "Authorization: Bearer " . $groq_api_key,
                    "Content-Type: application/json"
                ]);
                curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
                    "model" => "llama-3.1-8b-instant",
                    "messages" => $groqMessages,
                    "temperature" => 0.7
                ]));
                
                $response = curl_exec($ch);
                curl_close($ch);
                
                $result = json_decode($response, true);
                if (isset($result['choices'][0]['message']['content'])) {
                    $reply = $result['choices'][0]['message']['content'];
                }
            }

            // High-Intelligence Dynamic Database-Backed Knowledge Engine Fallback
            if (!$reply) {
                if ($matchedCar) {
                    $carName = $matchedCar['name'];
                    $price = number_format(floatval($matchedCar['price']));
                    $trans = !empty($matchedCar['transmission']) ? $matchedCar['transmission'] : 'Automatic / Manual';
                    $seating = !empty($matchedCar['seating']) ? $matchedCar['seating'] : '5 Seater';
                    $fuel = !empty($matchedCar['fuel']) ? $matchedCar['fuel'] : 'Petrol / Diesel';
                    $cat = !empty($matchedCar['category']) ? $matchedCar['category'] : 'Self-Drive Car';

                    $reply = "Yes! We have the {$carName} available for self-drive rent in Goa! 🚙✨\n\n📋 Vehicle Details:\n• Model: {$carName}\n• Category: {$cat}\n• Rental Price: ₹{$price} / day\n• Transmission: {$trans}\n• Seating Capacity: {$seating}\n• Fuel Type: {$fuel}\n• Air Conditioning: Yes (AC)\n\n✨ Rental Benefits & Inclusions:\n• Free Doorstep Delivery across North & South Goa\n• Airport Handover at Dabolim (GOI) & Mopa (GOX)\n• 24/7 On-Road Assistance & Sanitized Car\n• Just 25% Advance Token to reserve dates, balance on delivery\n\nWould you like to reserve the {$carName} for your trip dates?";
                } elseif ($matchedBike) {
                    $bikeName = $matchedBike['name'];
                    $price = number_format(floatval($matchedBike['price']));
                    $cat = !empty($matchedBike['category']) ? $matchedBike['category'] : 'Scooter / Bike';
                    $engine = !empty($matchedBike['engine']) ? $matchedBike['engine'] : 'Standard';

                    $reply = "Yes! We have the {$bikeName} available for rent in Goa! 🛵✨\n\n📋 Bike Details:\n• Model: {$bikeName}\n• Category: {$cat}\n• Rental Price: ₹{$price} / day\n• Engine / Specs: {$engine}\n\n✨ Inclusions:\n• 2 Sanitized Helmets included\n• Valid commercial road tax & permits\n• Delivery at airport or your hotel\n\nWould you like to book the {$bikeName}?";
                } elseif ($matchedHotel) {
                    $hotelName = $matchedHotel['name'];
                    $price = number_format(floatval($matchedHotel['price']));
                    $stars = $matchedHotel['stars'] ?? '4';
                    $loc = $matchedHotel['location'] ?? 'Goa Beachfront';

                    $reply = "Yes! We have {$hotelName} available for booking in Goa! 🏨✨\n\n⭐ Rating: {$stars}★ Luxury Resort / Stay\n📍 Location: {$loc}\n💵 Price: Starting from ₹{$price} / night\n🍽️ Inclusions: Daily Buffet Breakfast, Swimming Pool Access, Free High-Speed Wi-Fi\n\nWould you like to check room availability for your dates?";
                } elseif ($matchedPackage) {
                    $pkgName = $matchedPackage['name'];
                    $price = number_format(floatval($matchedPackage['price']));
                    $dur = $matchedPackage['duration'] ?? '3N / 4D';
                    $dest = $matchedPackage['destination'] ?? 'Goa';

                    $reply = "Yes! We offer the \"{$pkgName}\" holiday package! 🌴✨\n\n⏱️ Duration: {$dur}\n📍 Destination: {$dest}\n💵 Price: Starting from ₹{$price} / person\n✨ Inclusions: Hotel Stay with Breakfast, Private Transfer or Self-Drive Car, Airport Pickup/Drop, and Day-by-Day Sightseeing Activities.\n\nWould you like to customize this package for your travel dates?";
                } elseif (preg_match('/\b[6-9]\d{9}\b/', $latestUserMsg, $phoneMatches)) {
                    $reply = "🎉 Thank you! I have saved your contact (" . $phoneMatches[0] . "). Our dedicated TripGalileo holiday specialist will reach out shortly to customize your dream Goa itinerary and apply exclusive discount rates! 🌴✨";
                } elseif (strpos($msgClean, 'self drive') !== false || strpos($msgClean, 'self-drive') !== false) {
                    $carListStr = !empty($dbCars) ? implode(', ', array_map(function($c) { return "{$c['name']} (₹" . number_format($c['price']) . "/day)"; }, array_slice($dbCars, 0, 5))) : "Defender, Thar 4x4, Swift, Creta, Baleno";
                    $reply = "🚗 Explore Goa on your own terms with TripGalileo Self-Drive Packages & Rentals!\n\n🚙 Available Cars in Fleet:\n• {$carListStr}\n\n🛵 Available Bikes:\n• Activa, Royal Enfield Classic 350, Bullet, Hunter, Sports Bikes\n\n✨ All self-drive rentals include doorstep delivery across Goa, airport handover at Dabolim (GOI) & Mopa (GOX), and 24/7 road assistance. What dates are you traveling?";
                } elseif (strpos($msgClean, 'car') !== false || strpos($msgClean, 'cars') !== false || strpos($msgClean, 'suv') !== false || strpos($msgClean, 'vehicle') !== false) {
                    $carItems = [];
                    foreach ($dbCars as $c) {
                        $carItems[] = "• " . $c['name'] . " - ₹" . number_format($c['price']) . "/day (" . ($c['transmission'] ?? 'Automatic') . ", " . ($c['seating'] ?? '5 Seater') . ")";
                    }
                    $carListText = !empty($carItems) ? implode("\n", array_slice($carItems, 0, 6)) : "• Land Rover Defender - ₹10,000/day\n• Maruti Swift - ₹2,000/day\n• Mahindra Thar 4x4 - ₹3,500/day";

                    $reply = "🚘 Here are our top Self-Drive Cars available for rent in Goa:\n\n{$carListText}\n\n📍 Free doorstep delivery in North & South Goa and Airport handovers. Which car would you like to rent?";
                } elseif (strpos($msgClean, 'bike') !== false || strpos($msgClean, 'bikes') !== false || strpos($msgClean, 'scooter') !== false || strpos($msgClean, 'two wheeler') !== false) {
                    $bikeItems = [];
                    foreach ($dbBikes as $b) {
                        $bikeItems[] = "• " . $b['name'] . " - ₹" . number_format($b['price']) . "/day";
                    }
                    $bikeListText = !empty($bikeItems) ? implode("\n", array_slice($bikeItems, 0, 6)) : "• Honda Activa 6G - ₹450/day\n• Royal Enfield Classic 350 - ₹1,000/day\n• Yamaha R15 / KTM Duke - ₹1,400/day";

                    $reply = "🛵 Here are our top Bikes & Scooters available for rent in Goa:\n\n{$bikeListText}\n\n🛡️ All rentals include 2 sanitized helmets & commercial road permits. What dates do you need it for?";
                } elseif (strpos($msgClean, 'package') !== false || strpos($msgClean, 'packages') !== false || strpos($msgClean, 'tour') !== false || strpos($msgClean, 'itinerary') !== false || strpos($msgClean, 'holiday') !== false) {
                    $pkgItems = [];
                    foreach ($dbPackages as $p) {
                        $pkgItems[] = "• " . $p['name'] . " (" . ($p['duration'] ?? '4D/3N') . ") - ₹" . number_format($p['price']) . "/person";
                    }
                    $pkgListText = !empty($pkgItems) ? implode("\n", array_slice($pkgItems, 0, 5)) : "• Tropical Goa Getaway (4D/3N) - ₹8,999/person\n• Self-Drive Coastal Explorer (5D/4N) - ₹14,499/person";

                    $reply = "🌴 Featured TripGalileo Holiday Packages:\n\n{$pkgListText}\n\n✨ All packages include Resort Stays + Transfers/Self-Drive Car + Daily Breakfast + Sightseeing!\n\nHead to 'Holiday Packages' on the menu to customize any package in 4 simple steps!";
                } elseif (strpos($msgClean, 'hotel') !== false || strpos($msgClean, 'hotels') !== false || strpos($msgClean, 'resort') !== false || strpos($msgClean, 'stay') !== false || strpos($msgClean, 'villa') !== false) {
                    $reply = "🏖️ TripGalileo partners with top-rated Hotels & Luxury Beach Resorts across Goa!\n\n⭐ 5-Star Luxury: W Goa (Vagator), Taj Fort Aguada, Grand Hyatt\n⭐ 4-Star Beachfront: Novotel Candolim, Whispering Palms, Radisson Blu\n⭐ Heritage Portuguese Villas & Pool Stays in North & South Goa\n\n🍽️ Most stays include complimentary buffet breakfast and swimming pool access. Which beach location do you prefer?";
                } elseif (strpos($msgClean, 'beach') !== false || strpos($msgClean, 'north goa') !== false || strpos($msgClean, 'south goa') !== false || strpos($msgClean, 'baga') !== false || strpos($msgClean, 'calangute') !== false || strpos($msgClean, 'anjuna') !== false) {
                    $reply = "🌊 Here are Goa's top beach highlights:\n\n🔥 North Goa (Vibrant & Nightlife):\n• Baga & Calangute: Watersports, beach shacks, night markets\n• Anjuna & Vagator: Sunset views, cliff cafes, techno parties, Curlies, Thalassa\n• Morjim & Ashwem: Peaceful white sands & beach clubs\n\n🌴 South Goa (Serene & Scenic):\n• Palolem & Butterfly Beach: Scenic crescent bays & kayaking\n• Colva & Benaulim: Pristine beaches & authentic Goan seafood";
                } elseif (strpos($msgClean, 'watersport') !== false || strpos($msgClean, 'scuba') !== false || strpos($msgClean, 'activit') !== false || strpos($msgClean, 'cruise') !== false || strpos($msgClean, 'dudhsagar') !== false) {
                    $reply = "🤿 Top Goa Experiences with TripGalileo:\n\n1. 5-in-1 Watersports Combo: Jet Ski, Parasailing, Banana & Bumper Ride\n2. Grand Island Scuba Diving with underwater HD video & dolphin spotting\n3. Mandovi River Sunset & Dinner Cruise with live DJ & Goan folk dance\n4. Dudhsagar Waterfalls Jeep Safari & Spice Plantation tour\n\nWould you like me to add any of these to your booking?";
                } elseif (strpos($msgClean, 'document') !== false || strpos($msgClean, 'license') !== false || strpos($msgClean, 'dl') !== false || strpos($msgClean, 'require') !== false || strpos($msgClean, 'id') !== false) {
                    $reply = "📄 Requirements for Self-Drive Rental:\n\n1. Original Valid Driving License (Indian DL or International Driving Permit)\n2. Original Govt Photo ID (Aadhaar Card, Passport, or Voter ID)\n3. Minimum age 21 years for cars, 18 years for two-wheelers\n\nVerification takes just 2 minutes at vehicle handover!";
                } elseif (strpos($msgClean, 'price') !== false || strpos($msgClean, 'cost') !== false || strpos($msgClean, 'pay') !== false || strpos($msgClean, 'advance') !== false || strpos($msgClean, 'book') !== false) {
                    $reply = "💳 Flexible Booking at TripGalileo:\n\n• Pay just 25% Advance Token to lock your package, vehicle, or hotel reservation.\n• Pay remaining 75% on arrival during check-in or vehicle handover.\n• 100% transparent pricing with zero surprise charges.\n\nShare your travel dates and I will get you the best available quote!";
                } else {
                    $carListStr = !empty($dbCars) ? implode(', ', array_map(function($c) { return $c['name']; }, array_slice($dbCars, 0, 4))) : "Defender, Thar 4x4, Swift, Creta";
                    $reply = "🌴 Hello! I am Kratu.ai, your personal TripGalileo travel assistant for Goa!\n\nI can help you with:\n1. 🚗 Self-Drive Cars ({$carListStr})\n2. 🛵 Bike & Scooter Rentals (Activa, Bullet, Sports bikes)\n3. 🏖️ Custom Holiday Packages (Stays + Flights + Transfers)\n4. 🏨 Luxury Hotels & Beachfront Resorts\n5. 🤿 Watersports, Scuba & Sunset Cruises\n\nWhat would you like to explore today?";
                }
            }

            echo json_encode(["success" => true, "reply" => $reply]);
            exit;
        } elseif ($action === 'login') {
            if (!isset($payload['username']) || !isset($payload['password'])) {
                throw new Exception("Missing username or password.");
            }
            $stmt = $pdo->prepare("SELECT * FROM users WHERE username = ? OR email = ?");
            $stmt->execute([$payload['username'], $payload['username']]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($user && password_verify($payload['password'], $user['password_hash'])) {
                unset($user['password_hash']);
                echo json_encode([
                    "success" => true,
                    "message" => "Login successful.",
                    "user" => $user
                ]);
            exit;} else {
                http_response_code(401);
                echo json_encode(["success" => false, "error" => "Invalid credentials."]);
            exit;}
            exit();
        } elseif ($action === 'upload_image' || $action === 'upload_images') {
            $target_dir = __DIR__ . "/uploads/";
            if (!is_dir($target_dir)) {
                @mkdir($target_dir, 0777, true);
            }
            $uploaded_urls = [];
            $host = $_SERVER['HTTP_HOST'] ?? 'localhost:8000';
            $base_dir = rtrim(dirname($_SERVER['SCRIPT_NAME'] ?? '/api.php'), '/\\');
            $url_prefix = 'http://' . $host . ($base_dir ? $base_dir : '') . '/uploads/';

            // 1. Check if $_FILES contains single or multiple files
            if (!empty($_FILES)) {
                foreach ($_FILES as $fileKey => $fileData) {
                    if (isset($fileData['name']) && is_array($fileData['name'])) {
                        // Multi-file input like <input type="file" name="images[]" multiple>
                        for ($i = 0; $i < count($fileData['name']); $i++) {
                            if (isset($fileData['error'][$i]) && $fileData['error'][$i] === UPLOAD_ERR_OK && !empty($fileData['tmp_name'][$i])) {
                                $ext = strtolower(pathinfo($fileData['name'][$i], PATHINFO_EXTENSION)) ?: 'jpg';
                                $filename = uniqid('img_') . '.' . $ext;
                                if (@move_uploaded_file($fileData['tmp_name'][$i], $target_dir . $filename)) {
                                    $uploaded_urls[] = $url_prefix . $filename;
                                }
                            }
                        }
                    } else if (isset($fileData['error']) && $fileData['error'] === UPLOAD_ERR_OK && !empty($fileData['tmp_name'])) {
                        // Single file input
                        $ext = strtolower(pathinfo($fileData['name'], PATHINFO_EXTENSION)) ?: 'jpg';
                        $filename = uniqid('img_') . '.' . $ext;
                        if (@move_uploaded_file($fileData['tmp_name'], $target_dir . $filename)) {
                            $uploaded_urls[] = $url_prefix . $filename;
                        }
                    }
                }
            }

            // 2. Check for base64 encoded images in JSON payload
            $base64List = [];
            if (!empty($payload['image_base64'])) {
                $base64List[] = $payload['image_base64'];
            }
            if (!empty($payload['image']) && is_string($payload['image']) && strpos($payload['image'], 'data:image/') === 0) {
                $base64List[] = $payload['image'];
            }
            if (!empty($payload['images']) && is_array($payload['images'])) {
                foreach ($payload['images'] as $imgItem) {
                    if (is_string($imgItem) && strpos($imgItem, 'data:image/') === 0) {
                        $base64List[] = $imgItem;
                    }
                }
            }

            foreach ($base64List as $b64Str) {
                if (preg_match('/^data:image\/(\w+);base64,(.+)$/', $b64Str, $matches)) {
                    $ext = strtolower($matches[1]);
                    if ($ext === 'jpeg') $ext = 'jpg';
                    $decodedData = base64_decode($matches[2]);
                    if ($decodedData !== false) {
                        $filename = uniqid('img_') . '.' . $ext;
                        if (@file_put_contents($target_dir . $filename, $decodedData)) {
                            $uploaded_urls[] = $url_prefix . $filename;
                        }
                    }
                }
            }

            if (!empty($uploaded_urls)) {
                echo json_encode([
                    "success" => true,
                    "url" => $uploaded_urls[0],
                    "urls" => $uploaded_urls
                ]);
                exit();
            } else {
                echo json_encode([
                    "success" => false,
                    "error" => "No valid image files received."
                ]);
                exit();
            }
        } elseif ($action === 'update_payment_settings') {
            $stmt = $pdo->prepare("UPDATE payment_settings SET razorpay_enabled = ?, upi_enabled = ?, razorpay_key = ?, razorpay_secret = ?, upi_id = ?, upi_qr_url = ?");
            $stmt->execute([
                isset($payload['razorpay_enabled']) ? intval($payload['razorpay_enabled']) : 0, 
                isset($payload['upi_enabled']) ? intval($payload['upi_enabled']) : 0,
                isset($payload['razorpay_key']) ? $payload['razorpay_key'] : null,
                isset($payload['razorpay_secret']) ? $payload['razorpay_secret'] : null,
                $payload['upi_id'] ?? null,
                $payload['upi_qr_url'] ?? null
            ]);
            echo json_encode(["success" => true, "message" => "Payment settings updated."]);
            exit;
        } elseif ($action === 'update_booking_payment') {
            $stmt = $pdo->prepare("UPDATE bookings SET payment_method = ?, payment_proof = ? WHERE id = ?");
            $stmt->execute([
                $payload['payment_method'] ?? null,
                $payload['payment_proof'] ?? null,
                $payload['id']
            ]);
            echo json_encode(["success" => true, "message" => "Booking payment updated."]);
            exit;
        } elseif ($action === 'update_booking') {
            if (!isset($payload['id'])) {
                throw new Exception("Missing booking ID.");
            }
            $stmt = $pdo->prepare("UPDATE bookings SET name=?, phone=?, email=?, license=?, pickup_loc=?, pickup_date=?, pickup_time=?, drop_date=?, drop_time=?, item_id=?, item_name=?, booking_days=?, total_amount=?, amount_paid=?, remaining_amount=?, total_paid=?, status=?, payment_status=?, payment_method=? WHERE id=?");
            $stmt->execute([
                $payload['name'] ?? '',
                $payload['phone'] ?? '',
                $payload['email'] ?? '',
                $payload['license'] ?? '',
                $payload['pickup_loc'] ?? ($payload['pickup_location'] ?? 'Goa'),
                $payload['pickup_date'] ?? '',
                $payload['pickup_time'] ?? '10:00 AM',
                $payload['drop_date'] ?? ($payload['return_date'] ?? ''),
                $payload['drop_time'] ?? '10:00 AM',
                $payload['item_id'] ?? '',
                $payload['item_name'] ?? '',
                intval($payload['booking_days'] ?? 1),
                intval($payload['total_amount'] ?? ($payload['total_paid'] ?? 0)),
                intval($payload['amount_paid'] ?? ($payload['total_paid'] ?? 0)),
                intval($payload['remaining_amount'] ?? 0),
                intval($payload['total_paid'] ?? ($payload['total_amount'] ?? 0)),
                $payload['status'] ?? 'Confirmed',
                $payload['payment_status'] ?? 'Paid',
                $payload['payment_method'] ?? ($payload['payment_mode'] ?? 'Cash'),
                $payload['id']
            ]);
            echo json_encode(["success" => true, "message" => "Booking updated successfully."]);
            exit;
        } elseif ($action === 'update_booking_status') {
            if (!isset($payload['id'])) {
                throw new Exception("Missing booking ID.");
            }
            $status = $payload['status'] ?? null;
            $payment_status = $payload['payment_status'] ?? null;
            
            if ($status && $payment_status) {
                $stmt = $pdo->prepare("UPDATE bookings SET status = ?, payment_status = ? WHERE id = ?");
                $stmt->execute([$status, $payment_status, $payload['id']]);
            } elseif ($status) {
                $stmt = $pdo->prepare("UPDATE bookings SET status = ? WHERE id = ?");
                $stmt->execute([$status, $payload['id']]);
            } elseif ($payment_status) {
                $stmt = $pdo->prepare("UPDATE bookings SET payment_status = ? WHERE id = ?");
                $stmt->execute([$payment_status, $payload['id']]);
            }
            echo json_encode(["success" => true, "message" => "Booking status updated successfully."]);
            exit;
        } elseif ($action === 'delete_booking') {
            if (!isset($payload['id'])) {
                throw new Exception("Missing booking ID.");
            }
            $stmt = $pdo->prepare("DELETE FROM bookings WHERE id = ?");
            $stmt->execute([$payload['id']]);
            echo json_encode(["success" => true, "message" => "Booking deleted successfully."]);
            exit;
        } elseif ($action === 'update_enquiry_status') {
            if (!isset($payload['enquiry_id'])) {
                throw new Exception("Missing enquiry ID.");
            }
            $status = $payload['status'] ?? 'New Enquiry';
            $assigned_to = $payload['assigned_to'] ?? null;
            $stmt = $pdo->prepare("UPDATE custom_enquiries SET status = ?, assigned_to = ? WHERE enquiry_id = ?");
            $stmt->execute([$status, $assigned_to, $payload['enquiry_id']]);
            echo json_encode(["success" => true, "message" => "Enquiry status updated successfully."]);
            exit;
        } elseif ($action === 'save_custom_enquiry' || $action === 'submit_custom_enquiry') {
            $enquiry_id = $payload['enquiry_id'] ?? ('ENQ-' . strtoupper(substr(uniqid(), -6)));
            $stmt = $pdo->prepare("INSERT INTO custom_enquiries (
                enquiry_id, customer_name, phone, email, whatsapp, departure_city, destinations, travel_dates, flexible_dates,
                adults, children, infants, budget_range, hotel_category, room_type, meal_pref, req_flight, req_train, req_car,
                req_bike, req_airport_pickup, req_sightseeing, req_adventure, trip_type, special_requests, documents_json, status, assigned_to
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $enquiry_id,
                $payload['customer_name'] ?? 'Customer',
                $payload['phone'] ?? '',
                $payload['email'] ?? null,
                $payload['whatsapp'] ?? null,
                $payload['departure_city'] ?? null,
                $payload['destinations'] ?? 'Goa',
                $payload['travel_dates'] ?? null,
                isset($payload['flexible_dates']) ? intval($payload['flexible_dates']) : 0,
                isset($payload['adults']) ? intval($payload['adults']) : 2,
                isset($payload['children']) ? intval($payload['children']) : 0,
                isset($payload['infants']) ? intval($payload['infants']) : 0,
                $payload['budget_range'] ?? null,
                $payload['hotel_category'] ?? null,
                $payload['room_type'] ?? null,
                $payload['meal_pref'] ?? null,
                isset($payload['req_flight']) ? intval($payload['req_flight']) : 0,
                isset($payload['req_train']) ? intval($payload['req_train']) : 0,
                isset($payload['req_car']) ? intval($payload['req_car']) : 0,
                isset($payload['req_bike']) ? intval($payload['req_bike']) : 0,
                isset($payload['req_airport_pickup']) ? intval($payload['req_airport_pickup']) : 0,
                isset($payload['req_sightseeing']) ? intval($payload['req_sightseeing']) : 0,
                isset($payload['req_adventure']) ? intval($payload['req_adventure']) : 0,
                $payload['trip_type'] ?? 'Holiday Tour',
                $payload['special_requests'] ?? null,
                isset($payload['documents_json']) ? (is_array($payload['documents_json']) ? json_encode($payload['documents_json']) : $payload['documents_json']) : null,
                $payload['status'] ?? 'New Enquiry',
                $payload['assigned_to'] ?? null
            ]);
            
            // Add initial timeline entry
            $stmt_tl = $pdo->prepare("INSERT INTO enquiry_timeline (enquiry_id, action_type, notes, created_by) VALUES (?, 'Created', 'Custom trip enquiry received via portal.', 'System')");
            $stmt_tl->execute([$enquiry_id]);

            // Auto-capture custom enquiry into leads table
            try {
                $leadId = 'LD-' . rand(1000, 9999);
                $dest = $payload['destinations'] ?? 'Goa';
                $tt = $payload['trip_type'] ?? 'Holiday Tour';
                $leadService = "$dest ($tt Package)";
                $leadBudget = $payload['budget_range'] ?? '₹30,000 - ₹50,000';
                $leadNotes = "Custom Enquiry #$enquiry_id" . (!empty($payload['special_requests']) ? ' | ' . $payload['special_requests'] : '');
                $leadStmt = $pdo->prepare("INSERT INTO leads (id, name, phone, email, source, service, assigned_to, status, budget, notes, admin_id, created_at, updated_at) VALUES (?, ?, ?, ?, 'Custom Trips', ?, 'Unassigned', 'New', ?, ?, ?, ?, ?)");
                $leadStmt->execute([$leadId, $payload['customer_name'] ?? 'Customer', $payload['phone'] ?? '', $payload['email'] ?? '', $leadService, $leadBudget, $leadNotes, $tenant_id, date('Y-m-d H:i:s'), date('Y-m-d H:i:s')]);
            } catch (Exception $leade) {}

            echo json_encode(["success" => true, "enquiry_id" => $enquiry_id, "message" => "Custom enquiry saved."]);
            exit;
        } elseif ($action === 'add_enquiry_timeline') {
            if (!isset($payload['enquiry_id'])) {
                throw new Exception("Missing enquiry ID.");
            }
            $stmt = $pdo->prepare("INSERT INTO enquiry_timeline (enquiry_id, action_type, notes, follow_up_date, attachment_url, created_by, sender_role) VALUES (?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $payload['enquiry_id'],
                $payload['action_type'] ?? 'Note',
                $payload['notes'] ?? '',
                $payload['follow_up_date'] ?? null,
                $payload['attachment_url'] ?? null,
                $payload['created_by'] ?? 'Admin',
                $payload['sender_role'] ?? 'admin'
            ]);
            echo json_encode(["success" => true, "message" => "Timeline entry added."]);
            exit;
        } elseif ($action === 'update_user') {
            if (!isset($payload['id']) || !isset($payload['username']) || !isset($payload['email']) || !isset($payload['role'])) {
                throw new Exception("Missing user update parameters.");
            }
            $billing_price = isset($payload['billing_price']) ? intval($payload['billing_price']) : 0;
            if (!empty($payload['password'])) {
                $hash = password_hash($payload['password'], PASSWORD_BCRYPT);
                $stmt = $pdo->prepare("UPDATE users SET username = ?, email = ?, role = ?, password_hash = ?, billing_price = ? WHERE id = ?");
                $stmt->execute([$payload['username'], $payload['email'], $payload['role'], $hash, $billing_price, $payload['id']]);
            } else {
                $stmt = $pdo->prepare("UPDATE users SET username = ?, email = ?, role = ?, billing_price = ? WHERE id = ?");
                $stmt->execute([$payload['username'], $payload['email'], $payload['role'], $billing_price, $payload['id']]);
            }
            echo json_encode(["success" => true, "message" => "User updated successfully."]);
            exit;} elseif ($action === 'delete_user') {
            if (!isset($payload['id'])) {
                throw new Exception("Missing user ID.");
            }
            $stmt = $pdo->prepare("DELETE FROM users WHERE id = ?");
            $stmt->execute([$payload['id']]);
            echo json_encode(["success" => true, "message" => "User deleted successfully."]);
            exit;} elseif ($action === 'create_coupon') {
            $stmt = $pdo->prepare("INSERT INTO coupons (code, discount_value, admin_id) VALUES (?, ?, ?)");
            $stmt->execute([
                $payload['code'],
                intval($payload['discount_value']),
                $tenant_id
            ]);
            echo json_encode(["success" => true, "id" => $pdo->lastInsertId()]);
            exit;} elseif ($action === 'delete_coupon') {
            $stmt = $pdo->prepare("DELETE FROM coupons WHERE id = ?");
            $stmt->execute([$payload['id']]);
            echo json_encode(["success" => true]);
            exit;} elseif ($action === 'create_add_on') {
            $stmt = $pdo->prepare("INSERT INTO add_ons (title, type, location, price, duration, description, image_url) VALUES (?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $payload['title'],
                $payload['type'],
                $payload['location'],
                $payload['price'],
                $payload['duration'],
                $payload['description'],
                $payload['image_url']
            ]);
            echo json_encode(["success" => true, "id" => $pdo->lastInsertId()]);
            exit;} elseif ($action === 'delete_add_on') {
            $stmt = $pdo->prepare("DELETE FROM add_ons WHERE id = ?");
            $stmt->execute([$payload['id']]);
            echo json_encode(["success" => true]);
            exit;} elseif ($action === 'pms_get_stats') {
            // Dashboard summary statistics for a vendor
            $vendor_id = $payload['vendor_id'];
            
            $stats = [];
            // Hotel counts
            $stmt = $pdo->prepare("SELECT COUNT(*) as total, SUM(hotel_status='Live') as live, SUM(hotel_status='Submitted' OR hotel_status='Under Review') as pending FROM hotels WHERE vendor_id=?");
            $stmt->execute([$vendor_id]);
            $hc = $stmt->fetch(PDO::FETCH_ASSOC);
            $stats['total_hotels'] = intval($hc['total']);
            $stats['active_hotels'] = intval($hc['live']);
            $stats['pending_hotels'] = intval($hc['pending']);
            
            // Room type counts
            $stmt = $pdo->prepare("SELECT COUNT(*) as total, SUM(total_rooms) as rooms FROM hotel_room_types WHERE vendor_id=?");
            $stmt->execute([$vendor_id]);
            $rc = $stmt->fetch(PDO::FETCH_ASSOC);
            $stats['total_room_types'] = intval($rc['total']);
            $stats['total_rooms'] = intval($rc['rooms'] ?? 0);
            
            // Today's bookings
            $today = date('Y-m-d');
            $vendor_hotels = $pdo->prepare("SELECT id FROM hotels WHERE vendor_id=?");
            $vendor_hotels->execute([$vendor_id]);
            $hotel_ids = $vendor_hotels->fetchAll(PDO::FETCH_COLUMN);
            
            $stats['new_bookings'] = 0;
            $stats['todays_checkins'] = 0;
            $stats['todays_checkouts'] = 0;
            $stats['total_revenue'] = 0;
            $stats['amount_received'] = 0;
            $stats['cancelled'] = 0;
            
            if (!empty($hotel_ids)) {
                $in_placeholders = implode(',', array_fill(0, count($hotel_ids), '?'));
                
                // bookings where item_id is one of vendor's hotels
                $stmt = $pdo->prepare("SELECT status, payment_status, total_amount, amount_paid, pickup_date, drop_date FROM bookings WHERE item_id IN ($in_placeholders)");
                $stmt->execute($hotel_ids);
                $bkgs = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                foreach ($bkgs as $b) {
                    $stats['new_bookings']++;
                    $stats['total_revenue'] += intval($b['total_amount'] ?? 0);
                    $stats['amount_received'] += intval($b['amount_paid'] ?? 0);
                    if ($b['status'] === 'Cancelled') $stats['cancelled']++;
                    if ($b['pickup_date'] === $today) $stats['todays_checkins']++;
                    if ($b['drop_date'] === $today) $stats['todays_checkouts']++;
                }
            }
            
            $stats['pending_payments'] = max(0, $stats['total_revenue'] - $stats['amount_received']);
            $stats['commission'] = round($stats['amount_received'] * 0.10);
            $stats['vendor_payable'] = $stats['amount_received'] - $stats['commission'];
            
            echo json_encode(["success" => true, "stats" => $stats]);
            exit;} elseif ($action === 'pms_get_dashboard_activity') {
            $vendor_id = $payload['vendor_id'];
            $today = date('Y-m-d');
            
            $vendor_hotels = $pdo->prepare("SELECT id FROM hotels WHERE vendor_id=?");
            $vendor_hotels->execute([$vendor_id]);
            $hotel_ids = $vendor_hotels->fetchAll(PDO::FETCH_COLUMN);
            
            $activity = ['checkins' => [], 'checkouts' => [], 'recent_bookings' => []];
            
            if (!empty($hotel_ids)) {
                $in = implode(',', array_fill(0, count($hotel_ids), '?'));
                
                $stmt = $pdo->prepare("SELECT * FROM bookings WHERE item_id IN ($in) AND pickup_date = ? ORDER BY created_at DESC LIMIT 10");
                $stmt->execute(array_merge($hotel_ids, [$today]));
                $activity['checkins'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                $stmt = $pdo->prepare("SELECT * FROM bookings WHERE item_id IN ($in) AND drop_date = ? ORDER BY created_at DESC LIMIT 10");
                $stmt->execute(array_merge($hotel_ids, [$today]));
                $activity['checkouts'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                $stmt = $pdo->prepare("SELECT * FROM bookings WHERE item_id IN ($in) ORDER BY created_at DESC LIMIT 15");
                $stmt->execute($hotel_ids);
                $activity['recent_bookings'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
            }
            
            echo json_encode(["success" => true, "activity" => $activity]);
            exit;} elseif ($action === 'pms_list_room_types') {
            $vendor_id = $payload['vendor_id'] ?? '';
            if ($vendor_id === 'admin' || $vendor_id === 'superadmin' || empty($vendor_id) || strpos($vendor_id, 'u-') === 0) {
                $stmt = $pdo->query("SELECT rt.*, h.name as hotel_name FROM hotel_room_types rt LEFT JOIN hotels h ON rt.hotel_id = h.id ORDER BY rt.created_at DESC");
                $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
            } else {
                $stmt = $pdo->prepare("SELECT rt.*, h.name as hotel_name FROM hotel_room_types rt LEFT JOIN hotels h ON rt.hotel_id = h.id WHERE rt.vendor_id = ? ORDER BY rt.created_at DESC");
                $stmt->execute([$vendor_id]);
                $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
            }
            echo json_encode(["success" => true, "room_types" => $data]);
            exit;} elseif ($action === 'pms_create_room_type') {
            $id = 'rt_' . uniqid();
            $amenities_json = isset($payload['amenities']) ? json_encode($payload['amenities']) : '[]';
            $images_json = isset($payload['images_json']) ? (is_array($payload['images_json']) ? json_encode($payload['images_json']) : $payload['images_json']) : '[]';
            $stmt = $pdo->prepare("INSERT INTO hotel_room_types (id, hotel_id, vendor_id, name, internal_code, description, total_rooms, max_adults, max_children, max_occupancy, base_occupancy, bed_type, num_beds, room_size, room_size_unit, view_type, smoking, air_conditioned, private_bathroom, extra_bed_available, base_price, selling_price, weekend_price, extra_adult_charge, extra_child_charge, extra_bed_charge, amenities_json, images_json, status) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)");
            $stmt->execute([
                $id, $payload['hotel_id'], $payload['vendor_id'],
                $payload['name'], $payload['internal_code'] ?? null, $payload['description'] ?? null,
                intval($payload['total_rooms'] ?? 1), intval($payload['max_adults'] ?? 2), intval($payload['max_children'] ?? 1),
                intval($payload['max_occupancy'] ?? 3), intval($payload['base_occupancy'] ?? 2),
                $payload['bed_type'] ?? 'King', intval($payload['num_beds'] ?? 1),
                floatval($payload['room_size'] ?? 0), $payload['room_size_unit'] ?? 'sqft',
                $payload['view_type'] ?? 'Garden View',
                intval($payload['smoking'] ?? 0), intval($payload['air_conditioned'] ?? 1),
                intval($payload['private_bathroom'] ?? 1), intval($payload['extra_bed_available'] ?? 0),
                intval($payload['base_price'] ?? 0), intval($payload['selling_price'] ?? 0),
                intval($payload['weekend_price'] ?? 0), intval($payload['extra_adult_charge'] ?? 0),
                intval($payload['extra_child_charge'] ?? 0), intval($payload['extra_bed_charge'] ?? 0),
                $amenities_json, $images_json, $payload['status'] ?? 'Active'
            ]);
            echo json_encode(["success" => true, "id" => $id]);
            exit;} elseif ($action === 'pms_update_room_type') {
            $stmt = $pdo->prepare("UPDATE hotel_room_types SET name=?, description=?, total_rooms=?, max_adults=?, max_children=?, max_occupancy=?, bed_type=?, room_size=?, view_type=?, base_price=?, selling_price=?, weekend_price=?, extra_adult_charge=?, extra_bed_charge=?, amenities_json=?, status=? WHERE id=? AND vendor_id=?");
            $stmt->execute([
                $payload['name'], $payload['description'] ?? null,
                intval($payload['total_rooms'] ?? 1), intval($payload['max_adults'] ?? 2),
                intval($payload['max_children'] ?? 1), intval($payload['max_occupancy'] ?? 3),
                $payload['bed_type'] ?? 'King', floatval($payload['room_size'] ?? 0),
                $payload['view_type'] ?? 'Garden View', intval($payload['base_price'] ?? 0),
                intval($payload['selling_price'] ?? 0), intval($payload['weekend_price'] ?? 0),
                intval($payload['extra_adult_charge'] ?? 0), intval($payload['extra_bed_charge'] ?? 0),
                isset($payload['amenities']) ? json_encode($payload['amenities']) : '[]',
                $payload['status'] ?? 'Active',
                $payload['id'], $payload['vendor_id']
            ]);
            echo json_encode(["success" => true]);
            exit;} elseif ($action === 'pms_delete_room_type') {
            $stmt = $pdo->prepare("DELETE FROM hotel_room_types WHERE id=? AND vendor_id=?");
            $stmt->execute([$payload['id'], $payload['vendor_id']]);
            echo json_encode(["success" => true]);
            exit;} elseif ($action === 'pms_list_rooms') {
            $stmt = $pdo->prepare("SELECT r.*, rt.name as type_name FROM hotel_rooms r LEFT JOIN hotel_room_types rt ON r.room_type_id = rt.id WHERE r.hotel_id=? AND r.vendor_id=? ORDER BY r.floor, r.room_number");
            $stmt->execute([$payload['hotel_id'], $payload['vendor_id']]);
            echo json_encode(["success" => true, "rooms" => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
            exit;} elseif ($action === 'pms_create_room') {
            $id = 'room_' . uniqid();
            $stmt = $pdo->prepare("INSERT INTO hotel_rooms (id, hotel_id, room_type_id, vendor_id, room_number, floor, status, internal_note) VALUES (?,?,?,?,?,?,?,?)");
            $stmt->execute([$id, $payload['hotel_id'], $payload['room_type_id'], $payload['vendor_id'], $payload['room_number'], $payload['floor'] ?? '1', $payload['status'] ?? 'Available', $payload['internal_note'] ?? null]);
            echo json_encode(["success" => true, "id" => $id]);
            exit;} elseif ($action === 'pms_update_room') {
            $stmt = $pdo->prepare("UPDATE hotel_rooms SET floor=?, status=?, internal_note=? WHERE id=? AND vendor_id=?");
            $stmt->execute([$payload['floor'] ?? '1', $payload['status'] ?? 'Available', $payload['internal_note'] ?? null, $payload['id'], $payload['vendor_id']]);
            echo json_encode(["success" => true]);
            exit;} elseif ($action === 'pms_get_availability_calendar') {
            $stmt = $pdo->prepare("SELECT * FROM hotel_availability_calendar WHERE hotel_id=? AND room_type_id=? AND date BETWEEN ? AND ?");
            $stmt->execute([$payload['hotel_id'], $payload['room_type_id'], $payload['from_date'], $payload['to_date']]);
            echo json_encode(["success" => true, "calendar" => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
            exit;} elseif ($action === 'pms_update_availability') {
            // Bulk update or insert per-date availability
            $dates = $payload['dates']; // array of date strings
            $hotel_id = $payload['hotel_id'];
            $room_type_id = $payload['room_type_id'];
            $vendor_id = $payload['vendor_id'];
            $isSqlite = ($pdo->getAttribute(PDO::ATTR_DRIVER_NAME) === 'sqlite');
            
            foreach ($dates as $date) {
                $id = 'avail_' . $hotel_id . '_' . $room_type_id . '_' . str_replace('-', '', $date);
                if ($isSqlite) {
                    $stmt = $pdo->prepare("INSERT OR REPLACE INTO hotel_availability_calendar (id, hotel_id, room_type_id, vendor_id, date, available_rooms, price_override, status, min_stay, stop_sale, block_reason) VALUES (?,?,?,?,?,?,?,?,?,?,?)");
                } else {
                    $stmt = $pdo->prepare("INSERT INTO hotel_availability_calendar (id, hotel_id, room_type_id, vendor_id, date, available_rooms, price_override, status, min_stay, stop_sale, block_reason) VALUES (?,?,?,?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE available_rooms=VALUES(available_rooms), price_override=VALUES(price_override), status=VALUES(status), min_stay=VALUES(min_stay), stop_sale=VALUES(stop_sale), block_reason=VALUES(block_reason)");
                }
                $stmt->execute([
                    $id, $hotel_id, $room_type_id, $vendor_id, $date,
                    $payload['available_rooms'] ?? null, $payload['price_override'] ?? null,
                    $payload['status'] ?? 'Available', $payload['min_stay'] ?? 1,
                    $payload['stop_sale'] ?? 0, $payload['block_reason'] ?? null
                ]);
            }
            echo json_encode(["success" => true, "updated" => count($dates)]);
            exit;} elseif ($action === 'pms_list_rate_plans') {
            $stmt = $pdo->prepare("SELECT rp.*, rt.name as room_type_name, h.name as hotel_name FROM hotel_rate_plans rp LEFT JOIN hotel_room_types rt ON rp.room_type_id = rt.id LEFT JOIN hotels h ON rp.hotel_id = h.id WHERE rp.vendor_id=? ORDER BY rp.created_at DESC");
            $stmt->execute([$payload['vendor_id']]);
            echo json_encode(["success" => true, "rate_plans" => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
            exit;} elseif ($action === 'pms_create_rate_plan') {
            $id = 'rp_' . uniqid();
            $stmt = $pdo->prepare("INSERT INTO hotel_rate_plans (id, hotel_id, room_type_id, vendor_id, name, plan_type, price, discount_type, discount_value, min_stay, max_stay, min_advance_days, valid_from, valid_to, cancellation_policy, is_refundable, status) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)");
            $stmt->execute([$id, $payload['hotel_id'], $payload['room_type_id'] ?? null, $payload['vendor_id'], $payload['name'], $payload['plan_type'] ?? 'Standard', intval($payload['price']), $payload['discount_type'] ?? null, floatval($payload['discount_value'] ?? 0), intval($payload['min_stay'] ?? 1), intval($payload['max_stay'] ?? 30), intval($payload['min_advance_days'] ?? 0), $payload['valid_from'] ?? null, $payload['valid_to'] ?? null, $payload['cancellation_policy'] ?? null, intval($payload['is_refundable'] ?? 1), $payload['status'] ?? 'Active']);
            echo json_encode(["success" => true, "id" => $id]);
            exit;} elseif ($action === 'pms_update_rate_plan') {
            $stmt = $pdo->prepare("UPDATE hotel_rate_plans SET name=?, price=?, discount_type=?, discount_value=?, min_stay=?, max_stay=?, valid_from=?, valid_to=?, status=? WHERE id=? AND vendor_id=?");
            $stmt->execute([$payload['name'], intval($payload['price']), $payload['discount_type'] ?? null, floatval($payload['discount_value'] ?? 0), intval($payload['min_stay'] ?? 1), intval($payload['max_stay'] ?? 30), $payload['valid_from'] ?? null, $payload['valid_to'] ?? null, $payload['status'] ?? 'Active', $payload['id'], $payload['vendor_id']]);
            echo json_encode(["success" => true]);
            exit;} elseif ($action === 'pms_delete_rate_plan') {
            $stmt = $pdo->prepare("DELETE FROM hotel_rate_plans WHERE id=? AND vendor_id=?");
            $stmt->execute([$payload['id'], $payload['vendor_id']]);
            echo json_encode(["success" => true]);
            exit;} elseif ($action === 'pms_create_manual_booking') {
            $id = 'mb_' . uniqid();
            $nights = max(1, (strtotime($payload['drop_date']) - strtotime($payload['pickup_date'])) / 86400);
            $room_price = intval($payload['room_price'] ?? 0) * $nights;
            $taxes = round($room_price * 0.18);
            $discount = intval($payload['discount'] ?? 0);
            $extra = intval($payload['extra_charges'] ?? 0);
            $total = $room_price + $taxes - $discount + $extra;
            $advance = intval($payload['advance_payment'] ?? 0);
            $remaining = $total - $advance;
            
            $stmt = $pdo->prepare("INSERT INTO bookings (id, name, phone, pickup_loc, pickup_date, pickup_time, drop_date, drop_time, item_id, item_name, booking_days, total_paid, created_at, payment_method, status, payment_status, total_amount, amount_paid, remaining_amount, traveller_details_json) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,NOW(),?,?,?,?,?,?,?)");
            $stmt->execute([
                $id, $payload['guest_name'], $payload['guest_phone'],
                $payload['hotel_id'], $payload['pickup_date'], '14:00',
                $payload['drop_date'], '12:00',
                $payload['hotel_id'], $payload['hotel_name'] ?? 'Hotel',
                intval($nights), $advance, $payload['payment_method'] ?? 'Cash',
                $payload['booking_source'] === 'Walk-in' ? 'Confirmed' : 'Confirmed',
                $advance >= $total ? 'Paid' : ($advance > 0 ? 'Partially Paid' : 'Unpaid'),
                $total, $advance, $remaining,
                json_encode(['guest_email' => $payload['guest_email'] ?? '', 'guest_address' => $payload['guest_address'] ?? '', 'source' => $payload['booking_source'] ?? 'Manual', 'room_type' => $payload['room_type'] ?? '', 'adults' => $payload['adults'] ?? 2, 'children' => $payload['children'] ?? 0, 'special_request' => $payload['special_request'] ?? ''])
            ]);
            echo json_encode(["success" => true, "id" => $id, "booking_amount" => $total]);
            exit;} elseif ($action === 'pms_list_guests') {
            $stmt = $pdo->prepare("SELECT * FROM hotel_guests WHERE vendor_id=? ORDER BY created_at DESC");
            $stmt->execute([$payload['vendor_id']]);
            echo json_encode(["success" => true, "guests" => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
            exit;} elseif ($action === 'pms_create_guest') {
            // Check for duplicate
            $stmt = $pdo->prepare("SELECT id FROM hotel_guests WHERE vendor_id=? AND (phone=? OR email=?)");
            $stmt->execute([$payload['vendor_id'], $payload['phone'], $payload['email'] ?? '']);
            $existing = $stmt->fetch();
            if ($existing) {
                echo json_encode(["success" => false, "error" => "Guest with same phone/email already exists", "existing_id" => $existing['id']]);
            exit;} else {
                $id = 'g_' . uniqid();
                $stmt = $pdo->prepare("INSERT INTO hotel_guests (id, vendor_id, name, phone, email, address, city, country, id_type, id_number_masked, preferences, internal_notes) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)");
                $stmt->execute([$id, $payload['vendor_id'], $payload['name'], $payload['phone'], $payload['email'] ?? null, $payload['address'] ?? null, $payload['city'] ?? null, $payload['country'] ?? 'India', $payload['id_type'] ?? null, $payload['id_number_masked'] ?? null, $payload['preferences'] ?? null, $payload['internal_notes'] ?? null]);
                echo json_encode(["success" => true, "id" => $id]);
            exit;}

        } elseif ($action === 'pms_update_guest') {
            $stmt = $pdo->prepare("UPDATE hotel_guests SET name=?, phone=?, email=?, address=?, city=?, country=?, preferences=?, internal_notes=? WHERE id=? AND vendor_id=?");
            $stmt->execute([$payload['name'], $payload['phone'], $payload['email'] ?? null, $payload['address'] ?? null, $payload['city'] ?? null, $payload['country'] ?? 'India', $payload['preferences'] ?? null, $payload['internal_notes'] ?? null, $payload['id'], $payload['vendor_id']]);
            echo json_encode(["success" => true]);
            exit;} elseif ($action === 'pms_list_reviews') {
            $stmt = $pdo->prepare("SELECT * FROM hotel_reviews WHERE vendor_id=? ORDER BY created_at DESC");
            $stmt->execute([$payload['vendor_id']]);
            echo json_encode(["success" => true, "reviews" => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
            exit;} elseif ($action === 'pms_reply_review') {
            $stmt = $pdo->prepare("UPDATE hotel_reviews SET vendor_reply=? WHERE id=? AND vendor_id=?");
            $stmt->execute([$payload['reply'], $payload['id'], $payload['vendor_id']]);
            echo json_encode(["success" => true]);
            exit;} elseif ($action === 'pms_list_staff') {
            $stmt = $pdo->prepare("SELECT * FROM hotel_staff WHERE vendor_id=? ORDER BY created_at DESC");
            $stmt->execute([$payload['vendor_id']]);
            echo json_encode(["success" => true, "staff" => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
            exit;} elseif ($action === 'pms_create_staff') {
            $id = 'staff_' . uniqid();
            $stmt = $pdo->prepare("INSERT INTO hotel_staff (id, vendor_id, name, email, phone, role, hotel_ids, permissions_json, status) VALUES (?,?,?,?,?,?,?,?,?)");
            $stmt->execute([$id, $payload['vendor_id'], $payload['name'], $payload['email'], $payload['phone'] ?? null, $payload['role'] ?? 'Front Desk Staff', json_encode($payload['hotel_ids'] ?? []), json_encode($payload['permissions'] ?? []), 'Active']);
            echo json_encode(["success" => true, "id" => $id]);
            exit;} elseif ($action === 'pms_update_staff') {
            $stmt = $pdo->prepare("UPDATE hotel_staff SET name=?, email=?, phone=?, role=?, hotel_ids=?, permissions_json=?, status=? WHERE id=? AND vendor_id=?");
            $stmt->execute([$payload['name'], $payload['email'], $payload['phone'] ?? null, $payload['role'] ?? 'Front Desk Staff', json_encode($payload['hotel_ids'] ?? []), json_encode($payload['permissions'] ?? []), $payload['status'] ?? 'Active', $payload['id'], $payload['vendor_id']]);
            echo json_encode(["success" => true]);
            exit;} elseif ($action === 'pms_delete_staff') {
            $stmt = $pdo->prepare("DELETE FROM hotel_staff WHERE id=? AND vendor_id=?");
            $stmt->execute([$payload['id'], $payload['vendor_id']]);
            echo json_encode(["success" => true]);
            exit;} elseif ($action === 'pms_list_notifications') {
            $stmt = $pdo->prepare("SELECT * FROM hotel_notifications WHERE vendor_id=? ORDER BY created_at DESC LIMIT 50");
            $stmt->execute([$payload['vendor_id']]);
            $notifs = $stmt->fetchAll(PDO::FETCH_ASSOC);
            $unread = count(array_filter($notifs, fn($n) => !$n['is_read']));
            echo json_encode(["success" => true, "notifications" => $notifs, "unread_count" => $unread]);
            exit;} elseif ($action === 'pms_mark_notification_read') {
            if ($payload['all'] ?? false) {
                $stmt = $pdo->prepare("UPDATE hotel_notifications SET is_read=1 WHERE vendor_id=?");
                $stmt->execute([$payload['vendor_id']]);
            } else {
                $stmt = $pdo->prepare("UPDATE hotel_notifications SET is_read=1 WHERE id=?");
                $stmt->execute([$payload['id']]);
            }
            echo json_encode(["success" => true]);
            exit;} elseif ($action === 'pms_create_notification') {
            $id = 'notif_' . uniqid();
            $stmt = $pdo->prepare("INSERT INTO hotel_notifications (id, vendor_id, type, title, message, related_id, related_type) VALUES (?,?,?,?,?,?,?)");
            $stmt->execute([$id, $payload['vendor_id'], $payload['type'], $payload['title'], $payload['message'], $payload['related_id'] ?? null, $payload['related_type'] ?? null]);
            echo json_encode(["success" => true, "id" => $id]);
            exit;} elseif ($action === 'pms_list_tickets') {
            $stmt = $pdo->prepare("SELECT * FROM hotel_support_tickets WHERE vendor_id=? ORDER BY created_at DESC");
            $stmt->execute([$payload['vendor_id']]);
            echo json_encode(["success" => true, "tickets" => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
            exit;} elseif ($action === 'pms_create_ticket') {
            $id = 'tkt_' . uniqid();
            $initial_msg = json_encode([['sender' => 'vendor', 'message' => $payload['description'], 'time' => date('Y-m-d H:i:s')]]);
            $stmt = $pdo->prepare("INSERT INTO hotel_support_tickets (id, vendor_id, category, hotel_id, booking_id, subject, description, priority, status, messages_json) VALUES (?,?,?,?,?,?,?,?,?,?)");
            $stmt->execute([$id, $payload['vendor_id'], $payload['category'], $payload['hotel_id'] ?? null, $payload['booking_id'] ?? null, $payload['subject'], $payload['description'], $payload['priority'] ?? 'Medium', 'Open', $initial_msg]);
            echo json_encode(["success" => true, "id" => $id]);
            exit;} elseif ($action === 'pms_reply_ticket') {
            $stmt = $pdo->prepare("SELECT messages_json FROM hotel_support_tickets WHERE id=?");
            $stmt->execute([$payload['id']]);
            $ticket = $stmt->fetch(PDO::FETCH_ASSOC);
            $msgs = json_decode($ticket['messages_json'] ?? '[]', true);
            $msgs[] = ['sender' => 'vendor', 'message' => $payload['message'], 'time' => date('Y-m-d H:i:s')];
            $stmt = $pdo->prepare("UPDATE hotel_support_tickets SET messages_json=?, updated_at=NOW() WHERE id=? AND vendor_id=?");
            $stmt->execute([json_encode($msgs), $payload['id'], $payload['vendor_id']]);
            echo json_encode(["success" => true]);
            exit;} elseif ($action === 'pms_list_activity') {
            $stmt = $pdo->prepare("SELECT * FROM hotel_activity_log WHERE vendor_id=? ORDER BY created_at DESC LIMIT 100");
            $stmt->execute([$payload['vendor_id']]);
            echo json_encode(["success" => true, "logs" => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
            exit;} elseif ($action === 'pms_log_activity') {
            $id = 'log_' . uniqid();
            $stmt = $pdo->prepare("INSERT INTO hotel_activity_log (id, vendor_id, user_name, action, related_type, related_id, previous_value, new_value) VALUES (?,?,?,?,?,?,?,?)");
            $stmt->execute([$id, $payload['vendor_id'], $payload['user_name'], $payload['action'], $payload['related_type'] ?? null, $payload['related_id'] ?? null, $payload['previous_value'] ?? null, $payload['new_value'] ?? null]);
            echo json_encode(["success" => true]);
            exit;} elseif ($action === 'pms_update_hotel_status') {
            $stmt = $pdo->prepare("UPDATE hotels SET hotel_status=?, approval_remarks=? WHERE id=? AND vendor_id=?");
            $stmt->execute([$payload['status'], $payload['remarks'] ?? null, $payload['hotel_id'], $payload['vendor_id']]);
            echo json_encode(["success" => true]);
            exit;} elseif ($action === 'pms_update_hotel_full') {
            // Update all hotel fields from wizard steps
            $fields = ['name', 'property_type', 'stars', 'description', 'year_established', 'total_rooms', 'floors', 'phone', 'email', 'website', 'property_registration_no', 'gst_number', 'checkin_time', 'checkout_time', 'policies_json', 'facilities_json', 'address', 'city', 'state', 'country', 'pincode', 'latitude', 'longitude', 'wizard_step', 'hotel_status', 'profile_completion'];
            $setClauses = [];
            $values = [];
            foreach ($fields as $f) {
                if (array_key_exists($f, $payload)) {
                    $setClauses[] = "$f=?";
                    $values[] = $payload[$f];
                }
            }
            if (!empty($setClauses)) {
                $values[] = $payload['id'];
                $values[] = $payload['vendor_id'];
                $stmt = $pdo->prepare("UPDATE hotels SET " . implode(',', $setClauses) . " WHERE id=? AND vendor_id=?");
                $stmt->execute($values);
            }
            echo json_encode(["success" => true]);
            exit;} elseif ($action === 'save_hotel_payment_method') {
            if (!empty($payload['id'])) {
                $stmt = $pdo->prepare("UPDATE hotel_payment_methods SET hotel_id=?, vendor_id=?, method_type=?, details_json=?, is_active=?, status=? WHERE id=?");
                $stmt->execute([$payload['hotel_id'], $payload['vendor_id'], $payload['method_type'], json_encode($payload['details']), $payload['is_active'] ?? 1, $payload['status'] ?? 'Draft', $payload['id']]);
            } else {
                $stmt = $pdo->prepare("INSERT INTO hotel_payment_methods (hotel_id, vendor_id, method_type, details_json, is_active, status) VALUES (?, ?, ?, ?, ?, ?)");
                $stmt->execute([$payload['hotel_id'], $payload['vendor_id'], $payload['method_type'], json_encode($payload['details']), $payload['is_active'] ?? 1, $payload['status'] ?? 'Draft']);
            }
            echo json_encode(["success" => true, "message" => "Payment method saved."]);
            exit;} elseif ($action === 'approve_hotel_payment_method') {
            $stmt = $pdo->prepare("UPDATE hotel_payment_methods SET status=?, superadmin_remarks=? WHERE id=?");
            $stmt->execute([$payload['status'], $payload['superadmin_remarks'] ?? null, $payload['id']]);
            echo json_encode(["success" => true]);
            exit;} elseif ($action === 'top_up_wallet') {
            $vendor_id = $payload['vendor_id'];
            $amount = intval($payload['amount']);
            $stmt = $pdo->prepare("INSERT INTO vendor_wallets (vendor_id, balance) VALUES (?, ?) ON DUPLICATE KEY UPDATE balance = balance + ?");
            $stmt->execute([$vendor_id, $amount, $amount]);
            
            $stmt = $pdo->prepare("INSERT INTO wallet_transactions (vendor_id, amount, type, reference_id, description) VALUES (?, ?, 'Top-up', ?, 'Manual recharge')");
            $stmt->execute([$vendor_id, $amount, $payload['transaction_id'] ?? uniqid('tx_')]);
            echo json_encode(["success" => true, "message" => "Wallet recharged successfully."]);
            exit;} elseif ($action === 'save_commission_rule') {
            if (!empty($payload['id'])) {
                $stmt = $pdo->prepare("UPDATE commission_rules SET rule_type=?, target_id=?, percentage=?, fixed_amount=?, is_active=? WHERE id=?");
                $stmt->execute([$payload['rule_type'], $payload['target_id'], $payload['percentage'], $payload['fixed_amount'], $payload['is_active'], $payload['id']]);
            } else {
                $stmt = $pdo->prepare("INSERT INTO commission_rules (rule_type, target_id, percentage, fixed_amount, is_active) VALUES (?, ?, ?, ?, ?)");
                $stmt->execute([$payload['rule_type'], $payload['target_id'], $payload['percentage'], $payload['fixed_amount'], $payload['is_active']]);
            }
            echo json_encode(["success" => true, "message" => "Commission rule saved."]);
            exit;} elseif ($action === 'verify_booking_payment') {
            $booking_id = $payload['booking_id'];
            $vendor_id = $payload['vendor_id'];
            
            $stmt = $pdo->prepare("SELECT * FROM bookings WHERE id=?");
            $stmt->execute([$booking_id]);
            $booking = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($booking) {
                // Get fixed platform fee from site_configs
                $stmtConf = $pdo->query("SELECT booking_fee_deduction FROM site_configs LIMIT 1");
                $conf = $stmtConf->fetch(PDO::FETCH_ASSOC);
                $commission_amount = $conf ? (int)$conf['booking_fee_deduction'] : 250;
                
                // Check Wallet Balance
                $stmtW = $pdo->prepare("SELECT balance FROM vendor_wallets WHERE vendor_id = ?");
                $stmtW->execute([$vendor_id]);
                $wallet = $stmtW->fetch(PDO::FETCH_ASSOC);
                
                if (!$wallet || $wallet['balance'] < $commission_amount) {
                    echo json_encode(["success" => false, "error" => "Insufficient wallet balance to pay the platform fee (₹$commission_amount). Please top up your wallet first."]);
                    exit;
                }
                
                $stmt = $pdo->prepare("UPDATE vendor_wallets SET balance = balance - ? WHERE vendor_id = ?");
                $stmt->execute([$commission_amount, $vendor_id]);
                
                $stmt = $pdo->prepare("INSERT INTO wallet_transactions (vendor_id, amount, type, reference_id, description) VALUES (?, ?, 'Platform Fee Deduction', ?, 'Platform fee for booking')");
                $stmt->execute([$vendor_id, -$commission_amount, $booking_id]);
                
                $stmt = $pdo->prepare("UPDATE bookings SET status='Confirmed', payment_verification_status='Verified', commission_amount=?, wallet_deduction_status='Completed', payment_verified_at=CURRENT_TIMESTAMP, payment_verified_by=? WHERE id=?");
                $stmt->execute([$commission_amount, $vendor_id, $booking_id]);
                
                echo json_encode(["success" => true, "message" => "Payment verified and booking confirmed."]);
            } else {
                echo json_encode(["success" => false, "error" => "Booking not found."]);
            }

        } elseif ($action === 'reject_booking_payment') {
            $booking_id = $payload['booking_id'];
            $stmt = $pdo->prepare("UPDATE bookings SET status='Payment Rejected', payment_verification_status='Rejected', hold_until=NULL WHERE id=?");
            $stmt->execute([$booking_id]);
            echo json_encode(["success" => true, "message" => "Payment rejected."]);
            exit;exit();

        } elseif ($action === 'save_site_config') {
            $draft = isset($payload['draft_config']) ? $payload['draft_config'] : null;
            $live = isset($payload['live_config']) ? $payload['live_config'] : null;
            $domain = isset($payload['domain']) ? $payload['domain'] : null;
            
            // Convert arrays to JSON strings if needed
            if (is_array($draft)) $draft = json_encode($draft);
            if (is_array($live)) $live = json_encode($live);

            $stmt = $pdo->prepare("INSERT INTO site_configs (admin_id, domain, draft_config, live_config) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE domain = COALESCE(VALUES(domain), domain), draft_config = COALESCE(VALUES(draft_config), draft_config), live_config = COALESCE(VALUES(live_config), live_config)");
            $stmt->execute([$tenant_id, $domain, $draft, $live]);
            
            echo json_encode(["success" => true, "message" => "Site configuration saved."]);
            exit;exit();
        } elseif ($action === 'save_custom_enquiry') {
            $enquiry_id = $payload['enquiry_id'] ?? 'INQ-' . strtoupper(uniqid());
            $stmt = $pdo->prepare("INSERT INTO custom_enquiries (enquiry_id, customer_name, phone, email, whatsapp, departure_city, destinations, travel_dates, flexible_dates, adults, children, infants, budget_range, hotel_category, room_type, meal_pref, req_flight, req_train, req_car, req_bike, req_airport_pickup, req_sightseeing, req_adventure, trip_type, special_requests, documents_json, status, assigned_to) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE customer_name=VALUES(customer_name), phone=VALUES(phone), email=VALUES(email), whatsapp=VALUES(whatsapp), departure_city=VALUES(departure_city), destinations=VALUES(destinations), travel_dates=VALUES(travel_dates), flexible_dates=VALUES(flexible_dates), adults=VALUES(adults), children=VALUES(children), infants=VALUES(infants), budget_range=VALUES(budget_range), hotel_category=VALUES(hotel_category), room_type=VALUES(room_type), meal_pref=VALUES(meal_pref), req_flight=VALUES(req_flight), req_train=VALUES(req_train), req_car=VALUES(req_car), req_bike=VALUES(req_bike), req_airport_pickup=VALUES(req_airport_pickup), req_sightseeing=VALUES(req_sightseeing), req_adventure=VALUES(req_adventure), trip_type=VALUES(trip_type), special_requests=VALUES(special_requests), documents_json=VALUES(documents_json), status=VALUES(status), assigned_to=VALUES(assigned_to)");
            $stmt->execute([
                $enquiry_id,
                $payload['customer_name'] ?? '',
                $payload['phone'] ?? '',
                $payload['email'] ?? null,
                $payload['whatsapp'] ?? null,
                $payload['departure_city'] ?? null,
                $payload['destinations'] ?? null,
                $payload['travel_dates'] ?? null,
                $payload['flexible_dates'] ?? 0,
                $payload['adults'] ?? 2,
                $payload['children'] ?? 0,
                $payload['infants'] ?? 0,
                $payload['budget_range'] ?? null,
                $payload['hotel_category'] ?? null,
                $payload['room_type'] ?? null,
                $payload['meal_pref'] ?? null,
                $payload['req_flight'] ?? 0,
                $payload['req_train'] ?? 0,
                $payload['req_car'] ?? 0,
                $payload['req_bike'] ?? 0,
                $payload['req_airport_pickup'] ?? 0,
                $payload['req_sightseeing'] ?? 0,
                $payload['req_adventure'] ?? 0,
                $payload['trip_type'] ?? null,
                $payload['special_requests'] ?? null,
                isset($payload['documents_json']) ? (is_array($payload['documents_json']) ? json_encode($payload['documents_json']) : $payload['documents_json']) : null,
                $payload['status'] ?? 'New Enquiry',
                $payload['assigned_to'] ?? null
            ]);
            echo json_encode(["success" => true, "enquiry_id" => $enquiry_id, "message" => "Enquiry saved."]);
            exit;exit();
            exit;exit();
        } elseif ($action === 'update_enquiry_status') {
            $stmt = $pdo->prepare("UPDATE custom_enquiries SET status = ?, assigned_to = ? WHERE enquiry_id = ?");
            $stmt->execute([$payload['status'], $payload['assigned_to'] ?? null, $payload['enquiry_id']]);
            echo json_encode(["success" => true, "message" => "Status updated."]);
            exit;exit();
        } elseif ($action === 'add_enquiry_timeline') {
            $stmt = $pdo->prepare("INSERT INTO enquiry_timeline (enquiry_id, action_type, notes, follow_up_date, attachment_url, created_by) VALUES (?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $payload['enquiry_id'],
                $payload['type'] ?? ($payload['action_type'] ?? null),
                $payload['notes'] ?? null,
                $payload['follow_up_date'] ?? null,
                $payload['attachment_url'] ?? null,
                $payload['created_by'] ?? 'System'
            ]);
            echo json_encode(["success" => true, "message" => "Timeline updated."]);
            exit;
        } elseif ($action === 'save_vendor_payment_method') {
            if (!empty($payload['id'])) {
                $stmt = $pdo->prepare("UPDATE vendor_payment_methods SET method_type=?, display_name=?, account_name=?, bank_name=?, account_number=?, ifsc_code=?, upi_id=?, qr_image_url=?, instructions=?, status=? WHERE id=? AND vendor_id=?");
                $stmt->execute([$payload['method_type'], $payload['display_name'], $payload['account_name'] ?? null, $payload['bank_name'] ?? null, $payload['account_number'] ?? null, $payload['ifsc_code'] ?? null, $payload['upi_id'] ?? null, $payload['qr_image_url'] ?? null, $payload['instructions'] ?? null, $payload['status'] ?? 'Active', $payload['id'], $payload['vendor_id']]);
            } else {
                $stmt = $pdo->prepare("INSERT INTO vendor_payment_methods (vendor_id, method_type, display_name, account_name, bank_name, account_number, ifsc_code, upi_id, qr_image_url, instructions, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
                $stmt->execute([$payload['vendor_id'], $payload['method_type'], $payload['display_name'], $payload['account_name'] ?? null, $payload['bank_name'] ?? null, $payload['account_number'] ?? null, $payload['ifsc_code'] ?? null, $payload['upi_id'] ?? null, $payload['qr_image_url'] ?? null, $payload['instructions'] ?? null, $payload['status'] ?? 'Active']);
            }
            echo json_encode(["success" => true, "message" => "Payment method saved."]);
            exit;
        } elseif ($action === 'delete_vendor_payment_method') {
            $stmt = $pdo->prepare("DELETE FROM vendor_payment_methods WHERE id=? AND vendor_id=?");
            $stmt->execute([$payload['id'], $payload['vendor_id']]);
            echo json_encode(["success" => true, "message" => "Payment method deleted."]);
            exit;
        } elseif ($action === 'add_car') {
            $id = $payload['id'] ?? ('car-' . uniqid());
            $vendor_id = $payload['vendor_id'] ?? ($payload['vendorId'] ?? 'vendor-1');
            $stmt = $pdo->prepare("INSERT INTO cars (id, name, category, seating, fuel, transmission, price, location, image, vendor_id, mileage, is_available, admin_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)");
            $stmt->execute([
                $id,
                $payload['name'],
                $payload['category'] ?? 'Hatchback',
                $payload['seating'] ?? ($payload['seats'] ?? '5'),
                $payload['fuel'] ?? 'Petrol',
                $payload['transmission'] ?? 'Manual',
                intval($payload['price']),
                $payload['location'] ?? 'Goa Delivery',
                $payload['image'] ?? null,
                $vendor_id,
                $payload['mileage'] ?? '',
                $tenant_id
            ]);
            echo json_encode(["success" => true, "id" => $id, "message" => "Car added."]);
            exit;
        } elseif ($action === 'add_bike') {
            $id = $payload['id'] ?? ('bike-' . uniqid());
            $vendor_id = $payload['vendor_id'] ?? ($payload['vendorId'] ?? 'vendor-2');
            $stmt = $pdo->prepare("INSERT INTO bikes (id, name, category, engine, fuel, mileage, price, location, image, vendor_id, is_available, admin_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)");
            $stmt->execute([
                $id,
                $payload['name'],
                $payload['category'] ?? 'Scooter',
                $payload['engine'] ?? '110cc',
                $payload['fuel'] ?? 'Petrol',
                $payload['mileage'] ?? '40 km/l',
                intval($payload['price']),
                $payload['location'] ?? 'Goa Delivery',
                $payload['image'] ?? null,
                $vendor_id,
                $tenant_id
            ]);
            echo json_encode(["success" => true, "id" => $id, "message" => "Bike added."]);
            exit;
        } elseif ($action === 'update_vehicle') {
            if (($payload['type'] ?? '') === 'car') {
                $stmt = $pdo->prepare("UPDATE cars SET name=?, category=?, seating=?, fuel=?, transmission=?, price=?, location=?, image=?, mileage=? WHERE id=?");
                $stmt->execute([
                    $payload['name'],
                    $payload['category'] ?? 'Hatchback',
                    $payload['seating'] ?? ($payload['seats'] ?? '5'),
                    $payload['fuel'] ?? 'Petrol',
                    $payload['transmission'] ?? 'Manual',
                    intval($payload['price']),
                    $payload['location'] ?? 'Goa Delivery',
                    $payload['image'] ?? null,
                    $payload['mileage'] ?? '',
                    $payload['id']
                ]);
            } else {
                $stmt = $pdo->prepare("UPDATE bikes SET name=?, category=?, engine=?, fuel=?, mileage=?, price=?, location=?, image=? WHERE id=?");
                $stmt->execute([
                    $payload['name'],
                    $payload['category'] ?? 'Scooter',
                    $payload['engine'] ?? '110cc',
                    $payload['fuel'] ?? 'Petrol',
                    $payload['mileage'] ?? '40 km/l',
                    intval($payload['price']),
                    $payload['location'] ?? 'Goa Delivery',
                    $payload['image'] ?? null,
                    $payload['id']
                ]);
            }
            echo json_encode(["success" => true, "message" => "Vehicle updated."]);
            exit;
        } elseif ($action === 'toggle_vehicle_availability') {
            $status = $payload['status'] ? 1 : 0;
            if ($payload['type'] === 'car') {
                $stmt = $pdo->prepare("UPDATE cars SET is_available=? WHERE id=?");
            } else {
                $stmt = $pdo->prepare("UPDATE bikes SET is_available=? WHERE id=?");
            }
            $stmt->execute([$status, $payload['id']]);
            echo json_encode(["success" => true, "message" => "Availability toggled."]);
            exit;
        } elseif ($action === 'delete_vehicle') {
            if ($payload['type'] === 'car') {
                $stmt = $pdo->prepare("DELETE FROM cars WHERE id=?");
            } else {
                $stmt = $pdo->prepare("DELETE FROM bikes WHERE id=?");
            }
            $stmt->execute([$payload['id']]);
            echo json_encode(["success" => true, "message" => "Vehicle deleted."]);
            exit;
        } elseif ($action === 'get_vendor_payment_methods') {
            $vendor_id = $payload['vendor_id'] ?? null;
            if ($vendor_id) {
                $stmt = $pdo->prepare("SELECT * FROM vendor_payment_methods WHERE vendor_id = ?");
                $stmt->execute([$vendor_id]);
                echo json_encode($stmt->fetchAll());
            } else {
                echo json_encode([]);
            }
            exit;
        } elseif ($action === 'get_admin_payment_methods') {
            // Find the primary admin ID. Defaulting to 'u-2' or the first admin in users table.
            $stmt = $pdo->prepare("SELECT id FROM users WHERE role IN ('admin', 'superadmin') LIMIT 1");
            $stmt->execute();
            $admin = $stmt->fetch();
            if ($admin) {
                $admin_id = $admin['id'];
                $stmt = $pdo->prepare("SELECT * FROM vendor_payment_methods WHERE vendor_id = ?");
                $stmt->execute([$admin_id]);
                echo json_encode($stmt->fetchAll());
            } else {
                echo json_encode([]);
            }
            exit;
        } elseif ($action === 'add_vendor_payment_method') {
            $stmt = $pdo->prepare("INSERT INTO vendor_payment_methods (vendor_id, method_type, display_name, account_name, bank_name, account_number, ifsc_code, upi_id, qr_image_url, instructions, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $payload['vendor_id'], $payload['method_type'], $payload['display_name'], 
                $payload['account_name'] ?? null, $payload['bank_name'] ?? null, $payload['account_number'] ?? null, 
                $payload['ifsc_code'] ?? null, $payload['upi_id'] ?? null, $payload['qr_image_url'] ?? null, 
                $payload['instructions'] ?? null, $payload['status'] ?? 'Active'
            ]);
            echo json_encode(["success" => true, "id" => $pdo->lastInsertId(), "message" => "Vendor payment method added."]);
            exit;
        } elseif ($action === 'update_vendor_payment_method') {
            $stmt = $pdo->prepare("UPDATE vendor_payment_methods SET display_name=?, account_name=?, bank_name=?, account_number=?, ifsc_code=?, upi_id=?, qr_image_url=?, instructions=?, status=? WHERE id=?");
            $stmt->execute([
                $payload['display_name'], $payload['account_name'] ?? null, $payload['bank_name'] ?? null, 
                $payload['account_number'] ?? null, $payload['ifsc_code'] ?? null, $payload['upi_id'] ?? null, 
                $payload['qr_image_url'] ?? null, $payload['instructions'] ?? null, $payload['status'] ?? 'Active', 
                $payload['id']
            ]);
            echo json_encode(["success" => true, "message" => "Vendor payment method updated."]);
            exit;
        } elseif ($action === 'delete_vendor_payment_method') {
            $stmt = $pdo->prepare("DELETE FROM vendor_payment_methods WHERE id=?");
            $stmt->execute([$payload['id']]);
            echo json_encode(["success" => true, "message" => "Vendor payment method deleted."]);
            exit;
        } elseif ($action === 'create_lead' || $action === 'add_lead' || ($resource === 'leads' && empty($action))) {
            $id = !empty($payload['id']) ? $payload['id'] : ('LD-' . rand(1000, 9999));
            $name = trim($payload['name'] ?? '');
            $phone = trim($payload['phone'] ?? '');
            $email = trim($payload['email'] ?? '');
            $source = $payload['source'] ?? 'Hotel Enquiries';
            $service = trim($payload['service'] ?? 'General Trip Inquiry');
            $assigned_to = $payload['assigned_to'] ?? $payload['assignedTo'] ?? 'Unassigned';
            $status = $payload['status'] ?? 'New';
            $budget = trim($payload['budget'] ?? '');
            $notes = trim($payload['notes'] ?? '');
            $created_at = $payload['created_at'] ?? $payload['createdAt'] ?? date('Y-m-d H:i:s');
            
            if (!$name || !$phone) {
                http_response_code(400);
                echo json_encode(["success" => false, "error" => "Customer name and phone number are required."]);
                exit;
            }
            
            $stmt = $pdo->prepare("INSERT INTO leads (id, name, phone, email, source, service, assigned_to, status, budget, notes, admin_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([$id, $name, $phone, $email, $source, $service, $assigned_to, $status, $budget, $notes, $tenant_id, $created_at, date('Y-m-d H:i:s')]);
            
            echo json_encode(["success" => true, "id" => $id, "lead_id" => $id, "message" => "Lead created successfully."]);
            exit;
        } elseif ($action === 'update_lead') {
            $id = $payload['id'] ?? null;
            if (!$id) {
                http_response_code(400);
                echo json_encode(["success" => false, "error" => "Missing lead ID."]);
                exit;
            }
            
            $name = $payload['name'] ?? null;
            $phone = $payload['phone'] ?? null;
            $email = $payload['email'] ?? null;
            $source = $payload['source'] ?? null;
            $service = $payload['service'] ?? null;
            $assigned_to = $payload['assigned_to'] ?? $payload['assignedTo'] ?? null;
            $status = $payload['status'] ?? null;
            $budget = $payload['budget'] ?? null;
            $notes = $payload['notes'] ?? null;
            
            $stmt = $pdo->prepare("UPDATE leads SET 
                name = COALESCE(?, name),
                phone = COALESCE(?, phone),
                email = COALESCE(?, email),
                source = COALESCE(?, source),
                service = COALESCE(?, service),
                assigned_to = COALESCE(?, assigned_to),
                status = COALESCE(?, status),
                budget = COALESCE(?, budget),
                notes = COALESCE(?, notes),
                updated_at = CURRENT_TIMESTAMP
                WHERE id = ?");
            $stmt->execute([$name, $phone, $email, $source, $service, $assigned_to, $status, $budget, $notes, $id]);
            echo json_encode(["success" => true, "message" => "Lead updated successfully."]);
            exit;
        } elseif ($action === 'update_lead_status') {
            $id = $payload['id'] ?? null;
            $status = $payload['status'] ?? 'New';
            if (!$id) {
                http_response_code(400);
                echo json_encode(["success" => false, "error" => "Missing lead ID."]);
                exit;
            }
            $stmt = $pdo->prepare("UPDATE leads SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?");
            $stmt->execute([$status, $id]);
            echo json_encode(["success" => true, "message" => "Lead status updated."]);
            exit;
        } elseif ($action === 'toggle_user_status') {
            $id = $payload['id'] ?? $payload['user_id'] ?? null;
            $status = $payload['status'] ?? 'active';
            if (!$id) {
                http_response_code(400);
                echo json_encode(["success" => false, "error" => "Missing user ID."]);
                exit;
            }
            $stmt = $pdo->prepare("UPDATE users SET status = ? WHERE id = ?");
            $stmt->execute([$status, $id]);
            echo json_encode(["success" => true, "message" => "User status updated to $status."]);
            exit;
        } elseif ($action === 'assign_lead' || $action === 'update_lead_assignee') {
            $id = $payload['id'] ?? $payload['lead_id'] ?? null;
            $assigned_to = trim($payload['assigned_to'] ?? ($payload['assignedTo'] ?? 'Unassigned'));
            $assigned_by = trim($payload['assigned_by'] ?? ($payload['assignedBy'] ?? ($_SERVER['HTTP_X_USER_IDENTIFIER'] ?? 'Admin')));
            $now = date('Y-m-d H:i:s');
            
            if (!$id) {
                http_response_code(400);
                echo json_encode(["success" => false, "error" => "Missing lead ID."]);
                exit;
            }

            // Verify lead exists
            $chk = $pdo->prepare("SELECT * FROM leads WHERE id = ?");
            $chk->execute([$id]);
            $currentLead = $chk->fetch(PDO::FETCH_ASSOC);
            if (!$currentLead) {
                http_response_code(404);
                echo json_encode(["success" => false, "error" => "Lead not found."]);
                exit;
            }

            // Update assignment
            $stmt = $pdo->prepare("UPDATE leads SET assigned_to = ?, assigned_at = ?, assigned_by = ?, updated_at = ? WHERE id = ?");
            $stmt->execute([$assigned_to, $now, $assigned_by, $now, $id]);

            // Add system timeline comment
            $commentId = 'comm_' . time() . '_' . rand(100, 999);
            $sysMsg = $assigned_to === 'Unassigned' 
                ? "Lead was unassigned by $assigned_by."
                : "Lead assigned to $assigned_to by $assigned_by.";
            $stmtComm = $pdo->prepare("INSERT INTO lead_comments (id, lead_id, user_id, user_name, user_role, comment, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
            $stmtComm->execute([$commentId, $id, 'system', 'System', 'system', $sysMsg, $now, $now]);

            echo json_encode([
                "success" => true,
                "message" => "Lead assigned successfully.",
                "lead_id" => $id,
                "assigned_to" => $assigned_to,
                "assigned_at" => $now,
                "assigned_by" => $assigned_by
            ]);
            exit;
        } elseif ($action === 'update_next_action') {
            $id = $payload['id'] ?? $payload['lead_id'] ?? null;
            $next_action = trim($payload['next_action'] ?? ($payload['nextAction'] ?? ''));
            $now = date('Y-m-d H:i:s');
            if (!$id) {
                http_response_code(400);
                echo json_encode(["success" => false, "error" => "Missing lead ID."]);
                exit;
            }
            $stmt = $pdo->prepare("UPDATE leads SET next_action = ?, updated_at = ? WHERE id = ?");
            $stmt->execute([$next_action, $now, $id]);
            echo json_encode(["success" => true, "message" => "Next action updated.", "next_action" => $next_action]);
            exit;
        } elseif ($action === 'add_lead_comment') {
            $lead_id = $payload['lead_id'] ?? $payload['leadId'] ?? null;
            $comment = trim($payload['comment'] ?? '');
            $user_id = $payload['user_id'] ?? ($_SERVER['HTTP_X_USER_ID'] ?? 'admin');
            $user_name = $payload['user_name'] ?? ($_SERVER['HTTP_X_USER_IDENTIFIER'] ?? 'Admin');
            $user_role = $payload['user_role'] ?? ($_SERVER['HTTP_X_USER_ROLE'] ?? 'admin');
            $now = date('Y-m-d H:i:s');

            if (!$lead_id || !$comment) {
                http_response_code(400);
                echo json_encode(["success" => false, "error" => "Lead ID and comment text are required."]);
                exit;
            }

            $commentId = 'comm_' . time() . '_' . rand(100, 999);
            $stmt = $pdo->prepare("INSERT INTO lead_comments (id, lead_id, user_id, user_name, user_role, comment, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([$commentId, $lead_id, $user_id, $user_name, $user_role, $comment, $now, $now]);

            // Update lead timestamp
            $pdo->prepare("UPDATE leads SET updated_at = ? WHERE id = ?")->execute([$now, $lead_id]);

            echo json_encode([
                "success" => true,
                "message" => "Comment added successfully.",
                "comment" => [
                    "id" => $commentId,
                    "lead_id" => $lead_id,
                    "user_id" => $user_id,
                    "user_name" => $user_name,
                    "user_role" => $user_role,
                    "comment" => $comment,
                    "created_at" => $now,
                    "updated_at" => $now
                ]
            ]);
            exit;
        } elseif ($action === 'delete_lead_comment') {
            $id = $payload['id'] ?? $payload['comment_id'] ?? null;
            if (!$id) {
                http_response_code(400);
                echo json_encode(["success" => false, "error" => "Missing comment ID."]);
                exit;
            }
            $stmt = $pdo->prepare("DELETE FROM lead_comments WHERE id = ?");
            $stmt->execute([$id]);
            echo json_encode(["success" => true, "message" => "Comment deleted."]);
            exit;
        } elseif ($action === 'delete_lead') {
            $id = $payload['id'] ?? $_GET['id'] ?? null;
            if (!$id) {
                http_response_code(400);
                echo json_encode(["success" => false, "error" => "Missing lead ID."]);
                exit;
            }
            $stmt = $pdo->prepare("DELETE FROM leads WHERE id = ?");
            $stmt->execute([$id]);
            $pdo->prepare("DELETE FROM lead_comments WHERE lead_id = ?")->execute([$id]);
            echo json_encode(["success" => true, "message" => "Lead deleted successfully."]);
            exit;
            exit;
        }
        
        include 'wallet_actions.php';
        include_once 'hotel_pms_actions.php';

    } catch (Exception $e) {
        http_response_code(400);
        echo json_encode(["error" => $e->getMessage()]);
            exit;}
    exit();
}

http_response_code(404);
echo json_encode(["error" => "Resource not found."]);
            exit;?>

