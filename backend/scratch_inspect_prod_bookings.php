<?php
$token = 'eyJpZCI6InUtMSIsInVzZXJuYW1lIjoic3VwZXJhZG1pbiIsInJvbGUiOiJzdXBlcmFkbWluIiwidGVuYW50X2lkIjoiYWRtaW4iLCJ0aW1lIjoxNzg4NjEwOTk4LCJleHAiOjE3ODkyMTU3OTh9.1c49be3ee455d6a9ef749c75b3a3662ab145e6beb4363286a667182c9f45c8d1';

$urlC = "https://wowgoa.in/backend/api.php?resource=cars&auth_token=" . $token;
$cars = json_decode(shell_exec("curl.exe -s \"$urlC\""), true);
echo "=== CARS (" . count($cars) . ") ===\n";
foreach ($cars as $c) {
    echo "ID: " . $c['id'] . " | Name: " . $c['name'] . " | vendor_id: " . ($c['vendor_id'] ?? 'NULL') . "\n";
}

$urlB = "https://wowgoa.in/backend/api.php?resource=bikes&auth_token=" . $token;
$bikes = json_decode(shell_exec("curl.exe -s \"$urlB\""), true);
echo "\n=== BIKES (" . count($bikes) . ") ===\n";
foreach ($bikes as $b) {
    echo "ID: " . $b['id'] . " | Name: " . $b['name'] . " | vendor_id: " . ($b['vendor_id'] ?? 'NULL') . "\n";
}
