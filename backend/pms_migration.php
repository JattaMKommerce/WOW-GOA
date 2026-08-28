<?php
/**
 * Hotel PMS Database Migration
 * Run once to add all new tables and columns needed for the full PMS
 */

define('DB_HOST', 'localhost');
define('DB_PORT', '3306');
define('DB_NAME', 'tripgalileo');
define('DB_USER', 'root');
define('DB_PASS', '');

$results = [];

try {
    $pdo = new PDO("mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=utf8mb4", DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $results[] = "✅ Connected to database";

    // ─── ALTER hotels table — add new columns ─────────────────────────────────
    $hotelColumns = [
        "ALTER TABLE hotels ADD COLUMN IF NOT EXISTS hotel_status VARCHAR(50) DEFAULT 'Draft'",
        "ALTER TABLE hotels ADD COLUMN IF NOT EXISTS property_type VARCHAR(100) DEFAULT 'Hotel'",
        "ALTER TABLE hotels ADD COLUMN IF NOT EXISTS property_registration_no VARCHAR(100) DEFAULT NULL",
        "ALTER TABLE hotels ADD COLUMN IF NOT EXISTS gst_number VARCHAR(50) DEFAULT NULL",
        "ALTER TABLE hotels ADD COLUMN IF NOT EXISTS checkin_time VARCHAR(10) DEFAULT '14:00'",
        "ALTER TABLE hotels ADD COLUMN IF NOT EXISTS checkout_time VARCHAR(10) DEFAULT '12:00'",
        "ALTER TABLE hotels ADD COLUMN IF NOT EXISTS policies_json TEXT DEFAULT NULL",
        "ALTER TABLE hotels ADD COLUMN IF NOT EXISTS facilities_json TEXT DEFAULT NULL",
        "ALTER TABLE hotels ADD COLUMN IF NOT EXISTS wizard_step INT DEFAULT 1",
        "ALTER TABLE hotels ADD COLUMN IF NOT EXISTS website VARCHAR(255) DEFAULT NULL",
        "ALTER TABLE hotels ADD COLUMN IF NOT EXISTS phone VARCHAR(20) DEFAULT NULL",
        "ALTER TABLE hotels ADD COLUMN IF NOT EXISTS email VARCHAR(100) DEFAULT NULL",
        "ALTER TABLE hotels ADD COLUMN IF NOT EXISTS total_rooms INT DEFAULT 0",
        "ALTER TABLE hotels ADD COLUMN IF NOT EXISTS floors INT DEFAULT 1",
        "ALTER TABLE hotels ADD COLUMN IF NOT EXISTS year_established VARCHAR(10) DEFAULT NULL",
        "ALTER TABLE hotels ADD COLUMN IF NOT EXISTS latitude VARCHAR(30) DEFAULT NULL",
        "ALTER TABLE hotels ADD COLUMN IF NOT EXISTS longitude VARCHAR(30) DEFAULT NULL",
        "ALTER TABLE hotels ADD COLUMN IF NOT EXISTS address TEXT DEFAULT NULL",
        "ALTER TABLE hotels ADD COLUMN IF NOT EXISTS city VARCHAR(100) DEFAULT 'Goa'",
        "ALTER TABLE hotels ADD COLUMN IF NOT EXISTS state VARCHAR(100) DEFAULT 'Goa'",
        "ALTER TABLE hotels ADD COLUMN IF NOT EXISTS country VARCHAR(100) DEFAULT 'India'",
        "ALTER TABLE hotels ADD COLUMN IF NOT EXISTS pincode VARCHAR(10) DEFAULT NULL",
        "ALTER TABLE hotels ADD COLUMN IF NOT EXISTS approval_remarks TEXT DEFAULT NULL",
        "ALTER TABLE hotels ADD COLUMN IF NOT EXISTS profile_completion INT DEFAULT 20",
        "ALTER TABLE hotels ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP",
        "ALTER TABLE hotels ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
    ];

    foreach ($hotelColumns as $sql) {
        try {
            $pdo->exec($sql);
        } catch (Exception $e) {
            // Ignore "duplicate column" errors silently
        }
    }
    $results[] = "✅ Hotels table updated with new columns";

    // ─── hotel_room_types ─────────────────────────────────────────────────────
    $pdo->exec("CREATE TABLE IF NOT EXISTS hotel_room_types (
        id VARCHAR(50) NOT NULL PRIMARY KEY,
        hotel_id VARCHAR(50) NOT NULL,
        vendor_id VARCHAR(100) NOT NULL,
        name VARCHAR(255) NOT NULL,
        internal_code VARCHAR(50) DEFAULT NULL,
        description TEXT DEFAULT NULL,
        total_rooms INT DEFAULT 1,
        max_adults INT DEFAULT 2,
        max_children INT DEFAULT 1,
        max_occupancy INT DEFAULT 3,
        base_occupancy INT DEFAULT 2,
        bed_type VARCHAR(100) DEFAULT 'King',
        num_beds INT DEFAULT 1,
        room_size DECIMAL(10,2) DEFAULT 0,
        room_size_unit VARCHAR(10) DEFAULT 'sqft',
        view_type VARCHAR(100) DEFAULT 'Garden View',
        smoking TINYINT DEFAULT 0,
        air_conditioned TINYINT DEFAULT 1,
        private_bathroom TINYINT DEFAULT 1,
        extra_bed_available TINYINT DEFAULT 0,
        base_price INT DEFAULT 0,
        selling_price INT DEFAULT 0,
        weekend_price INT DEFAULT 0,
        extra_adult_charge INT DEFAULT 0,
        extra_child_charge INT DEFAULT 0,
        extra_bed_charge INT DEFAULT 0,
        amenities_json TEXT DEFAULT NULL,
        images_json TEXT DEFAULT NULL,
        status VARCHAR(50) DEFAULT 'Active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX (hotel_id),
        INDEX (vendor_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
    $results[] = "✅ hotel_room_types table created";

    // ─── hotel_rooms (physical room numbers) ──────────────────────────────────
    $pdo->exec("CREATE TABLE IF NOT EXISTS hotel_rooms (
        id VARCHAR(50) NOT NULL PRIMARY KEY,
        hotel_id VARCHAR(50) NOT NULL,
        room_type_id VARCHAR(50) NOT NULL,
        vendor_id VARCHAR(100) NOT NULL,
        room_number VARCHAR(20) NOT NULL,
        floor VARCHAR(10) DEFAULT '1',
        status VARCHAR(50) DEFAULT 'Available',
        internal_note TEXT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX (hotel_id),
        INDEX (room_type_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
    $results[] = "✅ hotel_rooms table created";

    // ─── hotel_rate_plans ─────────────────────────────────────────────────────
    $pdo->exec("CREATE TABLE IF NOT EXISTS hotel_rate_plans (
        id VARCHAR(50) NOT NULL PRIMARY KEY,
        hotel_id VARCHAR(50) NOT NULL,
        room_type_id VARCHAR(50) DEFAULT NULL,
        vendor_id VARCHAR(100) NOT NULL,
        name VARCHAR(255) NOT NULL,
        plan_type VARCHAR(100) DEFAULT 'Standard',
        price INT NOT NULL DEFAULT 0,
        discount_type VARCHAR(50) DEFAULT NULL,
        discount_value DECIMAL(10,2) DEFAULT 0,
        min_stay INT DEFAULT 1,
        max_stay INT DEFAULT 30,
        min_advance_days INT DEFAULT 0,
        valid_from DATE DEFAULT NULL,
        valid_to DATE DEFAULT NULL,
        applicable_days TEXT DEFAULT NULL,
        cancellation_policy TEXT DEFAULT NULL,
        is_refundable TINYINT DEFAULT 1,
        status VARCHAR(20) DEFAULT 'Active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX (hotel_id),
        INDEX (room_type_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
    $results[] = "✅ hotel_rate_plans table created";

    // ─── hotel_guests ─────────────────────────────────────────────────────────
    $pdo->exec("CREATE TABLE IF NOT EXISTS hotel_guests (
        id VARCHAR(50) NOT NULL PRIMARY KEY,
        vendor_id VARCHAR(100) NOT NULL,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        email VARCHAR(100) DEFAULT NULL,
        address TEXT DEFAULT NULL,
        city VARCHAR(100) DEFAULT NULL,
        country VARCHAR(100) DEFAULT 'India',
        dob DATE DEFAULT NULL,
        id_type VARCHAR(50) DEFAULT NULL,
        id_number_masked VARCHAR(20) DEFAULT NULL,
        preferences TEXT DEFAULT NULL,
        internal_notes TEXT DEFAULT NULL,
        total_stays INT DEFAULT 0,
        total_spend INT DEFAULT 0,
        is_restricted TINYINT DEFAULT 0,
        restriction_reason TEXT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX (vendor_id),
        INDEX (phone)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
    $results[] = "✅ hotel_guests table created";

    // ─── hotel_reviews ────────────────────────────────────────────────────────
    $pdo->exec("CREATE TABLE IF NOT EXISTS hotel_reviews (
        id VARCHAR(50) NOT NULL PRIMARY KEY,
        hotel_id VARCHAR(50) NOT NULL,
        vendor_id VARCHAR(100) NOT NULL,
        booking_id VARCHAR(50) DEFAULT NULL,
        guest_name VARCHAR(255) NOT NULL,
        rating DECIMAL(3,1) DEFAULT 0,
        review TEXT DEFAULT NULL,
        vendor_reply TEXT DEFAULT NULL,
        review_date DATE DEFAULT NULL,
        status VARCHAR(50) DEFAULT 'Published',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX (hotel_id),
        INDEX (vendor_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
    $results[] = "✅ hotel_reviews table created";

    // ─── hotel_staff ──────────────────────────────────────────────────────────
    $pdo->exec("CREATE TABLE IF NOT EXISTS hotel_staff (
        id VARCHAR(50) NOT NULL PRIMARY KEY,
        vendor_id VARCHAR(100) NOT NULL,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(100) NOT NULL,
        phone VARCHAR(20) DEFAULT NULL,
        role VARCHAR(100) DEFAULT 'Front Desk Staff',
        hotel_ids TEXT DEFAULT NULL,
        permissions_json TEXT DEFAULT NULL,
        status VARCHAR(20) DEFAULT 'Active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX (vendor_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
    $results[] = "✅ hotel_staff table created";

    // ─── hotel_notifications ──────────────────────────────────────────────────
    $pdo->exec("CREATE TABLE IF NOT EXISTS hotel_notifications (
        id VARCHAR(50) NOT NULL PRIMARY KEY,
        vendor_id VARCHAR(100) NOT NULL,
        type VARCHAR(100) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        related_id VARCHAR(50) DEFAULT NULL,
        related_type VARCHAR(50) DEFAULT NULL,
        is_read TINYINT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX (vendor_id),
        INDEX (is_read)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
    $results[] = "✅ hotel_notifications table created";

    // ─── hotel_support_tickets ────────────────────────────────────────────────
    $pdo->exec("CREATE TABLE IF NOT EXISTS hotel_support_tickets (
        id VARCHAR(50) NOT NULL PRIMARY KEY,
        vendor_id VARCHAR(100) NOT NULL,
        category VARCHAR(100) NOT NULL,
        hotel_id VARCHAR(50) DEFAULT NULL,
        booking_id VARCHAR(50) DEFAULT NULL,
        subject VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        priority VARCHAR(20) DEFAULT 'Medium',
        status VARCHAR(50) DEFAULT 'Open',
        messages_json TEXT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX (vendor_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
    $results[] = "✅ hotel_support_tickets table created";

    // ─── hotel_activity_log ───────────────────────────────────────────────────
    $pdo->exec("CREATE TABLE IF NOT EXISTS hotel_activity_log (
        id VARCHAR(50) NOT NULL PRIMARY KEY,
        vendor_id VARCHAR(100) NOT NULL,
        user_name VARCHAR(255) NOT NULL,
        action VARCHAR(255) NOT NULL,
        related_type VARCHAR(50) DEFAULT NULL,
        related_id VARCHAR(50) DEFAULT NULL,
        previous_value TEXT DEFAULT NULL,
        new_value TEXT DEFAULT NULL,
        ip_address VARCHAR(50) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX (vendor_id),
        INDEX (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
    $results[] = "✅ hotel_activity_log table created";

    // ─── hotel_availability_calendar ──────────────────────────────────────────
    $pdo->exec("CREATE TABLE IF NOT EXISTS hotel_availability_calendar (
        id VARCHAR(50) NOT NULL PRIMARY KEY,
        hotel_id VARCHAR(50) NOT NULL,
        room_type_id VARCHAR(50) NOT NULL,
        vendor_id VARCHAR(100) NOT NULL,
        date DATE NOT NULL,
        available_rooms INT DEFAULT NULL,
        price_override INT DEFAULT NULL,
        status VARCHAR(50) DEFAULT 'Available',
        min_stay INT DEFAULT 1,
        stop_sale TINYINT DEFAULT 0,
        block_reason TEXT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_date_room (room_type_id, date),
        INDEX (hotel_id),
        INDEX (date)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
    $results[] = "✅ hotel_availability_calendar table created";

    echo implode("\n", $results) . "\n\n🎉 PMS migration completed successfully!\n";

} catch (Exception $e) {
    echo "❌ Migration failed: " . $e->getMessage() . "\n";
    echo implode("\n", $results) . "\n";
}
