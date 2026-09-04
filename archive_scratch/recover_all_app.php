<?php
$fullLog = 'C:\\Users\\rajda\\.gemini\\antigravity-ide\\brain\\166a297e-0dbf-44f3-823e-815378a2f8a9\\.system_generated\\logs\\transcript_full.jsonl';
$handle = fopen($fullLog, 'r');
$appChunks = [];

while (($line = fgets($handle)) !== false) {
    $data = json_decode($line, true);
    $step = $data['step_index'] ?? 0;
    if ($step < 900) {
        $content = $data['content'] ?? '';
        if (strpos($content, 'File Path: `file:///d:/wow%20goa/Tripgalileo%20%282%29/Tripgalileo/frontend/src/App.jsx`') !== false ||
            strpos($content, 'File Path: `file:///d:/wow goa/Tripgalileo (2)/Tripgalileo/frontend/src/App.jsx`') !== false) {
            if (preg_match_all('/^(\d+):\s*(.*)$/m', $content, $matches, PREG_SET_ORDER)) {
                foreach ($matches as $m) {
                    $lineNum = intval($m[1]);
                    $codeLine = $m[2];
                    $appChunks[$lineNum] = $codeLine;
                }
            }
        }
    }
}
fclose($handle);

echo "Total distinct lines from view_file on App.jsx: " . count($appChunks) . "\n";
if (count($appChunks) > 0) {
    ksort($appChunks);
    $recoveredCode = implode("\n", $appChunks);
    file_put_contents(__DIR__ . '/pre_rbac_app_complete.jsx', $recoveredCode);
    echo "Saved to pre_rbac_app_complete.jsx (" . strlen($recoveredCode) . " bytes)\n";
    $missing = [];
    $keys = array_keys($appChunks);
    $max = max($keys);
    for ($i = 1; $i <= $max; $i++) {
        if (!isset($appChunks[$i])) $missing[] = $i;
    }
    echo "Missing line numbers: " . (count($missing) > 0 ? implode(', ', array_slice($missing, 0, 50)) . '...' : 'NONE') . "\n";
}
