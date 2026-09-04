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

echo "=== 1. FETCH LIVE LEADS ===\n";
$leads = json_decode(getUrl("$baseUrl?resource=leads"), true);
echo "Count of leads: " . count($leads) . "\n";
print_r($leads);

echo "\n=== 2. CREATE A LIVE INBOUND LEAD ===\n";
$createRes = postJson($baseUrl, [
    'action' => 'create_lead',
    'name' => 'Dr. Aakash Verma',
    'phone' => '+91 98205 11223',
    'email' => 'aakash.v@healthcorp.in',
    'source' => 'Hotel Enquiries',
    'service' => 'W Goa Beach Resort (3 Nights Villa)',
    'assigned_to' => 'Rajesh Admin',
    'status' => 'New',
    'budget' => '₹75,000',
    'notes' => 'Looking for ocean view villa with private pool.'
]);
echo "Create result: $createRes\n";
$newLead = json_decode($createRes, true);
$leadId = $newLead['id'] ?? 'LD-9999';

echo "\n=== 3. UPDATE LEAD STATUS TO QUALIFIED ===\n";
$statusRes = postJson($baseUrl, [
    'action' => 'update_lead_status',
    'id' => $leadId,
    'status' => 'Qualified'
]);
echo "Status update result: $statusRes\n";

echo "\n=== 4. UPDATE LEAD ASSIGNEE ===\n";
$assigneeRes = postJson($baseUrl, [
    'action' => 'update_lead_assignee',
    'id' => $leadId,
    'assigned_to' => 'Sneha Agent'
]);
echo "Assignee update result: $assigneeRes\n";

echo "\n=== 5. UPDATE LEAD NOTES ===\n";
$notesRes = postJson($baseUrl, [
    'action' => 'update_lead',
    'id' => $leadId,
    'notes' => 'Customer called back. Requested late checkout and airport pickup.'
]);
echo "Notes update result: $notesRes\n";

echo "\n=== 6. VERIFY FINAL LEADS LIST ===\n";
$leadsAfter = json_decode(getUrl("$baseUrl?resource=leads"), true);
echo "Total leads in DB: " . count($leadsAfter) . "\n";
foreach ($leadsAfter as $l) {
    echo "• [{$l['id']}] {$l['name']} | {$l['source']} | {$l['service']} | {$l['assigned_to']} | {$l['status']} | Budget: {$l['budget']}\n";
}
