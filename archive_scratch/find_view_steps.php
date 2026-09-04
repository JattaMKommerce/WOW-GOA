<?php
$logFile = 'C:\\Users\\rajda\\.gemini\\antigravity-ide\\brain\\166a297e-0dbf-44f3-823e-815378a2f8a9\\.system_generated\\logs\\transcript.jsonl';
$handle = fopen($logFile, 'r');
$viewSteps = [];

while (($line = fgets($handle)) !== false) {
    $data = json_decode($line, true);
    $step = $data['step_index'] ?? 0;
    if ($step < 900) {
        if ($data && isset($data['tool_calls'])) {
            foreach ($data['tool_calls'] as $tc) {
                if ($tc['name'] === 'view_file' && isset($tc['args']['AbsolutePath']) && strpos($tc['args']['AbsolutePath'], 'App.jsx') !== false) {
                    $viewSteps[] = $step;
                }
            }
        }
    }
}
fclose($handle);

echo "View steps on App.jsx before step 900: " . implode(', ', $viewSteps) . "\n";
