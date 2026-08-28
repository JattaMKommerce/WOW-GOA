<?php
$content = file_get_contents('api.php');
// Simple regex to insert exit; after any echo json_encode(...) that isn't already followed by exit;
$content = preg_replace('/(echo json_encode\([^;]+;)\s*(?!exit;)/', "$1\n            exit;", $content);
file_put_contents('api.php', $content);
echo "Fixed missing exits.";
