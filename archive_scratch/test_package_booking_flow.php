<?php
// Test Package Booking End-to-End with explicit departure_date, return_date, and duration
$url = 'http://localhost:8000/api.php?action=book';
$bookingId = 'TG-' . rand(100000, 999999);

$depDate = '2026-09-15';
$retDate = '2026-09-19';
$durationStr = '4 Nights / 5 Days';

$payload = [
    'id' => $bookingId,
    'name' => 'Alice Wonder',
    'phone' => '9876543211',
    'email' => 'alice@example.com',
    'pickup_loc' => 'Goa International Airport (GOI)',
    'drop_loc' => 'Goa International Airport (GOI)',
    'pickup_date' => $depDate,
    'drop_date' => $retDate,
    'departure_date' => $depDate,
    'return_date' => $retDate,
    'check_in_date' => $depDate,
    'check_out_date' => $retDate,
    'duration' => $durationStr,
    'item_id' => 'pkg-2',
    'item_name' => 'Romantic Goa Sunset & Heritage Escape',
    'booking_days' => 4,
    'total_amount' => 34999,
    'amount_paid' => 8750,
    'remaining_amount' => 26249,
    'total_paid' => 8750,
    'status' => 'Confirmed',
    'payment_status' => 'Partial',
    'payment_method' => 'Direct / UPI',
    'payment_mode' => 'advance',
    'customizations' => json_encode(['cabType' => 'self-drive', 'withFlight' => false]),
    'traveller_details_json' => [
        'adults' => 2,
        'children' => 0,
        'list' => [
            ['type' => 'Adult', 'firstName' => 'Alice', 'lastName' => 'Wonder', 'gender' => 'Ms', 'age' => 28]
        ],
        'contactEmail' => 'alice@example.com',
        'contactPhone' => '9876543211'
    ]
];

$opts = [
    'http' => [
        'method' => 'POST',
        'header' => "Content-Type: application/json\r\nX-Tenant-ID: admin\r\n",
        'content' => json_encode($payload),
        'ignore_errors' => true
    ]
];

$context = stream_context_create($opts);
$response = file_get_contents($url, false, $context);

echo "API Response: $response\n";

// Query SQLite directly to confirm record exists with date fields
$pdo = new PDO('sqlite:' . __DIR__ . '/../backend/database.sqlite');
$stmt = $pdo->prepare("SELECT * FROM bookings WHERE id = ?");
$stmt->execute([$bookingId]);
$booking = $stmt->fetch(PDO::FETCH_ASSOC);

if ($booking) {
    echo "\n SUCCESS! Booking verified in SQLite database with explicit dates:\n";
    echo "ID: " . $booking['id'] . "\n";
    echo "Item: " . $booking['item_name'] . "\n";
    echo "Customer: " . $booking['name'] . " (" . $booking['phone'] . ")\n";
    echo "Departure Date: " . $booking['departure_date'] . "\n";
    echo "Return Date: " . $booking['return_date'] . "\n";
    echo "Check-in Date: " . $booking['check_in_date'] . "\n";
    echo "Check-out Date: " . $booking['check_out_date'] . "\n";
    echo "Duration: " . $booking['duration'] . "\n";
    echo "Total Amount: ₹" . $booking['total_amount'] . "\n";
    echo "Amount Paid: ₹" . $booking['amount_paid'] . "\n";
    echo "Remaining: ₹" . $booking['remaining_amount'] . "\n";
    echo "Status: " . $booking['status'] . " (" . $booking['payment_status'] . ")\n";
} else {
    echo "\n FAILED: Booking was not found in SQLite.\n";
}
