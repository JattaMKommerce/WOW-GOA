<?php
$baseUrl = 'http://localhost:8000/api.php';

function apiReq($url, $method = 'GET', $data = null) {
    $opts = [
        'http' => [
            'method' => $method,
            'header' => "Content-Type: application/json\r\nX-Tenant-ID: admin\r\n",
            'ignore_errors' => true
        ]
    ];
    if ($method === 'POST' && $data !== null) {
        $opts['http']['content'] = json_encode($data);
    }
    $ctx = stream_context_create($opts);
    $res = file_get_contents($url, false, $ctx);
    return ['body' => json_decode($res, true), 'raw' => $res];
}

echo "=== 1. FETCH PACKAGES INITIAL CHECK ===\n";
$getRes = apiReq($baseUrl . '?resource=packages');
$pkgs = $getRes['body'];
echo "Package count: " . count($pkgs) . "\n";
assert(count($pkgs) === 2, "Expected 2 initial packages");

foreach ($pkgs as $p) {
    echo " - [{$p['id']}] {$p['name']} (₹{$p['price']})\n";
    echo "   Image: {$p['image']}\n";
    echo "   ImageUrl: {$p['imageUrl']}\n";
    assert(!empty($p['image']), "Image field must not be empty");
    assert(!empty($p['imageUrl']), "ImageUrl field must not be empty");
    assert(!empty($p['image_url']), "image_url field must not be empty");
    if ($p['id'] === 'package-2') {
        assert(strpos($p['image'], 'photo-1533759413974-9e15f3b745ac') === false, "Bathtub photo must NOT be present on package-2!");
        echo "   Verified: Romantic Sunset Escape does NOT have bathtub image!\n";
    }
}

echo "\n=== 2. ADD PACKAGE TEST ===\n";
$newPkg = [
    'action' => 'add_package',
    'id' => 'test-pkg-' . time(),
    'name' => 'Goa Monsoon Magic Cruise',
    'duration' => '5 Days / 4 Nights',
    'price' => 38999,
    'description' => 'A wonderful monsoon getaway across the rivers and spice plantations of Goa.',
    'image' => 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=800',
    'package_type' => 'Trip Package',
    'destination' => 'North Goa'
];
$addRes = apiReq($baseUrl, 'POST', $newPkg);
echo "Add response: " . json_encode($addRes['body']) . "\n";
assert($addRes['body']['success'] === true, "Add package must succeed");

$getAfterAdd = apiReq($baseUrl . '?resource=packages');
echo "Package count after add: " . count($getAfterAdd['body']) . "\n";
assert(count($getAfterAdd['body']) === 3, "Expected 3 packages after add");

echo "\n=== 3. UPDATE PACKAGE TEST ===\n";
$updatePkg = [
    'action' => 'update_package',
    'id' => $newPkg['id'],
    'name' => 'Goa Monsoon Magic Cruise - UPDATED',
    'duration' => '6 Days / 5 Nights',
    'price' => 45000,
    'description' => 'Updated luxury description.',
    'image' => 'https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?w=800',
    'package_type' => 'Trip Package'
];
$updRes = apiReq($baseUrl, 'POST', $updatePkg);
echo "Update response: " . json_encode($updRes['body']) . "\n";
assert($updRes['body']['success'] === true, "Update package must succeed");

$getAfterUpd = apiReq($baseUrl . '?resource=packages');
$foundUpdated = false;
foreach ($getAfterUpd['body'] as $p) {
    if ($p['id'] === $newPkg['id']) {
        $foundUpdated = true;
        echo "Found updated package: {$p['name']} - ₹{$p['price']} (Image: {$p['image']})\n";
        assert($p['price'] == 45000, "Price must be updated");
        assert($p['name'] === 'Goa Monsoon Magic Cruise - UPDATED', "Name must be updated");
    }
}
assert($foundUpdated, "Updated package must be found");

echo "\n=== 4. DELETE PACKAGE TEST ===\n";
$delRes = apiReq($baseUrl, 'POST', ['action' => 'delete_package', 'id' => $newPkg['id']]);
echo "Delete response: " . json_encode($delRes['body']) . "\n";
assert($delRes['body']['success'] === true, "Delete package must succeed");

$getAfterDel = apiReq($baseUrl . '?resource=packages');
echo "Package count after delete: " . count($getAfterDel['body']) . "\n";
assert(count($getAfterDel['body']) === 2, "Expected exactly 2 packages after delete");

echo "\n=== ALL REAL-TIME CRUD TESTS PASSED SUCCESSFULLY! ===\n";
