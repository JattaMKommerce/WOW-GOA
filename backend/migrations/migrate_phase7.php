<?php
/**
 * Phase 7 Migration: Vendor & Driver Routing
 * 
 * Adds vendor_id column to bookings table for authoritative vendor routing.
 * This migration is idempotent and safe to run multiple times.
 */

// Determine database path
$dbPath = __DIR__ . '/../database.sqlite';
if (!file_exists($dbPath)) {
    $dbPath = 'd:/wow goa/Tripgalileo (2)/Tripgalileo/backend/database.sqlite';
}

if (!file_exists($dbPath)) {
    die("Error: Database file not found at: $dbPath\n");
}

try {
    $pdo = new PDO('sqlite:' . $dbPath);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "Phase 7 Migration: Vendor & Driver Routing\n";
    echo "==========================================\n\n";
    
    // Check current bookings table schema
    $cols = $pdo->query("PRAGMA table_info(bookings)")->fetchAll(PDO::FETCH_ASSOC);
    $colNames = array_column($cols, 'name');
    
    // Add vendor_id column if not exists
    if (!in_array('vendor_id', $colNames)) {
        $pdo->exec("ALTER TABLE bookings ADD COLUMN vendor_id VARCHAR(50) DEFAULT NULL");
        echo "✓ Added vendor_id column to bookings table\n";
    } else {
        echo "✓ vendor_id column already exists in bookings table\n";
    }
    
    // Verify cars, bikes, and hotels have vendor_id (they should from previous phases)
    $tableChecks = ['cars', 'bikes', 'hotels'];
    foreach ($tableChecks as $table) {
        $cols = $pdo->query("PRAGMA table_info($table)")->fetchAll(PDO::FETCH_ASSOC);
        $colNames = array_column($cols, 'name');
        if (in_array('vendor_id', $colNames)) {
            echo "✓ $table table has vendor_id column\n";
        } else {
            echo "⚠ WARNING: $table table is missing vendor_id column (should exist from earlier phases)\n";
        }
    }
    
    echo "\n";
    echo "Phase 7 Migration completed successfully!\n";
    echo "=========================================\n";
    
} catch (Exception $e) {
    echo "Error during migration: " . $e->getMessage() . "\n";
    exit(1);
}
