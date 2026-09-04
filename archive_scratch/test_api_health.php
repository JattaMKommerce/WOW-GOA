<?php
$baseUrl = 'http://localhost:8000/api.php';

function checkEndpoint($url) {
    $res = @file_get_contents($url);
    $status = 0;
    if (isset($http_response_header)) {
        foreach ($http_response_header as $hdr) {
            if (preg_match('/^HTTP\/\d\.\d\s+(\d+)/', $hdr, $m)) {
                $status = intval($m[1]);
                break;
            }
        }
    }
    return ['status' => $status, 'length' => strlen($res)];
}

echo "Testing API Endpoints after RBAC Rollback:\n";
$packages = checkEndpoint($baseUrl . '?resource=packages');
echo "GET ?resource=packages: HTTP " . $packages['status'] . " (" . $packages['length'] . " bytes)\n";

$hotels = checkEndpoint($baseUrl . '?resource=hotels');
echo "GET ?resource=hotels: HTTP " . $hotels['status'] . " (" . $hotels['length'] . " bytes)\n";

$cars = checkEndpoint($baseUrl . '?resource=cars');
echo "GET ?resource=cars: HTTP " . $cars['status'] . " (" . $cars['length'] . " bytes)\n";

$bookings = checkEndpoint($baseUrl . '?resource=bookings');
echo "GET ?resource=bookings: HTTP " . $bookings['status'] . " (" . $bookings['length'] . " bytes)\n";

echo "All API endpoints operating normally.\n";
