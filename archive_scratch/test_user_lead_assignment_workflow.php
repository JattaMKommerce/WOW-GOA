<?php
$baseUrl = 'http://localhost:8000/api.php';

function getUrl($url, $headers = []) {
    $headerStr = "";
    foreach ($headers as $k => $v) {
        $headerStr .= "$k: $v\r\n";
    }
    $options = [
        'http' => [
            'header'  => $headerStr,
            'method'  => 'GET',
            'ignore_errors' => true
        ]
    ];
    $context = stream_context_create($options);
    return file_get_contents($url, false, $context);
}

function postJson($url, $data, $headers = []) {
    $headerStr = "Content-type: application/json\r\n";
    foreach ($headers as $k => $v) {
        $headerStr .= "$k: $v\r\n";
    }
    $options = [
        'http' => [
            'header'  => $headerStr,
            'method'  => 'POST',
            'content' => json_encode($data),
            'ignore_errors' => true
        ]
    ];
    $context = stream_context_create($options);
    return file_get_contents($url, false, $context);
}

echo "======================================================\n";
echo "TEST 1: CREATE SUB-ADMIN & TOGGLE STATUS\n";
echo "======================================================\n";
$userRes = postJson($baseUrl, [
    'action' => 'register_user',
    'name' => 'Vikram SubAdmin',
    'username' => 'vikram_subadmin',
    'email' => 'vikram.sub@tripgalileo.com',
    'phone' => '+91 99881 22334',
    'role' => 'subadmin',
    'status' => 'active',
    'password' => 'Pass@123'
]);
echo "Create User Result: $userRes\n";
$userData = json_decode($userRes, true);
$userId = $userData['user_id'] ?? $userData['id'] ?? 'u-sub-test';

$toggleRes = postJson($baseUrl, [
    'action' => 'toggle_user_status',
    'id' => $userId,
    'status' => 'active'
]);
echo "Toggle Status Result: $toggleRes\n";

$assignableUsers = json_decode(getUrl("$baseUrl?resource=assignable_users"), true);
echo "Total Assignable Team Users: " . count($assignableUsers) . "\n";
foreach ($assignableUsers as $u) {
    echo " • [{$u['role']}] {$u['name']} (@{$u['username']}) — {$u['status']}\n";
}

echo "\n======================================================\n";
echo "TEST 2: CREATE INCOMING UNASSIGNED LEAD & ASSIGN IT\n";
echo "======================================================\n";
$leadRes = postJson($baseUrl, [
    'action' => 'create_lead',
    'id' => 'LD-1024',
    'name' => 'John Doe',
    'phone' => '+91 98765 00001',
    'email' => 'john.doe@gmail.com',
    'source' => 'Hotel Enquiries',
    'service' => 'Taj Exotica Resort (4 Nights Villa)',
    'assigned_to' => 'Unassigned',
    'status' => 'New',
    'budget' => '₹1,20,000',
    'notes' => 'Customer requested sea-facing luxury room.'
]);
echo "Create Lead Result: $leadRes\n";

// Assign lead to Vikram SubAdmin
$assignRes = postJson($baseUrl, [
    'action' => 'assign_lead',
    'id' => 'LD-1024',
    'assigned_to' => 'Vikram SubAdmin',
    'assigned_by' => 'Rajesh Admin'
]);
echo "Assign Lead Result: $assignRes\n";

echo "\n======================================================\n";
echo "TEST 3: SUB-ADMIN RBAC QUERY\n";
echo "======================================================\n";
$subAdminLeads = json_decode(getUrl("$baseUrl?resource=leads", [
    'X-User-Role' => 'subadmin',
    'X-User-Identifier' => 'Vikram SubAdmin'
]), true);
echo "SubAdmin (Vikram) visible leads count: " . count($subAdminLeads) . "\n";
foreach ($subAdminLeads as $l) {
    echo " • Lead #{$l['id']} — {$l['name']} | Assigned to: {$l['assigned_to']} | Status: {$l['status']}\n";
}

echo "\n======================================================\n";
echo "TEST 4: SUB-ADMIN POSTS COMMENT & UPDATES NEXT ACTION\n";
echo "======================================================\n";
$comment1Res = postJson($baseUrl, [
    'action' => 'add_lead_comment',
    'lead_id' => 'LD-1024',
    'comment' => 'Customer confirmed September 10–14. Should I proceed with hotel quotations?',
    'user_id' => $userId,
    'user_name' => 'Vikram SubAdmin',
    'user_role' => 'subadmin'
]);
echo "SubAdmin Comment Result: $comment1Res\n";

$nextActionRes = postJson($baseUrl, [
    'action' => 'update_next_action',
    'id' => 'LD-1024',
    'next_action' => 'Send hotel quotation tomorrow by 2 PM'
]);
echo "Next Action Result: $nextActionRes\n";

$statusUpdateRes = postJson($baseUrl, [
    'action' => 'update_lead_status',
    'id' => 'LD-1024',
    'status' => 'In Progress'
]);
echo "Status Update Result: $statusUpdateRes\n";

echo "\n======================================================\n";
echo "TEST 5: ADMIN REPLIES & REASSIGNS LEAD\n";
echo "======================================================\n";
$comment2Res = postJson($baseUrl, [
    'action' => 'add_lead_comment',
    'lead_id' => 'LD-1024',
    'comment' => 'Yes, proceed with the quotation. Include Taj Exotica and W Goa Beach Resort.',
    'user_id' => 'u-admin-1',
    'user_name' => 'Rajesh Admin',
    'user_role' => 'admin'
]);
echo "Admin Reply Result: $comment2Res\n";

$reassignRes = postJson($baseUrl, [
    'action' => 'assign_lead',
    'id' => 'LD-1024',
    'assigned_to' => 'Sneha Agent',
    'assigned_by' => 'Rajesh Admin'
]);
echo "Reassign Result: $reassignRes\n";

echo "\n======================================================\n";
echo "TEST 6: VERIFY FINAL LEAD DETAILS & COMMENTS FEED\n";
echo "======================================================\n";
$finalComments = json_decode(getUrl("$baseUrl?resource=lead_comments&lead_id=LD-1024"), true);
echo "Total comments for LD-1024: " . count($finalComments) . "\n";
foreach ($finalComments as $c) {
    echo " [{$c['user_name']} ({$c['user_role']}) at " . substr($c['created_at'], 11, 5) . "]: {$c['comment']}\n";
}

$allLeads = json_decode(getUrl("$baseUrl?resource=leads"), true);
foreach ($allLeads as $l) {
    if ($l['id'] === 'LD-1024') {
        echo "\nFINAL STATE OF LD-1024:\n";
        echo " • Customer: {$l['name']} ({$l['phone']})\n";
        echo " • Status: {$l['status']}\n";
        echo " • Assigned To: {$l['assigned_to']}\n";
        echo " • Assigned By: {$l['assigned_by']}\n";
        echo " • Assigned On: {$l['assigned_at']}\n";
        echo " • Next Action: {$l['next_action']}\n";
    }
}
