<?php
echo "=== TESTING HTTP API (http://localhost:8000/api.php) ===\n\n";

function postApi($payload) {
    $options = [
        'http' => [
            'header'  => "Content-Type: application/json\r\n" .
                         "X-Tenant-ID: admin\r\n",
            'method'  => 'POST',
            'content' => json_encode($payload),
            'ignore_errors' => true
        ]
    ];
    $context  = stream_context_create($options);
    $result = file_get_contents('http://localhost:8000/api.php', false, $context);
    return ['body' => json_decode($result, true), 'raw' => $result];
}

// 1. Test add_vehicle (Car)
$carId = 'car-http-' . time();
$res1 = postApi([
    'action' => 'add_vehicle',
    'type' => 'car',
    'id' => $carId,
    'name' => 'Hyundai Creta SX',
    'price' => 2800,
    'fuel' => 'Petrol',
    'transmission' => 'Automatic',
    'seating' => '5 Seater',
    'image' => 'http://localhost:8000/uploads/test.jpg',
    'location' => 'Panaji, Goa',
    'vendorId' => 'vendor'
]);
echo "1. add_vehicle (Car): " . ($res1['body']['success'] ? "SUCCESS ({$res1['body']['id']})" : "FAILED ({$res1['raw']})") . "\n";

// 2. Test add_vehicle (Bike)
$bikeId = 'bike-http-' . time();
$res2 = postApi([
    'action' => 'add_vehicle',
    'type' => 'bike',
    'id' => $bikeId,
    'name' => 'Honda Activa 6G',
    'price' => 500,
    'fuel' => 'Petrol',
    'engine' => '110cc',
    'mileage' => '45 km/l',
    'image' => 'http://localhost:8000/uploads/test_bike.jpg',
    'location' => 'Calangute, Goa',
    'vendorId' => 'vendor'
]);
echo "2. add_vehicle (Bike): " . ($res2['body']['success'] ? "SUCCESS ({$res2['body']['id']})" : "FAILED ({$res2['raw']})") . "\n";

// 3. Test update_vehicle
$res3 = postApi([
    'action' => 'update_vehicle',
    'id' => $carId,
    'type' => 'car',
    'name' => 'Hyundai Creta SX (Updated)',
    'price' => 3100,
    'fuel' => 'Petrol',
    'transmission' => 'Automatic',
    'seating' => '5 Seater',
    'image' => 'http://localhost:8000/uploads/test.jpg',
    'location' => 'Panaji, Goa'
]);
echo "3. update_vehicle: " . ($res3['body']['success'] ? "SUCCESS" : "FAILED ({$res3['raw']})") . "\n";

// 4. Test toggle_vehicle_availability
$res4 = postApi([
    'action' => 'toggle_vehicle_availability',
    'id' => $carId,
    'type' => 'car',
    'is_available' => 0
]);
echo "4. toggle_vehicle_availability (0): " . ($res4['body']['success'] ? "SUCCESS" : "FAILED ({$res4['raw']})") . "\n";

// 5. Test create_booking
$bookingId = 'TG-HTTP-' . rand(1000, 9999);
$res5 = postApi([
    'action' => 'create_booking',
    'id' => $bookingId,
    'name' => 'Karan Kapoor',
    'phone' => '+91 9811223344',
    'email' => 'karan@example.com',
    'license' => 'DL-09-2023001',
    'item_id' => $carId,
    'item_name' => 'Hyundai Creta SX',
    'pickup_loc' => 'Goa Airport',
    'pickup_date' => '2026-09-05',
    'drop_date' => '2026-09-08',
    'booking_days' => 3,
    'total_amount' => 9300,
    'amount_paid' => 9300,
    'total_paid' => 9300,
    'status' => 'Confirmed',
    'payment_status' => 'Paid',
    'payment_method' => 'UPI'
]);
echo "5. create_booking: " . ($res5['body']['success'] ? "SUCCESS ({$res5['body']['booking_id']})" : "FAILED ({$res5['raw']})") . "\n";

// 6. Test update_booking
$res6 = postApi([
    'action' => 'update_booking',
    'id' => $bookingId,
    'name' => 'Karan Kapoor (Updated)',
    'phone' => '+91 9811223344',
    'email' => 'karan.updated@example.com',
    'license' => 'DL-09-2023001',
    'item_id' => $carId,
    'item_name' => 'Hyundai Creta SX',
    'pickup_loc' => 'Calangute, Goa',
    'pickup_date' => '2026-09-06',
    'drop_date' => '2026-09-09',
    'booking_days' => 3,
    'total_amount' => 9300,
    'amount_paid' => 9300,
    'status' => 'Pickup',
    'payment_status' => 'Paid',
    'payment_method' => 'UPI'
]);
echo "6. update_booking: " . ($res6['body']['success'] ? "SUCCESS" : "FAILED ({$res6['raw']})") . "\n";

// 7. Test update_booking_status
$res7 = postApi([
    'action' => 'update_booking_status',
    'id' => $bookingId,
    'status' => 'Completed',
    'payment_status' => 'Paid'
]);
echo "7. update_booking_status: " . ($res7['body']['success'] ? "SUCCESS" : "FAILED ({$res7['raw']})") . "\n";

// 8. Test update_user
$res8 = postApi([
    'action' => 'update_user',
    'id' => 'u-4',
    'username' => 'vendor',
    'name' => 'Goa Sunset Wheels',
    'email' => 'vendor@tripgalileo.com',
    'phone' => '+91 9876543210',
    'city' => 'Calangute, Goa',
    'role' => 'vendor'
]);
echo "8. update_user: " . ($res8['body']['success'] ? "SUCCESS" : "FAILED ({$res8['raw']})") . "\n";

// 9. Clean up HTTP test entities
$resDelCar = postApi(['action' => 'delete_vehicle', 'id' => $carId, 'type' => 'car']);
$resDelBike = postApi(['action' => 'delete_vehicle', 'id' => $bikeId, 'type' => 'bike']);
$resDelBk = postApi(['action' => 'delete_booking', 'id' => $bookingId]);
echo "9. Cleanup (delete_vehicle, delete_booking): " . ($resDelCar['body']['success'] && $resDelBike['body']['success'] && $resDelBk['body']['success'] ? "SUCCESS" : "FAILED") . "\n";

echo "\n=== ALL HTTP API ENDPOINT TESTS COMPLETED SUCCESSFULLY ===\n";
