<?php
$url = 'http://localhost:8000/api.php?resource=bookings';
$opts = [
    'http' => [
        'method' => 'GET',
        'header' => "X-Tenant-ID: admin\r\n",
        'ignore_errors' => true
    ]
];
$context = stream_context_create($opts);
$res = file_get_contents($url, false, $context);
$bookings = json_decode($res, true);

echo "Fetched " . count($bookings) . " bookings from API.\n";
if (count($bookings) > 0) {
    $latest = $bookings[0];
    echo "\nLatest Booking Record:\n";
    echo "ID: " . $latest['id'] . "\n";
    echo "Name: " . $latest['name'] . "\n";
    echo "Item: " . $latest['item_name'] . "\n";
    echo "Departure Date: " . $latest['departure_date'] . "\n";
    echo "Return Date: " . $latest['return_date'] . "\n";
    echo "Duration: " . $latest['duration'] . "\n";
    echo "Total: ₹" . $latest['total_amount'] . "\n";
    echo "Paid: ₹" . $latest['amount_paid'] . "\n";
}
