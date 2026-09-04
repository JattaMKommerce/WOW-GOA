<?php
$payload = json_encode(['action' => 'b2b_approve_partner', 'partner_id' => 'b2b_6a99006753753']);
$ch = curl_init('http://localhost:8000/api.php?action=b2b_approve_partner');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
$res = curl_exec($ch);
echo "Response:\n" . $res . "\n";
curl_close($ch);
