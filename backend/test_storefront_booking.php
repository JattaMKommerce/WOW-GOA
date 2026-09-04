<?php
// backend/test_storefront_booking.php

$payload = [
    'name' => 'Rahul Verma',
    'customer_name' => 'Rahul Verma',
    'phone' => '9811223344',
    'customer_phone' => '9811223344',
    'email' => 'rahul@example.com',
    'customer_email' => 'rahul@example.com',
    'pickup_loc' => 'Goa Airport',
    'pickup_date' => '2026-09-15',
    'pickup_time' => '10:00 AM',
    'drop_date' => '2026-09-17',
    'drop_time' => '10:00 AM',
    'item_id' => 'car-1',
    'item_name' => 'Mahindra Thar 4x4',
    'package_name' => 'Car Rental',
    'package_type' => 'Car Rental',
    'type' => 'car',
    'booking_days' => 2,
    'total_amount' => 5000,
    'amount_paid' => 5000,
    'total_paid' => 5000,
    'driver_required' => 1,
    'driver_service_type' => 'PICKUP',
    'driver_charge' => 400,
    'driver_days' => 1,
    'driver_earning' => 400,
    'status' => 'Confirmed'
];

$opts = [
    'http' => [
        'method' => 'POST',
        'header' => "Content-Type: application/json\r\n",
        'content' => json_encode($payload),
        'ignore_errors' => true
    ]
];
$ctx = stream_context_create($opts);
$response = file_get_contents('http://localhost:8000/api.php?action=book', false, $ctx);
echo "Response: $response\n";
