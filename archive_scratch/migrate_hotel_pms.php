<?php
$pdo = new PDO('sqlite:' . __DIR__ . '/../backend/database.sqlite');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

echo "=== INITIALIZING & MIGRATING HOTEL PMS DATABASE SCHEMAS ===\n\n";

// Helper to safely add column if not exists
function addColumnIfNotExists($pdo, $table, $column, $definition) {
    $cols = $pdo->query("PRAGMA table_info($table)")->fetchAll(PDO::FETCH_ASSOC);
    $existing = array_column($cols, 'name');
    if (!in_array($column, $existing)) {
        $pdo->exec("ALTER TABLE $table ADD COLUMN $column $definition");
        echo " [+] Added column '$column' to table '$table'\n";
    }
}

// 1. Extend hotels table
$pdo->exec("CREATE TABLE IF NOT EXISTS hotels (
    id VARCHAR(50) PRIMARY KEY,
    vendor_id VARCHAR(50),
    name VARCHAR(255),
    area VARCHAR(255),
    location VARCHAR(255),
    price INT DEFAULT 0,
    stars INT DEFAULT 3,
    amenities TEXT,
    rating DECIMAL(3,2) DEFAULT 4.0,
    badge VARCHAR(50) DEFAULT 'Standard',
    image TEXT,
    images_json TEXT,
    description TEXT,
    is_available INT DEFAULT 1,
    blocked_dates TEXT,
    admin_id VARCHAR(50)
)");

$hotelCols = [
    'hotel_status' => "VARCHAR(50) DEFAULT 'Live'",
    'property_type' => "VARCHAR(50) DEFAULT 'Hotel'",
    'phone' => "VARCHAR(50) DEFAULT ''",
    'email' => "VARCHAR(100) DEFAULT ''",
    'website' => "VARCHAR(255) DEFAULT ''",
    'checkin_time' => "VARCHAR(20) DEFAULT '14:00'",
    'checkout_time' => "VARCHAR(20) DEFAULT '11:00'",
    'address' => "TEXT DEFAULT ''",
    'city' => "VARCHAR(100) DEFAULT 'Goa'",
    'state' => "VARCHAR(100) DEFAULT 'Goa'",
    'country' => "VARCHAR(100) DEFAULT 'India'",
    'pincode' => "VARCHAR(20) DEFAULT '403001'",
    'gst_number' => "VARCHAR(50) DEFAULT ''",
    'property_registration_no' => "VARCHAR(100) DEFAULT ''",
    'facilities_json' => "TEXT DEFAULT '[]'",
    'wizard_step' => "INT DEFAULT 10",
    'profile_completion' => "INT DEFAULT 100",
    'approval_remarks' => "TEXT DEFAULT ''"
];

foreach ($hotelCols as $col => $def) {
    addColumnIfNotExists($pdo, 'hotels', $col, $def);
}

// Ensure default hotels have valid vendor_id and hotel_status
$pdo->exec("UPDATE hotels SET hotel_status = 'Live' WHERE hotel_status IS NULL OR hotel_status = ''");
$pdo->exec("UPDATE hotels SET vendor_id = 'u-5' WHERE vendor_id IS NULL OR vendor_id = '' OR vendor_id = 'hotel_vendor'");

// 2. Extend hotel_room_types table
$pdo->exec("CREATE TABLE IF NOT EXISTS hotel_room_types (
    id VARCHAR(50) PRIMARY KEY,
    hotel_id VARCHAR(50),
    vendor_id VARCHAR(100),
    name VARCHAR(255),
    internal_code VARCHAR(50),
    description TEXT,
    total_rooms INT DEFAULT 5,
    max_adults INT DEFAULT 2,
    max_children INT DEFAULT 1,
    max_occupancy INT DEFAULT 3,
    base_occupancy INT DEFAULT 2,
    bed_type VARCHAR(100) DEFAULT 'King',
    price INT DEFAULT 5000,
    created_at DATETIME,
    base_price INT DEFAULT 5000,
    selling_price INT DEFAULT 5500,
    weekend_price INT DEFAULT 6500,
    extra_adult_charge INT DEFAULT 1000,
    extra_child_charge INT DEFAULT 500,
    extra_bed_charge INT DEFAULT 800,
    amenities_json TEXT,
    images_json TEXT,
    status VARCHAR(50) DEFAULT 'Active'
)");

$roomTypeCols = [
    'num_beds' => "INT DEFAULT 1",
    'room_size' => "VARCHAR(50) DEFAULT '350'",
    'room_size_unit' => "VARCHAR(20) DEFAULT 'sqft'",
    'view_type' => "VARCHAR(50) DEFAULT 'Garden View'",
    'smoking' => "INT DEFAULT 0",
    'air_conditioned' => "INT DEFAULT 1",
    'private_bathroom' => "INT DEFAULT 1",
    'extra_bed_available' => "INT DEFAULT 1",
    'min_stay' => "INT DEFAULT 1",
    'max_stay' => "INT DEFAULT 30",
    'closed_to_arrival' => "INT DEFAULT 0",
    'closed_to_departure' => "INT DEFAULT 0",
    'stop_sell' => "INT DEFAULT 0"
];

foreach ($roomTypeCols as $col => $def) {
    addColumnIfNotExists($pdo, 'hotel_room_types', $col, $def);
}

// 3. Extend hotel_rooms table
$pdo->exec("CREATE TABLE IF NOT EXISTS hotel_rooms (
    id VARCHAR(50) PRIMARY KEY,
    hotel_id VARCHAR(50),
    room_type_id VARCHAR(50),
    vendor_id VARCHAR(100),
    room_number VARCHAR(50),
    floor VARCHAR(20) DEFAULT '1',
    status VARCHAR(50) DEFAULT 'Available',
    internal_note TEXT
)");

// 4. Extend hotel_availability_calendar table
$pdo->exec("CREATE TABLE IF NOT EXISTS hotel_availability_calendar (
    id VARCHAR(100) PRIMARY KEY,
    hotel_id VARCHAR(50),
    room_type_id VARCHAR(50),
    vendor_id VARCHAR(100),
    date VARCHAR(20),
    available_rooms INT DEFAULT 5,
    price_override INT DEFAULT NULL,
    status VARCHAR(50) DEFAULT 'Available',
    min_stay INT DEFAULT 1,
    stop_sale INT DEFAULT 0,
    block_reason VARCHAR(255) DEFAULT ''
)");

// 5. Create hotel_rate_plans table
$pdo->exec("CREATE TABLE IF NOT EXISTS hotel_rate_plans (
    id VARCHAR(50) PRIMARY KEY,
    hotel_id VARCHAR(50),
    vendor_id VARCHAR(100),
    room_type_id VARCHAR(50),
    name VARCHAR(255),
    meal_plan VARCHAR(50) DEFAULT 'EP - Room Only',
    price_type VARCHAR(50) DEFAULT 'Fixed',
    base_price INT DEFAULT 5000,
    weekend_price INT DEFAULT 6000,
    extra_adult_rate INT DEFAULT 1000,
    extra_child_rate INT DEFAULT 500,
    cancellation_policy TEXT,
    is_active INT DEFAULT 1,
    created_at DATETIME
)");

// 6. Create hotel_guests table
$pdo->exec("CREATE TABLE IF NOT EXISTS hotel_guests (
    id VARCHAR(50) PRIMARY KEY,
    vendor_id VARCHAR(100),
    name VARCHAR(255),
    phone VARCHAR(50),
    email VARCHAR(255),
    id_type VARCHAR(50) DEFAULT 'Aadhaar',
    id_number VARCHAR(100) DEFAULT '',
    address TEXT DEFAULT '',
    city VARCHAR(100) DEFAULT '',
    vip INT DEFAULT 0,
    notes TEXT DEFAULT '',
    total_stays INT DEFAULT 1,
    total_spend INT DEFAULT 0,
    last_visit VARCHAR(50) DEFAULT '',
    created_at DATETIME
)");

// 7. Create hotel_reviews table
$pdo->exec("CREATE TABLE IF NOT EXISTS hotel_reviews (
    id VARCHAR(50) PRIMARY KEY,
    hotel_id VARCHAR(50),
    vendor_id VARCHAR(100),
    booking_id VARCHAR(50),
    guest_name VARCHAR(255),
    rating DECIMAL(2,1) DEFAULT 5.0,
    cleanliness DECIMAL(2,1) DEFAULT 5.0,
    service DECIMAL(2,1) DEFAULT 5.0,
    location_rating DECIMAL(2,1) DEFAULT 5.0,
    comment TEXT,
    reply TEXT,
    replied_at DATETIME,
    status VARCHAR(50) DEFAULT 'Approved',
    created_at DATETIME
)");

// 8. Create hotel_staff table
$pdo->exec("CREATE TABLE IF NOT EXISTS hotel_staff (
    id VARCHAR(50) PRIMARY KEY,
    hotel_id VARCHAR(50),
    vendor_id VARCHAR(100),
    name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    role VARCHAR(50) DEFAULT 'Front Desk',
    status VARCHAR(50) DEFAULT 'Active',
    permissions_json TEXT,
    created_at DATETIME
)");

// 9. Create hotel_notifications table
$pdo->exec("CREATE TABLE IF NOT EXISTS hotel_notifications (
    id VARCHAR(50) PRIMARY KEY,
    vendor_id VARCHAR(100),
    title VARCHAR(255),
    message TEXT,
    type VARCHAR(50) DEFAULT 'booking',
    link VARCHAR(255) DEFAULT '',
    is_read INT DEFAULT 0,
    created_at DATETIME
)");

// 10. Create hotel_support_tickets table
$pdo->exec("CREATE TABLE IF NOT EXISTS hotel_support_tickets (
    id VARCHAR(50) PRIMARY KEY,
    vendor_id VARCHAR(100),
    subject VARCHAR(255),
    category VARCHAR(50) DEFAULT 'General',
    priority VARCHAR(50) DEFAULT 'Medium',
    message TEXT,
    status VARCHAR(50) DEFAULT 'Open',
    replies_json TEXT,
    created_at DATETIME
)");

// 11. Create hotel_activity_logs table
$pdo->exec("CREATE TABLE IF NOT EXISTS hotel_activity_logs (
    id VARCHAR(50) PRIMARY KEY,
    vendor_id VARCHAR(100),
    action VARCHAR(255),
    module VARCHAR(50),
    details TEXT,
    ip_address VARCHAR(50) DEFAULT '127.0.0.1',
    created_at DATETIME
)");

// 12. Create / ensure vendor_wallets and wallet_transactions tables exist
$pdo->exec("CREATE TABLE IF NOT EXISTS vendor_wallets (
    id VARCHAR(100) PRIMARY KEY,
    vendor_id VARCHAR(100),
    balance INT DEFAULT 0,
    reserved_commission INT DEFAULT 0,
    minimum_balance INT DEFAULT 5000,
    negative_limit INT DEFAULT 0,
    created_at DATETIME,
    updated_at DATETIME
)");

$pdo->exec("CREATE TABLE IF NOT EXISTS wallet_transactions (
    id VARCHAR(100) PRIMARY KEY,
    vendor_id VARCHAR(100),
    amount INT DEFAULT 0,
    type VARCHAR(50) DEFAULT 'payout',
    reference_id VARCHAR(255) DEFAULT '',
    status VARCHAR(50) DEFAULT 'Completed',
    description TEXT,
    created_at DATETIME
)");

// Ensure hotel vendor wallet exists
$wStmt = $pdo->prepare("SELECT id FROM vendor_wallets WHERE vendor_id = 'u-5' OR vendor_id = 'hotel_vendor'");
$wStmt->execute();
if (!$wStmt->fetch()) {
    $pdo->exec("INSERT INTO vendor_wallets (id, vendor_id, balance, reserved_commission, minimum_balance, created_at, updated_at) 
                VALUES ('w-hotel-vendor', 'u-5', 25000, 2000, 5000, datetime('now'), datetime('now'))");
    echo " [+] Created initial wallet for hotel vendor\n";
}

echo "\n=== ALL DATABASE MIGRATIONS COMPLETED SUCCESSFULLY ===\n";
