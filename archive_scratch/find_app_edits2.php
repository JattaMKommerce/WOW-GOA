<?php
$logFile = 'C:\\Users\\rajda\\.gemini\\antigravity-ide\\brain\\166a297e-0dbf-44f3-823e-815378a2f8a9\\.system_generated\\logs\\transcript.jsonl';
$handle = fopen($logFile, 'r');
$appEdits = [];

while (($line = fgets($handle)) !== false) {
    $data = json_decode($line, true);
    if ($data && isset($data['tool_calls'])) {
        foreach ($data['tool_calls'] as $tc) {
            $args = $tc['args'] ?? [];
            $target = $args['TargetFile'] ?? '';
            if (stripos($target, 'App.jsx') !== false) {
                $appEdits[] = [
                    'step' => $data['step_index'] ?? 0,
                    'tool' => $tc['name'] ?? '',
                    'args' => $args
                ];
            }
        }
    }
}
fclose($handle);

echo "Found " . count($appEdits) . " edits on App.jsx\n";
foreach ($appEdits as $e) {
    echo "Step " . $e['step'] . " - " . $e['tool'] . "\n";
    if (isset($e['args']['Instruction'])) echo "  Instruction: " . $e['args']['Instruction'] . "\n";
    if (isset($e['args']['Description'])) echo "  Description: " . $e['args']['Description'] . "\n";
}
