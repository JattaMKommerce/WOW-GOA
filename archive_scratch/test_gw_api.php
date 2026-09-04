<?php
$_SERVER['REQUEST_METHOD'] = 'GET';
$_GET['resource'] = 'payment_gateways';

ob_start();
require __DIR__ . '/../backend/api.php';
$output = ob_get_clean();

echo "Status / Output:\n" . $output . "\n";
