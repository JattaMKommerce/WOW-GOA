<?php
$_GET['resource'] = 'hotels';
ob_start();
require 'api.php';
$output = ob_get_clean();
echo "Hotels API output:\n" . substr($output, 0, 300) . "...\n";
?>
