<?php
$s = json_decode(file_get_contents('schema_full.json'), true);
foreach($s as $t => $c) {
    echo $t . ": ";
    if(is_array($c)) {
        foreach($c as $f) {
            echo $f['Field'] . ', ';
        }
    }
    echo "\n";
}
