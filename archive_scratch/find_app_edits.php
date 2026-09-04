<?php
$logFile = 'C:\\Users\\rajda\\.gemini\\antigravity-ide\\brain\\166a297e-0dbf-44f3-823e-815378a2f8a9\\.system_generated\\logs\\transcript.jsonl';
$handle = fopen($logFile, 'r');
$steps = [];

while (($line = fgets($handle)) !== false) {
    $data = json_decode($line, true);
    if ($data && isset($data['tool_calls'])) {
        foreach ($data['tool_calls'] as $tc) {
            $name = $tc['toolSummary'] ?? $tc['name'] ?? '';
            $params = $tc['parameters'] ?? [];
            if (isset($params['TargetFile']) && strpos($params['TargetFile'], 'App.jsx') !== false) {
                $steps[] = [
                    'step' => $data['step_index'] ?? '?',
                    'tool' => $tc['name'] ?? '',
                    'summary' => $tc['toolSummary'] ?? '',
                    'desc' => $params['Description'] ?? '',
                    'instruction' => $params['Instruction'] ?? ''
                ];
            }
        }
    }
}
fclose($handle);

echo json_encode($steps, JSON_PRETTY_PRINT);
