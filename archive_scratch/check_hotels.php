<?php
$pdoS = new PDO("sqlite:" . __DIR__ . "/../backend/database.sqlite");
$stmt = $pdoS->query("SELECT * FROM hotels");
$hotels = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo "Total SQLite hotels: " . count($hotels) . "\n";
print_r($hotels);
