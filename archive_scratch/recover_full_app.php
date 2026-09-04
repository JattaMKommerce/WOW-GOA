<?php
$fullLog = 'C:\\Users\\rajda\\.gemini\\antigravity-ide\\brain\\166a297e-0dbf-44f3-823e-815378a2f8a9\\.system_generated\\logs\\transcript_full.jsonl';
if (!file_exists($fullLog)) {
    echo "Full log not found.\n";
    exit;
}

$handle = fopen($fullLog, 'r');
$allLines = [];

while (($line = fgets($handle)) !== false) {
    $data = json_decode($line, true);
    $step = $data['step_index'] ?? 0;
    if ($step < 900) {
        $content = $data['content'] ?? '';
        if (strpos($content, 'App.jsx') !== false && strpos($content, 'export default function App()') !== false) {
            if (preg_match_all('/^(\d+):\s*(.*)$/m', $content, $matches, PREG_SET_ORDER)) {
                foreach ($matches as $m) {
                    $lineNum = intval($m[1]);
                    $codeLine = $m[2];
                    $allLines[$lineNum] = $codeLine;
                }
            }
        }
    }
}
fclose($handle);

echo "Total distinct lines from transcript_full.jsonl: " . count($allLines) . "\n";
if (count($allLines) > 0) {
    ksort($allLines);
    $recoveredCode = implode("\n", $allLines);
    file_put_contents(__DIR__ . '/exact_pre_rbac_app_full.jsx', $recoveredCode);
    echo "Saved to exact_pre_rbac_app_full.jsx (" . strlen($recoveredCode) . " bytes)\n";
}
