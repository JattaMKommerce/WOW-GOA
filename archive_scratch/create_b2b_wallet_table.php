<?php
$pdo = new PDO('sqlite:' . __DIR__ . '/../backend/database.sqlite');
$pdo->exec("CREATE TABLE IF NOT EXISTS b2b_wallet_transactions (
    id VARCHAR(64) PRIMARY KEY,
    partner_id VARCHAR(50) NOT NULL,
    transaction_type VARCHAR(30) NOT NULL,
    flow_type VARCHAR(10) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    balance_before DECIMAL(10,2) NOT NULL,
    balance_after DECIMAL(10,2) NOT NULL,
    booking_id VARCHAR(50) DEFAULT NULL,
    payment_gateway_ref VARCHAR(100) DEFAULT NULL,
    payment_method VARCHAR(50) DEFAULT 'Prepaid Wallet',
    description TEXT,
    status VARCHAR(20) DEFAULT 'COMPLETED',
    created_by VARCHAR(50) DEFAULT 'SYSTEM',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    idempotency_key VARCHAR(100) DEFAULT NULL
);");
echo "b2b_wallet_transactions table verified/created successfully!\n";
