<?php
/**
 * Phase 8 Migration: Central Notification System
 * 
 * Ensures notifications table has all required columns for unified notification system.
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
    
    echo "Phase 8 Migration: Central Notification System\n";
    echo "================================================\n\n";
    
    // Create notifications table if not exists
    $pdo->exec("CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id VARCHAR(100) DEFAULT NULL,
        role VARCHAR(50) DEFAULT NULL,
        type VARCHAR(50) NOT NULL DEFAULT 'general',
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        reference_type VARCHAR(50) DEFAULT NULL,
        reference_id VARCHAR(100) DEFAULT NULL,
        b2b_partner_id VARCHAR(50) DEFAULT NULL,
        link TEXT DEFAULT '',
        is_read INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )");
    echo "✓ Notifications table verified\n";
    
    // Check current notifications table schema
    $cols = $pdo->query("PRAGMA table_info(notifications)")->fetchAll(PDO::FETCH_ASSOC);
    $colNames = array_column($cols, 'name');
    
    // Add missing columns if needed
    $requiredColumns = [
        'role' => 'VARCHAR(50) DEFAULT NULL',
        'b2b_partner_id' => 'VARCHAR(50) DEFAULT NULL',
        'reference_type' => 'VARCHAR(50) DEFAULT NULL',
        'reference_id' => 'VARCHAR(100) DEFAULT NULL',
        'type' => 'VARCHAR(50) DEFAULT "general"'
    ];
    
    foreach ($requiredColumns as $colName => $colDef) {
        if (!in_array($colName, $colNames)) {
            try {
                $pdo->exec("ALTER TABLE notifications ADD COLUMN $colName $colDef");
                echo "✓ Added $colName column to notifications table\n";
            } catch (Exception $e) {
                echo "ℹ Column $colName might already exist or cannot be added: " . $e->getMessage() . "\n";
            }
        } else {
            echo "✓ $colName column already exists\n";
        }
    }
    
    // Verify hotel_notifications table exists for legacy PMS compatibility
    $tables = $pdo->query("SELECT name FROM sqlite_master WHERE type='table' AND name='hotel_notifications'")->fetchAll(PDO::FETCH_COLUMN);
    if (in_array('hotel_notifications', $tables)) {
        echo "✓ hotel_notifications table exists for legacy PMS compatibility\n";
    } else {
        echo "ℹ hotel_notifications table does not exist (will be created on first use)\n";
    }
    
    echo "\n";
    echo "Phase 8 Migration completed successfully!\n";
    echo "=========================================\n";
    
} catch (Exception $e) {
    echo "Error during migration: " . $e->getMessage() . "\n";
    exit(1);
}
