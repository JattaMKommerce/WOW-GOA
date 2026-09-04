<?php
$logFile = 'C:\\Users\\rajda\\.gemini\\antigravity-ide\\brain\\166a297e-0dbf-44f3-823e-815378a2f8a9\\.system_generated\\logs\\transcript.jsonl';
$handle = fopen($logFile, 'r');
$linesSeen = [];

while (($line = fgets($handle)) !== false) {
    $data = json_decode($line, true);
    $step = $data['step_index'] ?? 0;
    if ($step === 892 || $step === 894 || $step === 820 || $step === 822) {
        $content = $data['content'] ?? '';
        echo "Step $step content length: " . strlen($content) . "\n";
        // Parse the code lines
        if (preg_match_all('/^(\d+):\s*(.*)$/m', $content, $matches, PREG_SET_ORDER)) {
            foreach ($matches as $m) {
                $lineNum = intval($m[1]);
                $codeLine = $m[2];
                $linesSeen[$lineNum] = $codeLine;
            }
        }
    }
}
fclose($handle);

echo "Total lines extracted from steps 820, 822, 892, 894: " . count($linesSeen) . "\n";
if (count($linesSeen) > 0) {
    ksort($linesSeen);
    $recoveredCode = implode("\n", $linesSeen);
    file_put_contents(__DIR__ . '/recovered_pre_rbac_app.jsx', $recoveredCode);
    echo "Saved recovered App.jsx to recovered_pre_rbac_app.jsx (" . strlen($recoveredCode) . " bytes)\n";
}
