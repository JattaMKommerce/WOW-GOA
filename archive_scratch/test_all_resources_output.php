<?php
$resources = ['hotels', 'cars', 'bikes', 'packages', 'bookings', 'users', 'drivers', 'leads'];
foreach ($resources as $res) {
    $_SERVER['REQUEST_METHOD'] = 'GET';
    $_GET = ['resource' => $res];
    ob_start();
    include __DIR__ . '/../backend/api.php';
    $out = ob_get_clean();
    $data = json_decode($out, true);
    $count = is_array($data) ? count($data) : 'NOT JSON / ERROR';
    echo sprintf("%-15s : %s items returned by api.php\n", $res, is_numeric($count) ? "$count rows" : $count);
}
