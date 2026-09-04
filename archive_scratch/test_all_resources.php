<?php
$resources = ['payment_gateways', 'subscription_plans', 'admin_subscriptions', 'commission_rules', 'settlements', 'wallets', 'site_configs', 'global_settings'];

foreach ($resources as $res) {
    $_SERVER['REQUEST_METHOD'] = 'GET';
    $_GET['resource'] = $res;
    
    // We can run inline query check
    require_once __DIR__ . '/../backend/config.php';
    $pdo = new PDO("sqlite:" . __DIR__ . '/../backend/database.sqlite');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "Testing resource: $res ... ";
    try {
        if ($res === 'payment_gateways') {
            $data = $pdo->query("SELECT * FROM payment_gateways")->fetchAll(PDO::FETCH_ASSOC);
        } elseif ($res === 'subscription_plans') {
            $data = $pdo->query("SELECT * FROM subscription_plans")->fetchAll(PDO::FETCH_ASSOC);
        } elseif ($res === 'admin_subscriptions') {
            $data = $pdo->query("SELECT * FROM admin_subscriptions")->fetchAll(PDO::FETCH_ASSOC);
        } elseif ($res === 'commission_rules') {
            $data = $pdo->query("SELECT * FROM commission_rules")->fetchAll(PDO::FETCH_ASSOC);
        } elseif ($res === 'settlements') {
            $data = $pdo->query("SELECT * FROM settlements")->fetchAll(PDO::FETCH_ASSOC);
        } elseif ($res === 'wallets') {
            $data = $pdo->query("SELECT * FROM wallets")->fetchAll(PDO::FETCH_ASSOC);
        } elseif ($res === 'site_configs') {
            $data = $pdo->query("SELECT * FROM site_configs")->fetch(PDO::FETCH_ASSOC);
        } elseif ($res === 'global_settings') {
            $data = $pdo->query("SELECT * FROM global_settings")->fetch(PDO::FETCH_ASSOC);
        }
        echo "OK (" . (is_array($data) ? count($data) . " items" : "obj") . ")\n";
    } catch (Exception $e) {
        echo "FAILED: " . $e->getMessage() . "\n";
    }
}
