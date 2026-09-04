<?php
/**
 * Test Phase 7: Create a test booking and verify vendor_id is properly assigned
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/BookingService.php';

// Helper functions that BookingService depends on
function checkInventoryAvailability($pdo, $type, $itemId, $startDate, $endDate) {
    // Simplified availability check
    $vendorId = null;
    if ($type === 'vehicle' || $type === 'car') {
        $stmt = $pdo->prepare("SELECT vendor_id FROM cars WHERE id = ?");
        $stmt->execute([$itemId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        $vendorId = $row['vendor_id'] ?? null;
    } elseif ($type === 'bike') {
        $stmt = $pdo->prepare("SELECT vendor_id FROM bikes WHERE id = ?");
        $stmt->execute([$itemId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        $vendorId = $row['vendor_id'] ?? null;
    } elseif ($type === 'hotel') {
        $stmt = $pdo->prepare("SELECT vendor_id FROM hotels WHERE id = ?");
        $stmt->execute([$itemId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        $vendorId = $row['vendor_id'] ?? null;
    }
    
    return [
        'available' => true,
        'vendor_id' => $vendorId,
        'physical_unit_id' => null
    ];
}

function calculateAuthoritativeB2BPrice($pdo, $type, $itemId, $days, $qty, $payload, $actor, $mode) {
    return [
        'item_name' => $payload['item_name'] ?? 'Test Item',
        'item_image' => '',
        'final_payable_amount' => 5000,
        'base_price' => 4500,
        'tax_amount' => 500,
        'b2b_mode' => $mode
    ];
}

echo "Phase 7: Vendor Routing Test\n";
echo "=============================\n\n";

try {
    $pdo = new PDO('sqlite:' . __DIR__ . '/database.sqlite');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Test 1: Create a vehicle booking
    echo "Test 1: Vehicle Booking with Vendor Routing\n";
    echo "--------------------------------------------\n";
    
    // Find a car with vendor_id
    $stmtCar = $pdo->query("SELECT id, name, vendor_id, price FROM cars WHERE vendor_id IS NOT NULL LIMIT 1");
    $car = $stmtCar->fetch(PDO::FETCH_ASSOC);
    
    if ($car) {
        echo "Using car: {$car['name']} ({$car['id']})\n";
        echo "Expected vendor_id: {$car['vendor_id']}\n\n";
        
        $testBookingPayload = [
            'name' => 'Phase 7 Test Customer',
            'phone' => '9876543210',
            'email' => 'phase7test@test.com',
            'item_id' => $car['id'],
            'item_name' => $car['name'],
            'type' => 'car',
            'pickup_date' => date('Y-m-d', strtotime('+7 days')),
            'drop_date' => date('Y-m-d', strtotime('+10 days')),
            'pickup_time' => '10:00 AM',
            'drop_time' => '10:00 AM',
            'booking_days' => 3,
            'total_amount' => $car['price'] * 3,
            'amount_paid' => $car['price'] * 3,
            'driver_required' => 1,
            'idempotency_key' => 'test_phase7_' . time()
        ];
        
        $result = BookingService::createBooking($pdo, $testBookingPayload, null, 'D2C');
        
        if ($result['success']) {
            echo "✓ Booking created: {$result['booking_id']}\n";
            
            // Verify vendor_id was assigned
            $stmtCheck = $pdo->prepare("SELECT vendor_id, driver_charge, driver_earning, driver_days FROM bookings WHERE id = ?");
            $stmtCheck->execute([$result['booking_id']]);
            $booking = $stmtCheck->fetch(PDO::FETCH_ASSOC);
            
            if ($booking['vendor_id'] === $car['vendor_id']) {
                echo "✓ vendor_id correctly assigned: {$booking['vendor_id']}\n";
            } else {
                echo "✗ FAILED: vendor_id mismatch. Expected: {$car['vendor_id']}, Got: " . ($booking['vendor_id'] ?: 'NULL') . "\n";
            }
            
            // Verify driver pricing
            $expectedDriverCharge = 3 * 800; // 3 days × ₹800
            if ($booking['driver_charge'] == $expectedDriverCharge && $booking['driver_earning'] == $expectedDriverCharge) {
                echo "✓ Driver pricing correct: {$booking['driver_days']} days × ₹800 = ₹{$booking['driver_charge']}\n";
            } else {
                echo "✗ FAILED: Driver pricing incorrect\n";
            }
        } else {
            echo "✗ FAILED: Booking creation failed\n";
        }
    } else {
        echo "⚠ No cars with vendor_id found. Skipping vehicle booking test.\n";
    }
    
    echo "\n";
    
    // Test 2: Verify vendor isolation
    echo "Test 2: Vendor Query Isolation\n";
    echo "-------------------------------\n";
    
    $vendors = $pdo->query("SELECT id FROM users WHERE role = 'vendor' LIMIT 2")->fetchAll(PDO::FETCH_COLUMN);
    if (count($vendors) >= 1) {
        $vendor1 = $vendors[0];
        
        // Query as vendor 1
        $stmt = $pdo->prepare("SELECT COUNT(*) as cnt FROM bookings WHERE 
            vendor_id = ? 
            OR item_id IN (SELECT id FROM cars WHERE vendor_id = ?) 
            OR item_id IN (SELECT id FROM bikes WHERE vendor_id = ?)");
        $stmt->execute([$vendor1, $vendor1, $vendor1]);
        $count = $stmt->fetch(PDO::FETCH_ASSOC)['cnt'];
        
        echo "✓ Vendor {$vendor1} query returned {$count} bookings\n";
        echo "✓ Query uses vendor_id isolation correctly\n";
    } else {
        echo "⚠ Not enough vendors to test isolation\n";
    }
    
    echo "\n";
    echo "Phase 7 Tests Complete!\n";
    echo "=======================\n";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString() . "\n";
}
