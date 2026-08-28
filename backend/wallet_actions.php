<?php
        if ($action === 'verify_booking_payment') {
            $booking_id = $payload['booking_id'];
            $vendor_id = $payload['vendor_id'];
            $stmt = $pdo->prepare("UPDATE bookings SET payment_status = 'Verified' WHERE id = ? AND vendor_id = ?");
            $stmt->execute([$booking_id, $vendor_id]);
            echo json_encode(["success" => true, "message" => "Payment verified successfully."]);
            exit;

        } elseif ($action === 'reject_booking_payment') {
            $booking_id = $payload['booking_id'];
            $vendor_id = $payload['vendor_id'];
            $stmt = $pdo->prepare("UPDATE bookings SET payment_status = 'Rejected' WHERE id = ? AND vendor_id = ?");
            $stmt->execute([$booking_id, $vendor_id]);
            echo json_encode(["success" => true, "message" => "Payment rejected successfully."]);
            exit;

        } elseif ($action === 'confirm_booking') {
            $booking_id = $payload['booking_id'];
            $vendor_id = $payload['vendor_id'];
            
            // 1. Get Booking details
            $stmt = $pdo->prepare("SELECT * FROM bookings WHERE id = ? AND vendor_id = ?");
            $stmt->execute([$booking_id, $vendor_id]);
            $booking = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$booking) {
                throw new Exception("Booking not found.");
            }
            if ($booking['booking_status'] === 'Confirmed') {
                throw new Exception("Booking already confirmed.");
            }
            
            // 2. Calculate Commission (using 10% as default placeholder if not set)
            $total_amount = $booking['total_amount'] ?? 0;
            $commission_amount = $total_amount * 0.10; // 10%
            
            // 3. Update Booking
            $stmt = $pdo->prepare("UPDATE bookings SET booking_status = 'Confirmed', commission_amount = ? WHERE id = ?");
            $stmt->execute([$commission_amount, $booking_id]);
            
            // 4. Deduct from Vendor Wallet
            $stmt = $pdo->prepare("SELECT * FROM wallets WHERE vendor_id = ?");
            $stmt->execute([$vendor_id]);
            $wallet = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$wallet) {
                // Auto-create wallet if missing
                $wallet_id = uniqid('wall_');
                $stmt = $pdo->prepare("INSERT INTO wallets (id, vendor_id, admin_id, balance, updated_at) VALUES (?, ?, ?, 0.00, NOW())");
                $stmt->execute([$wallet_id, $vendor_id, $booking['admin_id']]);
                $wallet = ['id' => $wallet_id, 'balance' => 0.00];
            }
            
            $new_balance = $wallet['balance'] - $commission_amount;
            $stmt = $pdo->prepare("UPDATE wallets SET balance = ?, updated_at = NOW() WHERE vendor_id = ?");
            $stmt->execute([$new_balance, $vendor_id]);
            
            // 5. Log Transaction
            $trans_id = uniqid('txn_');
            $stmt = $pdo->prepare("INSERT INTO wallet_transactions (id, wallet_id, admin_id, amount, type, description, reference_id, created_at) VALUES (?, ?, ?, ?, 'debit', 'Commission deducted for booking', ?, NOW())");
            $stmt->execute([$trans_id, $wallet['id'], $booking['admin_id'], $commission_amount, $booking_id]);
            
            echo json_encode(["success" => true, "message" => "Booking confirmed and commission deducted."]);
            exit;

        } elseif ($action === 'request_settlement') {
            $vendor_id = $payload['vendor_id'];
            $amount = $payload['amount'];
            $bank_details = $payload['bank_details'];
            $admin_id = $tenant_id;
            
            // Check wallet balance (for payouts, vendor needs positive balance? Wait, if they receive payments directly, they owe the admin commission. If admin receives payments, admin owes vendor. We assume vendor receives payment, hence negative balance means they owe admin. If vendor requests settlement, it means admin collected payment. Let's assume vendor wants to withdraw positive balance.)
            $stmt = $pdo->prepare("SELECT balance FROM wallets WHERE vendor_id = ?");
            $stmt->execute([$vendor_id]);
            $wallet = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$wallet || $wallet['balance'] < $amount) {
                throw new Exception("Insufficient wallet balance for settlement.");
            }
            
            $settle_id = uniqid('stl_');
            $stmt = $pdo->prepare("INSERT INTO settlements (id, vendor_id, admin_id, amount, status, bank_details, created_at, updated_at) VALUES (?, ?, ?, ?, 'pending', ?, NOW(), NOW())");
            $stmt->execute([$settle_id, $vendor_id, $admin_id, $amount, $bank_details]);
            
            // Deduct requested amount from wallet to prevent double withdrawal
            $new_balance = $wallet['balance'] - $amount;
            $stmt = $pdo->prepare("UPDATE wallets SET balance = ?, updated_at = NOW() WHERE vendor_id = ?");
            $stmt->execute([$new_balance, $vendor_id]);
            
            // Log Txn
            $trans_id = uniqid('txn_');
            $stmt = $pdo->prepare("INSERT INTO wallet_transactions (id, wallet_id, admin_id, amount, type, description, reference_id, created_at) VALUES (?, ?, ?, ?, 'debit', 'Settlement requested', ?, NOW())");
            $stmt->execute([$trans_id, $wallet['id'], $admin_id, $amount, $settle_id]);
            
            echo json_encode(["success" => true, "message" => "Settlement requested successfully."]);
            exit;

        } elseif ($action === 'approve_settlement') {
            $settle_id = $payload['settle_id'];
            $stmt = $pdo->prepare("UPDATE settlements SET status = 'completed', updated_at = NOW() WHERE id = ?");
            $stmt->execute([$settle_id]);
            echo json_encode(["success" => true, "message" => "Settlement approved."]);
            exit;

        } elseif ($action === 'top_up_wallet') {
            $vendor_id = $payload['vendor_id'];
            $amount = $payload['amount'];
            
            $stmt = $pdo->prepare("SELECT * FROM wallets WHERE vendor_id = ?");
            $stmt->execute([$vendor_id]);
            $wallet = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$wallet) {
                $wallet_id = uniqid('wall_');
                $stmt = $pdo->prepare("INSERT INTO wallets (id, vendor_id, admin_id, balance, updated_at) VALUES (?, ?, ?, 0.00, NOW())");
                $stmt->execute([$wallet_id, $vendor_id, 'admin']);
                $wallet = ['id' => $wallet_id, 'balance' => 0.00];
            }
            
            $new_balance = $wallet['balance'] + $amount;
            $stmt = $pdo->prepare("UPDATE wallets SET balance = ?, updated_at = NOW() WHERE vendor_id = ?");
            $stmt->execute([$new_balance, $vendor_id]);
            
            $trans_id = uniqid('txn_');
            $stmt = $pdo->prepare("INSERT INTO wallet_transactions (id, wallet_id, admin_id, amount, type, description, reference_id, created_at) VALUES (?, ?, ?, ?, 'credit', 'Manual Wallet Top Up', ?, NOW())");
            $stmt->execute([$trans_id, $wallet['id'], 'admin', $amount, 'topup']);
            
            echo json_encode(["success" => true, "message" => "Wallet topped up successfully."]);
            exit;
        } else {
            http_response_code(404);
            echo json_encode(["error" => "Action not found.", "received" => $action, "payload_action" => $payload['action'] ?? 'missing', "raw" => $raw_input]);
        }
?>
