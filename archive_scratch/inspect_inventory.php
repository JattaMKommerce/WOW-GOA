<?php
$pdo = new PDO('sqlite:' . __DIR__ . '/../backend/database.sqlite');

echo "=== CARS CATEGORIES ===\n";
$stmt = $pdo->query("SELECT category, COUNT(*) as cnt, MIN(price) as min_p, MAX(price) as max_p FROM cars GROUP BY category");
while ($r = $stmt->fetch(PDO::FETCH_ASSOC)) {
    echo "  - {$r['category']}: {$r['cnt']} cars (₹{$r['min_p']} - ₹{$r['max_p']})\n";
}

echo "\n=== BIKES CATEGORIES ===\n";
$stmt = $pdo->query("SELECT category, COUNT(*) as cnt, MIN(price) as min_p, MAX(price) as max_p FROM bikes GROUP BY category");
while ($r = $stmt->fetch(PDO::FETCH_ASSOC)) {
    echo "  - {$r['category']}: {$r['cnt']} bikes (₹{$r['min_p']} - ₹{$r['max_p']})\n";
}

echo "\n=== HOTELS ===\n";
$stmt = $pdo->query("SELECT property_type, stars, COUNT(*) as cnt FROM hotels GROUP BY property_type, stars");
while ($r = $stmt->fetch(PDO::FETCH_ASSOC)) {
    echo "  - Type: '{$r['property_type']}', Stars: {$r['stars']} -> {$r['cnt']} hotels\n";
}

echo "\n=== PACKAGES ===\n";
$stmt = $pdo->query("SELECT package_type, COUNT(*) as cnt FROM packages GROUP BY package_type");
while ($r = $stmt->fetch(PDO::FETCH_ASSOC)) {
    echo "  - Package Type: '{$r['package_type']}' -> {$r['cnt']} packages\n";
}
