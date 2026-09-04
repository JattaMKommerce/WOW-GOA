<?php
$sqlitePath = __DIR__ . '/../backend/database.sqlite';
$pdo = new PDO("sqlite:$sqlitePath");
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

// 1. Add any missing columns to packages table in SQLite
$colsToAdd = [
    "pickup_drop_price INT DEFAULT 0",
    "pickup_drop_image VARCHAR(255) DEFAULT NULL",
    "cancellation_policy TEXT DEFAULT NULL",
    "highlights_json TEXT DEFAULT NULL",
    "inclusions_exclusions_json TEXT DEFAULT NULL",
    "advance_percentage INT DEFAULT 25",
    "package_addons_json TEXT DEFAULT NULL",
    "images_json TEXT DEFAULT NULL",
    "image_url VARCHAR(255) DEFAULT NULL",
    "destination VARCHAR(100) DEFAULT 'Goa'",
    "pax VARCHAR(50) DEFAULT '2A 0C 0I'",
    "costing_type VARCHAR(100) DEFAULT 'Service Wise Cost'",
    "currency VARCHAR(20) DEFAULT 'INR'"
];

foreach ($colsToAdd as $colDef) {
    try {
        $pdo->exec("ALTER TABLE packages ADD COLUMN $colDef");
        echo "Added column: $colDef\n";
    } catch (Exception $e) {
        // Column might already exist
    }
}

// 2. Clear existing packages and insert ONLY the 2 desired clean packages
$pdo->exec("DELETE FROM packages");

$stmt = $pdo->prepare("INSERT INTO packages (
    id, name, duration, car_included, hotel_included, price, price_with_flight, 
    description, tag, image, images_json, package_type, flights_included, 
    food_included, pickup_drop_included, places_included, is_flight_customizable, 
    base_flight_price, is_cab_customizable, company_cab_price, pickup_drop_price, 
    advance_percentage, destination, pax, admin_id
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");

// Package 1: Coastal Goa Explorer Pack
$pkg1Images = json_encode([
    'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1200&q=80'
]);

$stmt->execute([
    'package-1',
    'Coastal Goa Explorer Pack',
    '4 Days / 3 Nights',
    'Mahindra Thar 4x4',
    '4-Star Candolim Beach Resort',
    14999,
    18999,
    'Explore the sun-kissed beaches of North Goa with a premium 4x4 Thar at your disposal and stays next to the lively coast.',
    'Most Popular',
    'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1200&q=80',
    $pkg1Images,
    'Trip Package',
    '1',
    'Breakfast Included',
    'Free Airport Pickup & Drop',
    'Calangute, Baga, Candolim, Fort Aguada',
    1,
    4000,
    1,
    2500,
    0,
    25,
    'North Goa',
    '2A 0C 0I',
    'admin'
]);

// Package 2: Romantic Sunset Escape
$pkg2Images = json_encode([
    'https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1515238152791-8216bfdf89a7?auto=format&fit=crop&w=1200&q=80'
]);

$stmt->execute([
    'package-2',
    'Romantic Sunset Escape',
    '3 Days / 2 Nights',
    'Audi Cabriolet Convertible',
    'W Goa Luxury Resort (Vagator)',
    29999,
    34999,
    'Drive in style under the open skies with a luxury convertible. Includes a candlelight beach dinner and a couples spa.',
    'Luxury Honeymoon',
    'https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?auto=format&fit=crop&w=1200&q=80',
    $pkg2Images,
    'Trip Package',
    '1',
    'All Meals & Candlelight Dinner',
    'Free Airport Pickup & Drop',
    'Vagator, Anjuna, Chapora Fort',
    1,
    5000,
    1,
    3500,
    0,
    25,
    'Vagator, Goa',
    '2A 0C 0I',
    'admin'
]);

echo "Migration complete! Packages currently in DB:\n";
$pkgs = $pdo->query("SELECT id, name, price, image FROM packages")->fetchAll(PDO::FETCH_ASSOC);
print_r($pkgs);
