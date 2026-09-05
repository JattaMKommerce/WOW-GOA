<?php
$sqlitePath = __DIR__ . '/../backend/database.sqlite';
$pdo = new PDO("sqlite:$sqlitePath");
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$tables = ['packages', 'cars', 'bikes', 'hotels', 'explore_destinations', 'bookings', 'vendors'];

foreach ($tables as $tbl) {
    try {
        $cols = $pdo->query("PRAGMA table_info($tbl)")->fetchAll(PDO::FETCH_COLUMN, 1);
        foreach ($cols as $col) {
            // Count
            $stmt = $pdo->query("SELECT COUNT(*) FROM $tbl WHERE $col LIKE '%localhost:8000%' OR $col LIKE '%localhost/tripgalileo/backend%'");
            $cnt = $stmt->fetchColumn();
            if ($cnt > 0) {
                echo "Found $cnt records in $tbl.$col. Updating...\n";
                $pdo->exec("UPDATE $tbl SET $col = REPLACE($col, 'http://localhost:8000/uploads/', '/backend/uploads/') WHERE $col LIKE '%http://localhost:8000/uploads/%'");
                $pdo->exec("UPDATE $tbl SET $col = REPLACE($col, 'http:\/\/localhost:8000\/uploads\/', '\/backend\/uploads\/') WHERE $col LIKE '%http:\/\/localhost:8000\/uploads\/%'");
                $pdo->exec("UPDATE $tbl SET $col = REPLACE($col, 'http://localhost/tripgalileo/backend/uploads/', '/backend/uploads/') WHERE $col LIKE '%http://localhost/tripgalileo/backend/uploads/%'");
                $pdo->exec("UPDATE $tbl SET $col = REPLACE($col, 'http:\/\/localhost\/tripgalileo\/backend\/uploads\/', '\/backend\/uploads\/') WHERE $col LIKE '%http:\/\/localhost\/tripgalileo\/backend\/uploads\/%'");
            }
        }
    } catch (Exception $e) {
        // table might not exist
    }
}
echo "Normalization complete!\n";
