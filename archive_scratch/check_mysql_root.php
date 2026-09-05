<?php
try {
    $p = new PDO("mysql:host=localhost", "root", "");
    $p->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $dbs = $p->query("SHOW DATABASES")->fetchAll(PDO::FETCH_COLUMN);
    echo "MySQL Root Connected! Databases: " . implode(', ', $dbs) . "\n";
    foreach ($dbs as $db) {
        if (in_array($db, ['information_schema', 'mysql', 'performance_schema', 'sys'])) continue;
        echo "\nDatabase: $db\n";
        $p->exec("USE `$db`");
        $tables = $p->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
        foreach ($tables as $t) {
            $count = $p->query("SELECT COUNT(*) FROM `$t`")->fetchColumn();
            echo "  - $t: $count rows\n";
        }
    }
} catch (Exception $e) {
    echo "MySQL Root failed: " . $e->getMessage() . "\n";
}
