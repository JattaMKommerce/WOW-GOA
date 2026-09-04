<?php
$pdo = new PDO('sqlite:' . __DIR__ . '/../backend/database.sqlite');
foreach (['hotel_room_types', 'hotel_availability_calendar', 'hotel_payment_methods', 'vendor_wallets', 'wallet_transactions', 'coupons', 'add_ons'] as $t) {
    echo "\n=== SCHEMA: $t ===\n";
    foreach ($pdo->query("PRAGMA table_info($t)")->fetchAll(PDO::FETCH_ASSOC) as $c) {
        echo " - {$c['name']} ({$c['type']})\n";
    }
}
