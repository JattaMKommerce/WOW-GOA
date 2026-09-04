<?php
// Safe Migration: Add parent_booking_id to bookings table if not exists
$sqlitePath = __DIR__ . '/database.sqlite';
$pdo = new PDO("sqlite:$sqlitePath");
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

// Check if parent_booking_id column exists
$stmt = $pdo->query("PRAGMA table_info(bookings)");
$hasCol = false;
while ($col = $stmt->fetch(PDO::FETCH_ASSOC)) {
    if ($col['name'] === 'parent_booking_id') {
        $hasCol = true;
        break;
    }
}

if (!$hasCol) {
    echo "Adding parent_booking_id column to bookings table...\n";
    $pdo->exec("ALTER TABLE bookings ADD COLUMN parent_booking_id VARCHAR(50) DEFAULT NULL");
    echo "Column parent_booking_id added successfully.\n";
} else {
    echo "Column parent_booking_id already exists.\n";
}

// Ensure index exists
try {
    $pdo->exec("CREATE INDEX IF NOT EXISTS idx_bookings_parent_id ON bookings(parent_booking_id)");
    echo "Index idx_bookings_parent_id ensured.\n";
} catch (Exception $e) {
    echo "Index note: " . $e->getMessage() . "\n";
}

echo "Migration completed successfully.\n";
