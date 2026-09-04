<?php
$pdo = new PDO('sqlite:d:/wow goa/Tripgalileo (2)/Tripgalileo/backend/database.sqlite');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

try {
    $pdo->exec("ALTER TABLE bookings ADD COLUMN image TEXT");
    echo "Added image column to bookings.\n";
} catch (Exception $e) {
    echo "image column exists or error: " . $e->getMessage() . "\n";
}

try {
    $pdo->exec("ALTER TABLE bookings ADD COLUMN vehicle_image TEXT");
    echo "Added vehicle_image column to bookings.\n";
} catch (Exception $e) {
    echo "vehicle_image column exists or error: " . $e->getMessage() . "\n";
}

// Fetch all bikes and cars to map images
$bikes = $pdo->query("SELECT id, name, image FROM bikes")->fetchAll(PDO::FETCH_ASSOC);
$cars = $pdo->query("SELECT id, name, image FROM cars")->fetchAll(PDO::FETCH_ASSOC);

$imgMap = [];
foreach ($bikes as $b) {
    if (!empty($b['image'])) {
        $imgMap[strtolower(trim($b['id']))] = $b['image'];
        $imgMap[strtolower(trim($b['name']))] = $b['image'];
    }
}
foreach ($cars as $c) {
    if (!empty($c['image'])) {
        $imgMap[strtolower(trim($c['id']))] = $c['image'];
        $imgMap[strtolower(trim($c['name']))] = $c['image'];
    }
}

// Update existing bookings
$bookings = $pdo->query("SELECT id, item_id, item_name FROM bookings")->fetchAll(PDO::FETCH_ASSOC);
foreach ($bookings as $bk) {
    $foundImg = null;
    $itemId = strtolower(trim($bk['item_id'] ?? ''));
    $itemName = strtolower(trim($bk['item_name'] ?? ''));

    if (isset($imgMap[$itemId])) {
        $foundImg = $imgMap[$itemId];
    } elseif (isset($imgMap[$itemName])) {
        $foundImg = $imgMap[$itemName];
    }

    if ($foundImg) {
        $up = $pdo->prepare("UPDATE bookings SET image = ?, vehicle_image = ? WHERE id = ?");
        $up->execute([$foundImg, $foundImg, $bk['id']]);
        echo "Updated booking {$bk['id']} ({$bk['item_name']}) with image: {$foundImg}\n";
    }
}
echo "Migration complete.\n";
