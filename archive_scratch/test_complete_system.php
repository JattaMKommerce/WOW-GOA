<?php
// Complete End-to-End Automated Test Suite for WOW GOA B2B Engine
$baseUrl = 'http://localhost:8000/api.php';
$partnerId = 'b2b_6a99006753753'; // Raj Dalabanjan

function request($method, $url, $payload = null, $partnerId = null) {
    $headerLines = "Content-Type: application/json\r\n";
    if ($partnerId) {
        $headerLines .= "Authorization: Bearer $partnerId\r\n";
    }

    $options = [
        'http' => [
            'method' => $method,
            'header' => $headerLines,
            'ignore_errors' => true,
            'timeout' => 10
        ]
    ];

    if ($payload) {
        $options['http']['content'] = json_encode($payload);
    }

    $context = stream_context_create($options);
    $res = @file_get_contents($url, false, $context);
    
    // Parse HTTP response code cleanly
    $status = 0;
    $headers = function_exists('http_get_last_response_headers') ? http_get_last_response_headers() : ($http_response_header ?? []);
    if (is_array($headers)) {
        foreach ($headers as $hdr) {
            if (preg_match('#HTTP/\S+\s+(\d+)#', $hdr, $m)) {
                $status = intval($m[1]);
                break;
            }
        }
    }

    return ['status' => $status, 'data' => json_decode($res, true), 'raw' => $res];
}

echo "========================================================\n";
echo "       WOW GOA B2B ENGINE - FULL SYSTEM TEST RUN        \n";
echo "========================================================\n\n";

$testsPassed = 0;
$testsTotal = 0;

function assertTest($name, $condition, $details = '') {
    global $testsPassed, $testsTotal;
    $testsTotal++;
    if ($condition) {
        $testsPassed++;
        echo "✅ PASS: $name\n";
    } else {
        echo "❌ FAIL: $name\n";
        if ($details) echo "   Details: $details\n";
    }
}

// 1. SERVICE DISCOVERY INVENTORIES
$bikesRes = request('GET', "$baseUrl?resource=bikes");
assertTest("1.1 Live Bikes Inventory Query", $bikesRes['status'] === 200 && is_array($bikesRes['data']) && count($bikesRes['data']) >= 6, "Count: " . count($bikesRes['data'] ?? []));

$carsRes = request('GET', "$baseUrl?resource=cars");
assertTest("1.2 Live Cars Inventory Query", $carsRes['status'] === 200 && is_array($carsRes['data']) && count($carsRes['data']) >= 7, "Count: " . count($carsRes['data'] ?? []));

$hotelsRes = request('GET', "$baseUrl?resource=hotels");
assertTest("1.3 Live Hotels Inventory Query", $hotelsRes['status'] === 200 && is_array($hotelsRes['data']) && count($hotelsRes['data']) >= 4, "Count: " . count($hotelsRes['data'] ?? []));

$pkgsRes = request('GET', "$baseUrl?resource=packages");
assertTest("1.4 Live Packages Inventory Query", $pkgsRes['status'] === 200 && is_array($pkgsRes['data']) && count($pkgsRes['data']) >= 3, "Count: " . count($pkgsRes['data'] ?? []));

// 2. B2B PRICING MODES (Commission vs Net)
$bikeItem = $bikesRes['data'][0];
$commPriceRes = request('GET', "$baseUrl?resource=b2b_pricing_preview&service_type=vehicle&item_id={$bikeItem['id']}&days=2&mode=COMMISSION", null, $partnerId);
assertTest("2.1 Commission Mode Price Preview", $commPriceRes['status'] === 200 && isset($commPriceRes['data']['pricing']['b2b_commission_amount']) && $commPriceRes['data']['pricing']['b2b_commission_amount'] > 0);

$netPriceRes = request('GET', "$baseUrl?resource=b2b_pricing_preview&service_type=vehicle&item_id={$bikeItem['id']}&days=2&mode=NON_COMMISSION", null, $partnerId);
assertTest("2.2 Non-Commission Net Mode Price Preview", $netPriceRes['status'] === 200 && isset($netPriceRes['data']['pricing']['b2b_net_discount_percentage']) && $netPriceRes['data']['pricing']['final_payable_amount'] < $netPriceRes['data']['pricing']['original_reference_price']);

// 3. PREPAID AGENT WALLET RECHARGE & IDEMPOTENCY
$walletRes0 = request('GET', "$baseUrl?resource=b2b_wallet&partner_id=$partnerId", null, $partnerId);
$balStart = floatval($walletRes0['data']['wallet_balance'] ?? 0);

$testIdempKey = "test_run_" . uniqid();
$recPayload = [
    'action' => 'b2b_wallet_recharge',
    'amount' => 15000,
    'payment_method' => 'UPI',
    'payment_gateway_ref' => 'UPI_E2E_' . rand(100000, 999999),
    'idempotency_key' => $testIdempKey
];
$rec1 = request('POST', "$baseUrl?action=b2b_wallet_recharge", $recPayload, $partnerId);
assertTest("3.1 Prepaid Wallet Recharge (₹15,000 credited)", $rec1['status'] === 200 && $rec1['data']['success'] === true);

// Duplicate payment prevention
$rec2 = request('POST', "$baseUrl?action=b2b_wallet_recharge", $recPayload, $partnerId);
assertTest("3.2 Duplicate Recharge Prevention via Idempotency", $rec2['status'] === 200 && stripos($rec2['data']['message'], 'already') !== false);

// Wallet Ledger Check
$walletRes = request('GET', "$baseUrl?resource=b2b_wallet&partner_id=$partnerId", null, $partnerId);
$balBeforeBook = floatval($walletRes['data']['wallet_balance'] ?? 0);
assertTest("3.3 Wallet Ledger Verification", $walletRes['status'] === 200 && count($walletRes['data']['transactions']) > 0 && abs($balBeforeBook - ($balStart + 15000)) < 1.0);

// 4. BOOKING WITH ATOMIC WALLET DEBIT
$uniqueGuestPhone = '91' . rand(10000000, 99999999);
$pickupDate = '2026-11-' . str_pad(rand(1, 20), 2, '0', STR_PAD_LEFT);
$dropDate = '2026-11-' . str_pad(intval(substr($pickupDate, -2)) + 2, 2, '0', STR_PAD_LEFT);

$bookPayload = [
    'action' => 'b2b_book',
    'b2b_partner_id' => $partnerId,
    'b2b_mode' => 'COMMISSION',
    'service_type' => 'vehicle',
    'item_id' => $bikeItem['id'],
    'guest_name' => 'Automated Test Rider',
    'guest_phone' => $uniqueGuestPhone,
    'pickup_date' => $pickupDate,
    'drop_date' => $dropDate,
    'days' => 2,
    'payment_method' => 'Prepaid Agent Wallet'
];
$bookRes = request('POST', "$baseUrl?action=b2b_book", $bookPayload, $partnerId);
assertTest("4.1 Booking with Atomic Wallet Deduction", $bookRes['status'] === 200 && $bookRes['data']['success'] === true && !empty($bookRes['data']['booking_id']), $bookRes['raw']);
$confirmedBookingId = $bookRes['data']['booking_id'] ?? null;
$bookedAmount = floatval($bookRes['data']['pricing_snapshot']['final_payable_amount'] ?? 0);

// Verify Wallet Balance was decremented
$walletAfterBook = request('GET', "$baseUrl?resource=b2b_wallet&partner_id=$partnerId", null, $partnerId);
$balAfterBook = floatval($walletAfterBook['data']['wallet_balance'] ?? 0);
assertTest("4.2 Atomic Wallet Debit Verification", abs($balAfterBook - ($balBeforeBook - $bookedAmount)) < 1.0, "Expected: " . ($balBeforeBook - $bookedAmount) . ", Got: $balAfterBook");

// 5. ANTI-DOUBLE BOOKING CONCURRENCY PROTECTION
$doubleBookRes = request('POST', "$baseUrl?action=b2b_book", $bookPayload, $partnerId);
assertTest("5.1 Anti-Double Booking Prevention (Same Dates)", $doubleBookRes['status'] === 400 && stripos($doubleBookRes['data']['error'] ?? '', 'already reserved') !== false, "Error: " . ($doubleBookRes['data']['error'] ?? ''));

// Overlapping dates
$bookPayloadOverlap = $bookPayload;
$bookPayloadOverlap['pickup_date'] = date('Y-m-d', strtotime($pickupDate . ' +1 day'));
$bookPayloadOverlap['drop_date'] = date('Y-m-d', strtotime($dropDate . ' +1 day'));
$overlapRes = request('POST', "$baseUrl?action=b2b_book", $bookPayloadOverlap, $partnerId);
assertTest("5.2 Anti-Double Booking Prevention (Overlapping Dates)", $overlapRes['status'] === 400 && stripos($overlapRes['data']['error'] ?? '', 'already reserved') !== false);

// 6. INSUFFICIENT BALANCE SAFEGUARD
$hugeBookPayload = [
    'action' => 'b2b_book',
    'b2b_partner_id' => $partnerId,
    'b2b_mode' => 'COMMISSION',
    'service_type' => 'package',
    'item_id' => $pkgsRes['data'][0]['id'],
    'qty' => 50,
    'guests' => 50, // 50 guests * ₹14,999 = ₹749,950
    'guest_name' => 'High Rollers Group',
    'guest_phone' => '9123456789',
    'payment_method' => 'Prepaid Agent Wallet'
];
$insufRes = request('POST', "$baseUrl?action=b2b_book", $hugeBookPayload, $partnerId);
assertTest("6.1 Insufficient Balance Prevention", $insufRes['status'] === 400 && stripos($insufRes['data']['error'] ?? '', 'Insufficient') !== false, "Got: " . ($insufRes['data']['error'] ?? ''));

// 7. CANCELLATION & AUTOMATIC REFUND FLOW
if ($confirmedBookingId) {
    $cancelRes = request('POST', "$baseUrl?action=b2b_cancel_booking", [
        'action' => 'b2b_cancel_booking',
        'booking_id' => $confirmedBookingId,
        'reason' => 'E2E Automated test cancellation'
    ], $partnerId);
    assertTest("7.1 Booking Cancellation & Automatic Refund", $cancelRes['status'] === 200 && $cancelRes['data']['success'] === true && $cancelRes['data']['refund_amount'] > 0);

    // Verify refund reached wallet
    $walletAfterRefund = request('GET', "$baseUrl?resource=b2b_wallet&partner_id=$partnerId", null, $partnerId);
    $balRefunded = floatval($walletAfterRefund['data']['wallet_balance'] ?? 0);
    assertTest("7.2 Refund Credited Back to Wallet Balance", abs($balRefunded - $balBeforeBook) < 1.0, "Expected: $balBeforeBook, Got: $balRefunded");
}

// 8. ADMIN MANUAL ADJUSTMENT AUDIT
$adjRes = request('POST', "$baseUrl?action=b2b_admin_adjust_wallet", [
    'action' => 'b2b_admin_adjust_wallet',
    'partner_id' => $partnerId,
    'adjustment_type' => 'CREDIT',
    'amount' => 2500,
    'reason' => 'Admin manual incentive bonus credit'
]);
assertTest("8.1 Admin Manual Wallet Credit (+₹2,500)", $adjRes['status'] === 200 && $adjRes['data']['success'] === true);

$adjDebitRes = request('POST', "$baseUrl?action=b2b_admin_adjust_wallet", [
    'action' => 'b2b_admin_adjust_wallet',
    'partner_id' => $partnerId,
    'adjustment_type' => 'DEBIT',
    'amount' => 1000,
    'reason' => 'Admin manual fee debit adjustment'
]);
assertTest("8.2 Admin Manual Wallet Debit (-₹1,000)", $adjDebitRes['status'] === 200 && $adjDebitRes['data']['success'] === true);

// 9. AUDIT LOG & NOTIFICATION VERIFICATION
$notifRes = request('GET', "$baseUrl?resource=b2b_notifications&b2b_partner_id=$partnerId");
assertTest("9.1 Real-Time Partner Notifications Recorded", $notifRes['status'] === 200 && count($notifRes['data']['notifications'] ?? []) > 0);

$auditRes = request('GET', "$baseUrl?resource=b2b_audit_logs", null, $partnerId);
assertTest("9.2 B2B Audit Logs Recorded", $auditRes['status'] === 200 && count($auditRes['data'] ?? []) > 0);

echo "\n========================================================\n";
echo "TEST RESULTS: $testsPassed / $testsTotal Passed (" . round(($testsPassed / $testsTotal) * 100) . "%)\n";
echo "========================================================\n";
