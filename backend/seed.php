<?php
$db = new PDO("mysql:host=localhost;port=3306;dbname=tripgalileo;charset=utf8mb4", 'root', '');
$pkgId = uniqid();
$stmt = $db->prepare("INSERT INTO packages (
    id, package_type, name, duration, price, description, tag, image, 
    day_wise_itinerary, highlights_json, inclusions_exclusions_json, cancellation_policy, advance_percentage
) VALUES (
    ?, 'Trip Package', 'Ultimate Goa Premium Experience', '5 Days, 4 Nights', 25999, 
    'Experience the best of Goa with premium 5-star stays, private yacht dinner, and exclusive transfers.', 'Premium', 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?q=80&w=1974&auto=format&fit=crop', 
    '[{\"day\":1,\"location\":\"North Goa\",\"title\":\"Arrival & Leisure\",\"activities\":\"Check in to your beachfront resort and relax.\",\"meals\":\"Dinner included\"},{\"day\":2,\"location\":\"South Goa\",\"title\":\"Heritage Tour\",\"activities\":\"Visit Basilica of Bom Jesus and spice plantations.\",\"meals\":\"Breakfast included\"}]', 
    'Stay at Taj Exotica or similar 5-star resort\nPrivate airport transfers in a luxury SUV\nExclusive sunset yacht dinner cruise\nComplimentary spa session for couples', 
    'Included: 4 Nights accommodation, Daily Breakfast & 2 Dinners, All private transfers\nExcluded: Flights, Personal expenses, Travel Insurance', 
    'Free cancellation up to 7 days before departure. 50% fee within 7 days.', 20
)");

$stmt->execute([$pkgId]);
echo "Inserted premium package successfully!\n";

$bookingId = uniqid();
$bookingStmt = $db->prepare("INSERT INTO bookings (
    id, item_id, item_name, package_type, name, phone, pickup_loc, pickup_date, booking_days, 
    total_amount, amount_paid, remaining_amount, status, payment_status, payment_method, 
    traveller_details_json, price_breakdown_json
) VALUES (
    ?, ?, 'Ultimate Goa Premium Experience', 'Trip Package', 'Alice Smith', '+91 9876543210', 'Goa Airport', '2026-12-01', 5,
    25999, 5199.8, 20799.2, 'Confirmed', 'Partial', 'razorpay',
    '{\"adults\":2,\"children\":0,\"list\":[{\"type\":\"Adult\",\"firstName\":\"Alice\",\"lastName\":\"Smith\",\"gender\":\"Ms\",\"age\":\"28\",\"idType\":\"Aadhaar\"},{\"type\":\"Adult\",\"firstName\":\"Bob\",\"lastName\":\"Smith\",\"gender\":\"Mr\",\"age\":\"30\",\"idType\":\"Aadhaar\"}],\"contactEmail\":\"alice@example.com\",\"contactPhone\":\"+91 9876543210\"}',
    '{\"base_price\":25999,\"add_ons\":0,\"hotel_upgrades\":0,\"transfer_upgrades\":0,\"discount\":0,\"total_price\":25999,\"advance_percentage\":20,\"advance_amount\":5199.8}'
)");
$bookingStmt->execute([$bookingId, $pkgId]);
echo "Inserted dummy booking successfully!\n";
