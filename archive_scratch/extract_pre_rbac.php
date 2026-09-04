<?php
$logFile = 'C:\\Users\\rajda\\.gemini\\antigravity-ide\\brain\\166a297e-0dbf-44f3-823e-815378a2f8a9\\.system_generated\\logs\\transcript.jsonl';
if (!file_exists($logFile)) {
    echo "Log file not found.\n";
    exit;
}

$handle = fopen($logFile, 'r');
$lastAppCode = null;
$lastNavbarCode = null;

while (($line = fgets($handle)) !== false) {
    if (strpos($line, 'App.jsx') !== false && strpos($line, 'write_to_file') !== false) {
        $data = json_decode($line, true);
        if ($data && isset($data['tool_calls'])) {
            foreach ($data['tool_calls'] as $tc) {
                if (isset($tc['parameters']['TargetFile']) && strpos($tc['parameters']['TargetFile'], 'App.jsx') !== false) {
                    if (isset($tc['parameters']['CodeContent'])) {
                        // Check if this was BEFORE RBAC
                        if (strpos($tc['parameters']['CodeContent'], 'ProtectedRoute') === false) {
                            $lastAppCode = $tc['parameters']['CodeContent'];
                        }
                    }
                }
            }
        }
    }
}
fclose($handle);

if ($lastAppCode) {
    file_put_contents(__DIR__ . '/last_good_app.jsx', $lastAppCode);
    echo "Found pre-RBAC App.jsx (" . strlen($lastAppCode) . " bytes)\n";
} else {
    echo "No pre-RBAC App.jsx found in write_to_file calls.\n";
}
