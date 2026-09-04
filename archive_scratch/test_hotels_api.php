<?php
$json = file_get_contents('http://localhost:8000/api.php?resource=hotels');
$hotels = json_decode($json, true);
echo "Fetched " . count($hotels) . " hotels from API:\n";
foreach($hotels as $h) {
    echo "- [" . $h['stars'] . "★] " . $h['name'] . " (₹" . $h['price'] . ") in " . $h['area'] . "\n";
    echo "  Main Image: " . $h['image'] . "\n";
    echo "  Total images count: " . count($h['images'] ?? []) . "\n";
    if (!empty($h['images'])) {
        foreach ($h['images'] as $idx => $img) {
            echo "    [" . ($idx + 1) . "] " . $img . "\n";
        }
    }
}
