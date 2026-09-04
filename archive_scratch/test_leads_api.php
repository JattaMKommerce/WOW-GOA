<?php
$baseUrl = 'http://localhost:8000/api.php';

function getUrl($url) {
    return file_get_contents($url);
}

function postJson($url, $data) {
    $options = [
        'http' => [
            'header'  => "Content-type: application/json\r\n",
            'method'  => 'POST',
            'content' => json_encode($data),
            'ignore_errors' => true
        ]
    ];
    $context = stream_context_create($options);
    return file_get_contents($url, false, $context);
}

echo "1. Testing GET /api.php?resource=leads...\n";
$res = getUrl("$baseUrl?resource=leads");
echo "Leads: $res\n\n";

echo "2. Testing POST create_lead...\n";
$leadPayload = [
    'action' => 'create_lead',
    'id' => 'LD-9999',
    'name' => 'Raj Dalabanjan',
    'phone' => '+91 9916933476',
    'email' => 'rajdalabanjan143@gmail.com',
    'source' => 'Hotel Enquiries',
    'service' => 'Taj Fort Aguada Resort & Spa (3 Nights Deluxe Sea View)',
    'assigned_to' => 'Rajesh Admin',
    'status' => 'New',
    'budget' => '₹50,000',
    'notes' => 'Looking for luxury beachfront stay'
];
$res = postJson($baseUrl, $leadPayload);
echo "Create result: $res\n\n";

echo "3. Testing GET /api.php?resource=leads after insert...\n";
$res = getUrl("$baseUrl?resource=leads");
echo "Leads in DB: $res\n\n";

echo "4. Testing update_lead_status...\n";
$res = postJson($baseUrl, [
    'action' => 'update_lead_status',
    'id' => 'LD-9999',
    'status' => 'In Progress'
]);
echo "Update result: $res\n\n";

echo "5. Testing GET after update...\n";
$res = getUrl("$baseUrl?resource=leads");
echo "Leads in DB: $res\n\n";
