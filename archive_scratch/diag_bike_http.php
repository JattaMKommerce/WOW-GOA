<?php
$payload = [
    'action' => 'add_vehicle',
    'type' => 'bike',
    'id' => 'bike-http-diag',
    'name' => 'TVS XL 100 Multi',
    'price' => 300,
    'category' => 'Scooter',
    'fuel' => 'Petrol',
    'engine' => '100cc',
    'mileage' => '40 km/l',
    'images' => [
        'http://localhost:8000/uploads/xl100_1.png',
        'http://localhost:8000/uploads/xl100_2.png'
    ],
    'location' => 'Goa Delivery'
];

$content = json_encode($payload);
$options = [
    'http' => [
        'header'  => "Content-Type: application/json\r\n" .
                     "Connection: close\r\n" .
                     "X-Tenant-ID: admin\r\n",
        'method'  => 'POST',
        'content' => $content,
        'timeout' => 5,
        'ignore_errors' => true
    ]
];
$context = stream_context_create($options);
$result = file_get_contents('http://localhost:8000/api.php', false, $context);
echo "RESPONSE:\n" . $result . "\n";

$pdo = new PDO('sqlite:' . __DIR__ . '/../backend/database.sqlite');
$pdo->exec("DELETE FROM bikes WHERE id = 'bike-http-diag'");
