<?php
$pdo = new PDO('sqlite:' . __DIR__ . '/../backend/database.sqlite');

$itin1 = [
    [
        'day' => 1,
        'title' => 'Arrival in Goa, Private Airport Transfer & Hotel Check-in',
        'description' => 'Warm greeting by your private chauffeur at Goa Airport/Railway Station. Scenic drive to your 4-Star Candolim Beach Resort, welcome drinks on arrival, and evening beach leisure.',
        'location' => 'Candolim',
        'hotel' => '4-Star Candolim Beach Resort',
        'meals' => 'Welcome Drinks & Buffet Dinner',
        'transfers' => 'Mahindra Thar 4x4 Handover',
        'inclusions' => ['Airport Pickup', 'Resort Check-in', 'Welcome Drink', 'Dinner'],
        'sightseeing_locations' => [['name' => 'Candolim Beach', 'tips' => 'Serene beach with relaxed beach shacks']]
    ],
    [
        'day' => 2,
        'title' => 'North Goa Coastal Explorer, Fort Aguada & Water Sports',
        'description' => 'Head out in your dedicated Thar 4x4 to Calangute and Baga beaches. Explore historic Fort Aguada lighthouse with sweeping sea views and partake in exciting watersports.',
        'location' => 'Calangute & Baga',
        'hotel' => '4-Star Candolim Beach Resort',
        'meals' => 'Buffet Breakfast & Dinner',
        'transfers' => 'Mahindra Thar 4x4',
        'inclusions' => ['Breakfast', 'Dedicated Vehicle', 'Fort Aguada Pass', 'Water Sports Pass'],
        'sightseeing_locations' => [
            ['name' => 'Fort Aguada', 'tips' => '17th-century Portuguese fort and lighthouse'],
            ['name' => 'Baga Beach', 'tips' => 'Famous for water sports and vibrant shacks']
        ]
    ],
    [
        'day' => 3,
        'title' => 'South Goa Heritage Trail, Latin Quarter & Sunset River Cruise',
        'description' => 'Discover the colorful heritage houses of Fontainhas in Panaji, visit ancient Basilica of Bom Jesus, and embark on a mesmerizing 1-hour Mandovi River sunset cruise with Goan cultural dance.',
        'location' => 'Panaji & Old Goa',
        'hotel' => '4-Star Candolim Beach Resort',
        'meals' => 'Buffet Breakfast & Dinner',
        'transfers' => 'Mahindra Thar 4x4',
        'inclusions' => ['Breakfast', 'Heritage Guide', 'Sunset Cruise Ticket', 'Dinner'],
        'sightseeing_locations' => [
            ['name' => 'Fontainhas Latin Quarter', 'tips' => 'Historic Portuguese neighborhood with bright villas'],
            ['name' => 'Mandovi River Sunset Cruise', 'tips' => '1-hour sunset cruise with live folk music']
        ]
    ],
    [
        'day' => 4,
        'title' => 'Leisure Morning & Airport Departure Transfer',
        'description' => 'Savor a leisurely breakfast by the pool. Enjoy last-minute shopping at local flea markets before your private drop-off at Goa Airport or Railway Station.',
        'location' => 'Goa Airport',
        'hotel' => '4-Star Candolim Beach Resort',
        'meals' => 'Buffet Breakfast',
        'transfers' => 'Airport Drop Transfer',
        'inclusions' => ['Breakfast', 'Airport Drop Transfer'],
        'sightseeing_locations' => [['name' => 'Goa Flea Market', 'tips' => 'Handicrafts, spices, and souvenirs']]
    ]
];

$itin2 = [
    [
        'day' => 1,
        'title' => 'VIP Arrival & Luxury Convertible Handover at W Goa',
        'description' => 'Airport greeting with your Audi Cabriolet convertible. Check-in to oceanfront suite at W Goa, Vagator. Evening romantic sunset drinks by the rock pool.',
        'location' => 'Vagator',
        'hotel' => 'W Goa Luxury Resort',
        'meals' => 'Welcome Champagne & 4-Course Dinner',
        'transfers' => 'Audi Cabriolet Convertible',
        'inclusions' => ['VIP Airport Pickup', 'W Goa Suite Check-in', 'Couples Welcome Drink', 'Gourmet Dinner'],
        'sightseeing_locations' => [['name' => 'Vagator Beach', 'tips' => 'Red cliffs and iconic sunset views']]
    ],
    [
        'day' => 2,
        'title' => 'Anjuna & Vagator Cliffside Tour, Couples Spa & Beach Candlelight Dinner',
        'description' => 'Cruise along the scenic coastal road to Chapora Fort overlooking the Arabian Sea. Enjoy a signature 90-minute couples therapy spa followed by an exclusive candlelight beach dinner.',
        'location' => 'Anjuna & Chapora',
        'hotel' => 'W Goa Luxury Resort',
        'meals' => 'Champagne Breakfast & Candlelight Dinner',
        'transfers' => 'Audi Cabriolet Convertible',
        'inclusions' => ['Breakfast', 'Couples Spa Session', 'Convertible Car', 'Candlelight Dinner'],
        'sightseeing_locations' => [
            ['name' => 'Chapora Fort', 'tips' => 'Panoramic sunset view over Ozran and Vagator'],
            ['name' => 'Anjuna Beach', 'tips' => 'Bohemian vibe with beach cafes and sunset shacks']
        ]
    ],
    [
        'day' => 3,
        'title' => 'Lazy Morning & Chauffeur Airport Drop-off',
        'description' => 'Enjoy breakfast in bed or poolside lounge. Smooth vehicle return and private drop transfer to Goa International Airport.',
        'location' => 'Goa Airport',
        'hotel' => 'W Goa Luxury Resort',
        'meals' => 'Gourmet Breakfast',
        'transfers' => 'Airport Drop Transfer',
        'inclusions' => ['Breakfast', 'Airport Drop Transfer'],
        'sightseeing_locations' => [['name' => 'Vagator Coastline', 'tips' => 'Morning coastal stroll and photography']]
    ]
];

$stmt1 = $pdo->prepare("UPDATE packages SET day_wise_itinerary = ? WHERE id = 'package-1'");
$stmt1->execute([json_encode($itin1)]);

$stmt2 = $pdo->prepare("UPDATE packages SET day_wise_itinerary = ? WHERE id = 'package-2'");
$stmt2->execute([json_encode($itin2)]);

echo "Updated packages in SQLite database with full day_wise_itinerary JSON.\n";
