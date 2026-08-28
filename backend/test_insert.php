<?php
define('DB_HOST', 'localhost');
define('DB_PORT', '3306');
define('DB_NAME', 'tripgalileo');
define('DB_USER', 'root');
define('DB_PASS', ''); 

try {
    $pdo = new PDO("mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=utf8mb4", DB_USER, DB_PASS);
    
    $stmt = $pdo->prepare("INSERT INTO hotels (id, name, location, area, price, amenities, image, images_json, vendor_id, stars, rating, badge, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    
    $hotels = [
        [
            'name' => 'Goa Marriott Resort & Spa',
            'location' => 'Panaji',
            'price' => 12500,
            'amenities' => 'Pool, Free WiFi, Beachfront, Spa, Breakfast Included',
            'image' => 'https://images.unsplash.com/photo-1542314831-c6a4d14d8c85?auto=format&fit=crop&w=800&q=80',
            'images_json' => '["https://images.unsplash.com/photo-1542314831-c6a4d14d8c85?auto=format&fit=crop&w=800&q=80","https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80"]',
            'vendor_id' => 'vendor-1784530213785',
            'stars' => 5,
            'rating' => 4.8,
            'badge' => 'Luxury',
            'description' => 'Experience unparalleled luxury at our beachfront resort in Panaji.'
        ],
        [
            'name' => 'W Goa',
            'location' => 'Vagator',
            'price' => 18500,
            'amenities' => 'Infinity Pool, DJ Lounge, Free WiFi, Spa',
            'image' => 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=80',
            'images_json' => '["https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=80","https://images.unsplash.com/photo-1522798514-97ceb8c4f1c8?auto=format&fit=crop&w=800&q=80"]',
            'vendor_id' => 'vendor-1784530213785',
            'stars' => 5,
            'rating' => 4.6,
            'badge' => 'Trending',
            'description' => 'Vibrant, chic and highly Instagrammable resort in Vagator.'
        ],
        [
            'name' => 'The Leela Goa',
            'location' => 'Cavelossim',
            'price' => 22000,
            'amenities' => 'Private Beach, Golf Course, Spa, Dining',
            'image' => 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
            'images_json' => '["https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80","https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=800&q=80"]',
            'vendor_id' => 'vendor-1784530213785',
            'stars' => 5,
            'rating' => 4.9,
            'badge' => 'Premium',
            'description' => 'Unwind in the ultimate oasis of luxury nestled in Cavelossim.'
        ]
    ];
    
    foreach ($hotels as $h) {
        $id = 'hotel_' . uniqid();
        $stmt->execute([
            $id, $h['name'], $h['location'], $h['location'], intval($h['price']), $h['amenities'], $h['image'], $h['images_json'], $h['vendor_id'],
            intval($h['stars']), floatval($h['rating']), $h['badge'], $h['description']
        ]);
    }
    
    echo "Demo Hotels Added!";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
