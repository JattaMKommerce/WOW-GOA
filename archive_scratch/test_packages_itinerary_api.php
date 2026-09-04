<?php
$url = 'http://localhost:8000/api.php?resource=packages';
$opts = [
    'http' => [
        'method' => 'GET',
        'header' => "X-Tenant-ID: admin\r\n",
        'ignore_errors' => true
    ]
];
$context = stream_context_create($opts);
$res = file_get_contents($url, false, $context);
$packages = json_decode($res, true);

echo "Fetched " . count($packages) . " packages from API.\n\n";
foreach ($packages as $pkg) {
    echo "========================================\n";
    echo "Package ID: " . $pkg['id'] . "\n";
    echo "Name: " . $pkg['name'] . "\n";
    echo "Duration: " . $pkg['duration'] . "\n";
    $itinerary = $pkg['itinerary'] ?? (is_string($pkg['day_wise_itinerary']) ? json_decode($pkg['day_wise_itinerary'], true) : $pkg['day_wise_itinerary']);
    echo "Itinerary Days Count: " . (is_array($itinerary) ? count($itinerary) : 0) . "\n";
    if (is_array($itinerary)) {
        foreach ($itinerary as $d) {
            echo "  - Day " . ($d['day'] ?? '?') . ": " . ($d['title'] ?? 'No Title') . " (" . ($d['location'] ?? 'No Loc') . ")\n";
        }
    }
}
