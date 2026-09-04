<?php
// Migration script to seed exactly 3 hotels (3-Star, 4-Star, 5-Star) with 5 high-res photos each

$dbFile = __DIR__ . '/../backend/database.sqlite';
$pdo = new PDO("sqlite:$dbFile");
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

// 1. Delete all existing hotels and room types
$pdo->exec("DELETE FROM hotels");
$pdo->exec("DELETE FROM hotel_room_types");

$hotels = [
    [
        'id' => 'hotel-3star',
        'vendor_id' => 'u-5',
        'name' => 'Casa Baga Boutique Resort',
        'area' => 'Baga (North Goa)',
        'location' => 'Baga Beach, North Goa',
        'price' => 3499,
        'stars' => 3,
        'amenities' => 'Swimming Pool, Free High-Speed Wi-Fi, Complimentary Breakfast, Air Conditioning, Restaurant & Bar, 24/7 Front Desk',
        'rating' => 4.40,
        'badge' => '3-Star Value',
        'image' => 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80',
        'images_json' => json_encode([
            'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80'
        ]),
        'description' => 'A charming boutique tropical getaway nestled moments away from vibrant Baga Beach, featuring serene palm courtyards, an outdoor pool, and modern air-conditioned guest rooms.',
        'is_available' => 1,
        'admin_id' => 'admin',
        'hotel_status' => 'Live',
        'property_type' => 'Resort',
        'city' => 'Goa',
        'state' => 'Goa',
        'country' => 'India',
        'checkin_time' => '14:00',
        'checkout_time' => '11:00'
    ],
    [
        'id' => 'hotel-4star',
        'vendor_id' => 'u-5',
        'name' => 'The Grand Candolim Beachfront Resort',
        'area' => 'Candolim (North Goa)',
        'location' => 'Candolim Beach, North Goa',
        'price' => 7999,
        'stars' => 4,
        'amenities' => 'Lagoon Pool, Free Buffet Breakfast, Beach Access, Spa & Wellness Centre, Cocktail Bar, Free High-Speed Wi-Fi, Airport Shuttle, Fitness Center',
        'rating' => 4.70,
        'badge' => '4-Star Premium',
        'image' => 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80',
        'images_json' => json_encode([
            'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&q=80'
        ]),
        'description' => 'An exquisite 4-star coastal sanctuary overlooking Candolim beachfront with expansive lagoon pools, sunset cocktail lounges, multisport amenities, and plush private balconies.',
        'is_available' => 1,
        'admin_id' => 'admin',
        'hotel_status' => 'Live',
        'property_type' => 'Resort',
        'city' => 'Goa',
        'state' => 'Goa',
        'country' => 'India',
        'checkin_time' => '14:00',
        'checkout_time' => '11:00'
    ],
    [
        'id' => 'hotel-5star',
        'vendor_id' => 'u-5',
        'name' => 'Taj Exotica Resort & Spa Goa',
        'area' => 'Benaulim (South Goa)',
        'location' => 'Benaulim Beach, South Goa',
        'price' => 17500,
        'stars' => 5,
        'amenities' => 'Private Beach Front, Olympic Infinity Pool, Jiva Luxury Spa, Fine Dining Pavilions, 24/7 Butler Service, Golf Course, Tennis Courts, Valet Parking',
        'rating' => 4.90,
        'badge' => '5-Star Luxury',
        'image' => 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
        'images_json' => json_encode([
            'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1544984243-ec57ea16fe25?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=1200&q=80'
        ]),
        'description' => 'Mediterranean-inspired 5-star palatial oasis sprawled over 56 landscaped oceanfront acres on the pristine sands of Benaulim Beach with royal private plunge pools, world-class Jiva Spa, and fine-dining.',
        'is_available' => 1,
        'admin_id' => 'admin',
        'hotel_status' => 'Live',
        'property_type' => 'Luxury Resort',
        'city' => 'Goa',
        'state' => 'Goa',
        'country' => 'India',
        'checkin_time' => '14:00',
        'checkout_time' => '12:00'
    ]
];

$stmt = $pdo->prepare("INSERT INTO hotels (
    id, vendor_id, name, area, location, price, stars, amenities, rating, badge, image, images_json,
    description, is_available, admin_id, hotel_status, property_type, city, state, country, checkin_time, checkout_time
) VALUES (
    :id, :vendor_id, :name, :area, :location, :price, :stars, :amenities, :rating, :badge, :image, :images_json,
    :description, :is_available, :admin_id, :hotel_status, :property_type, :city, :state, :country, :checkin_time, :checkout_time
)");

foreach ($hotels as $h) {
    $stmt->execute($h);
}

// Add Room Types for the 3 Hotels
$roomTypes = [
    // 3-Star
    ['rt-301', 'hotel-3star', 'u-5', 'Standard AC Room', 10, 2, 3, 3499, 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=800&q=80'],
    ['rt-302', 'hotel-3star', 'u-5', 'Pool View Deluxe', 6, 2, 4, 4499, 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80'],
    // 4-Star
    ['rt-401', 'hotel-4star', 'u-5', 'Superior Beachfront Room', 12, 2, 3, 7999, 'https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=800&q=80'],
    ['rt-402', 'hotel-4star', 'u-5', 'Grand Suite with Balcony', 5, 2, 4, 11999, 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=800&q=80'],
    // 5-Star
    ['rt-501', 'hotel-5star', 'u-5', 'Deluxe Sea View Villa', 8, 2, 3, 17500, 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=800&q=80'],
    ['rt-502', 'hotel-5star', 'u-5', 'Presidential Plunge Pool Suite', 4, 2, 4, 28500, 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=80']
];

$rtStmt = $pdo->prepare("INSERT OR REPLACE INTO hotel_room_types (id, hotel_id, vendor_id, name, total_rooms, base_occupancy, max_occupancy, price) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
foreach ($roomTypes as $rt) {
    $rtStmt->execute(array_slice($rt, 0, 8));
}

echo "Successfully seeded 3 clean luxury hotels (3-star, 4-star, 5-star) with 5 high-res photos each into SQLite!\n";
