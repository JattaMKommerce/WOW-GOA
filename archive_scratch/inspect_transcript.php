<?php
$logFile = 'C:\\Users\\rajda\\.gemini\\antigravity-ide\\brain\\166a297e-0dbf-44f3-823e-815378a2f8a9\\.system_generated\\logs\\transcript.jsonl';
$handle = fopen($logFile, 'r');
$count = 0;
while (($line = fgets($handle)) !== false && $count < 5) {
    $count++;
    $data = json_decode($line, true);
    echo "Line $count keys: " . implode(', ', array_keys($data)) . "\n";
    if (isset($data['type'])) echo "  type: " . $data['type'] . "\n";
    if (isset($data['tool_calls'])) {
        echo "  tool_calls: " . count($data['tool_calls']) . "\n";
        foreach ($data['tool_calls'] as $tc) {
            echo "    call: " . json_encode($tc) . "\n";
        }
    }
}
fclose($handle);
