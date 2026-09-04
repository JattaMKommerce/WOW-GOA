<?php
$pdo = new PDO('sqlite:' . __DIR__ . '/../backend/database.sqlite');
$colsToAdd = [
    'departure_date' => 'VARCHAR(50)',
    'return_date' => 'VARCHAR(50)',
    'check_in_date' => 'VARCHAR(50)',
    'check_out_date' => 'VARCHAR(50)',
    'duration' => 'VARCHAR(50)'
];

$existingStmt = $pdo->query('PRAGMA table_info(bookings)');
$existingCols = array_column($existingStmt->fetchAll(PDO::FETCH_ASSOC), 'name');

foreach ($colsToAdd as $col => $type) {
    if (!in_array($col, $existingCols)) {
        $pdo->exec("ALTER TABLE bookings ADD COLUMN $col $type");
        echo "Added column: $col\n";
    } else {
        echo "Column already exists: $col\n";
    }
}
echo "Migration complete.\n";
