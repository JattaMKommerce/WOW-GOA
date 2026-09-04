<?php
$pdo = new PDO('sqlite:' . __DIR__ . '/../backend/database.sqlite');
$stmt = $pdo->query("SELECT id, name, package_type FROM packages");
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo "Packages count: " . count($rows) . "\n";
foreach (array_slice($rows, 0, 5) as $r) {
    echo "- [{$r['id']}] {$r['name']} ({$r['package_type']})\n";
}

$stmtCars = $pdo->query("SELECT count(*) FROM cars");
echo "Cars count: " . $stmtCars->fetchColumn() . "\n";

$stmtHotels = $pdo->query("SELECT count(*) FROM hotels");
echo "Hotels count: " . $stmtHotels->fetchColumn() . "\n";
