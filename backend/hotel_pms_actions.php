<?php
// Centralized Hotel PMS Mutation (POST) handlers for Tripgalileo / WOW GOA
// Included inside api.php POST request block

$pdo = $pdo ?? ($db ?? null);
$payload = $payload ?? ($inputData ?? ($_POST ?? []));
$action = $action ?? ($payload['action'] ?? '');
$tenant_id = $tenant_id ?? ($payload['tenant_id'] ?? 'default');
$vendor_id = $payload['vendor_id'] ?? ($payload['vendorId'] ?? ($tenant_id !== 'default' ? $tenant_id : 'u-5'));

// Helper to log PMS activity
if (!function_exists('pmsLogAction')) {
    function pmsLogAction($pdo, $vendor_id, $action, $module, $details) {
        try {
            $id = 'act-' . uniqid();
            $stmt = $pdo->prepare("INSERT INTO hotel_activity_logs (id, vendor_id, action, module, details, ip_address, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $id,
                $vendor_id,
                $action,
                $module,
                is_array($details) ? json_encode($details) : strval($details),
                $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1',
                date('Y-m-d H:i:s')
            ]);
        } catch (Exception $e) {}
    }
}

// 1. Hotel Management (Add, Update, Delete, Status)
if ($action === 'add_master_hotel' || $action === 'add_hotel' || $action === 'create_hotel') {
    $id = !empty($payload['id']) ? $payload['id'] : ('hotel-' . uniqid());
    
    // Multi-image handling
    $imagesList = [];
    if (!empty($payload['images']) && is_array($payload['images'])) {
        $imagesList = array_values(array_filter($payload['images']));
    } elseif (!empty($payload['images_json'])) {
        $decoded = is_string($payload['images_json']) ? json_decode($payload['images_json'], true) : $payload['images_json'];
        if (is_array($decoded)) $imagesList = array_values(array_filter($decoded));
    }
    if (empty($imagesList) && !empty($payload['image'])) {
        $imagesList = [$payload['image']];
    }
    $image = !empty($imagesList) ? $imagesList[0] : ($payload['image'] ?? '');
    $images_json = !empty($imagesList) ? json_encode($imagesList) : '[]';

    $facilities = !empty($payload['facilities']) ? (is_array($payload['facilities']) ? $payload['facilities'] : json_decode($payload['facilities'], true)) : [];
    $amenitiesStr = !empty($facilities) ? implode(', ', $facilities) : ($payload['amenities'] ?? 'Free Wi-Fi, Swimming Pool, Restaurant');

    $docsJson = isset($payload['documents_json']) ? (is_array($payload['documents_json']) ? json_encode($payload['documents_json']) : $payload['documents_json']) : null;

    $stmt = $pdo->prepare("INSERT INTO hotels (
        id, vendor_id, name, area, location, price, stars, amenities, rating, badge, image, images_json,
        description, is_available, hotel_status, property_type, phone, email, website, checkin_time, checkout_time,
        address, city, state, country, pincode, gst_number, property_registration_no, facilities_json, wizard_step,
        profile_completion, approval_remarks, documents_json, admin_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");

    $stmt->execute([
        $id,
        $vendor_id,
        $payload['name'] ?? 'Untitled Hotel',
        $payload['area'] ?? ($payload['city'] ?? 'Goa'),
        $payload['location'] ?? ($payload['area'] ?? 'Goa'),
        intval($payload['price'] ?? ($payload['selling_price'] ?? ($payload['base_price'] ?? 5000))),
        intval($payload['stars'] ?? 4),
        $amenitiesStr,
        floatval($payload['rating'] ?? 4.5),
        $payload['badge'] ?? 'Standard',
        $image,
        $images_json,
        $payload['description'] ?? '',
        1,
        $payload['hotel_status'] ?? 'Submitted',
        $payload['property_type'] ?? 'Hotel',
        $payload['phone'] ?? '',
        $payload['email'] ?? '',
        $payload['website'] ?? '',
        $payload['checkin_time'] ?? '14:00',
        $payload['checkout_time'] ?? '11:00',
        $payload['address'] ?? '',
        $payload['city'] ?? 'Goa',
        $payload['state'] ?? 'Goa',
        $payload['country'] ?? 'India',
        $payload['pincode'] ?? '403001',
        $payload['gst_number'] ?? '',
        $payload['property_registration_no'] ?? '',
        json_encode($facilities),
        intval($payload['wizard_step'] ?? 10),
        intval($payload['profile_completion'] ?? 100),
        $payload['approval_remarks'] ?? '',
        $docsJson,
        $tenant_id
    ]);

    pmsLogAction($pdo, $vendor_id, 'Created Hotel Property', 'Hotels', "Hotel '{$payload['name']}' registered.");
    
    // Send operational notification
    try {
        $nId = 'notif-' . uniqid();
        $pdo->prepare("INSERT INTO hotel_notifications (id, vendor_id, title, message, type, is_read, created_at) VALUES (?, ?, ?, ?, 'hotel', 0, ?)")
            ->execute([$nId, $vendor_id, 'Hotel Registered', "Property '{$payload['name']}' was registered and submitted for review.", date('Y-m-d H:i:s')]);
    } catch (Exception $e) {}

    echo json_encode(["success" => true, "id" => $id, "message" => "Hotel created successfully."]);
    exit();

} elseif ($action === 'update_hotel') {
    $id = $payload['id'] ?? null;
    if (!$id) throw new Exception("Missing hotel ID.");

    // Multi-image handling
    $imagesList = [];
    if (!empty($payload['images']) && is_array($payload['images'])) {
        $imagesList = array_values(array_filter($payload['images']));
    } elseif (!empty($payload['images_json'])) {
        $decoded = is_string($payload['images_json']) ? json_decode($payload['images_json'], true) : $payload['images_json'];
        if (is_array($decoded)) $imagesList = array_values(array_filter($decoded));
    }
    if (empty($imagesList) && !empty($payload['image'])) {
        $imagesList = [$payload['image']];
    }
    $image = !empty($imagesList) ? $imagesList[0] : ($payload['image'] ?? '');
    $images_json = !empty($imagesList) ? json_encode($imagesList) : '[]';

    $facilities = !empty($payload['facilities']) ? (is_array($payload['facilities']) ? $payload['facilities'] : json_decode($payload['facilities'], true)) : [];
    $amenitiesStr = !empty($facilities) ? implode(', ', $facilities) : ($payload['amenities'] ?? '');
    $docsJson = isset($payload['documents_json']) ? (is_array($payload['documents_json']) ? json_encode($payload['documents_json']) : $payload['documents_json']) : null;

    $stmt = $pdo->prepare("UPDATE hotels SET 
        name=?, location=?, area=?, price=?, stars=?, description=?, image=?, images_json=?,
        property_type=?, phone=?, email=?, website=?, checkin_time=?, checkout_time=?,
        address=?, city=?, state=?, pincode=?, gst_number=?, property_registration_no=?,
        facilities_json=?, wizard_step=?, profile_completion=?, documents_json=COALESCE(?, documents_json)
        WHERE id=?");
    $stmt->execute([
        $payload['name'] ?? '',
        $payload['location'] ?? ($payload['area'] ?? 'Goa'),
        $payload['area'] ?? ($payload['city'] ?? 'Goa'),
        intval($payload['price'] ?? ($payload['selling_price'] ?? ($payload['base_price'] ?? 5000))),
        intval($payload['stars'] ?? 4),
        $payload['description'] ?? '',
        $image,
        $images_json,
        $payload['property_type'] ?? 'Hotel',
        $payload['phone'] ?? '',
        $payload['email'] ?? '',
        $payload['website'] ?? '',
        $payload['checkin_time'] ?? '14:00',
        $payload['checkout_time'] ?? '11:00',
        $payload['address'] ?? '',
        $payload['city'] ?? 'Goa',
        $payload['state'] ?? 'Goa',
        $payload['pincode'] ?? '403001',
        $payload['gst_number'] ?? '',
        $payload['property_registration_no'] ?? '',
        json_encode($facilities),
        intval($payload['wizard_step'] ?? 10),
        intval($payload['profile_completion'] ?? 100),
        $docsJson,
        $id
    ]);

    pmsLogAction($pdo, $vendor_id, 'Updated Hotel Profile', 'Hotels', "Hotel ID '{$id}' updated.");
    echo json_encode(["success" => true, "message" => "Hotel updated successfully."]);
    exit();

} elseif ($action === 'delete_hotel' || $action === 'delete_master_hotel') {
    $id = $payload['id'] ?? ($_GET['id'] ?? null);
    if (!$id) throw new Exception("Missing hotel ID.");
    
    $pdo->prepare("DELETE FROM hotels WHERE id = ?")->execute([$id]);
    $pdo->prepare("DELETE FROM hotel_room_types WHERE hotel_id = ?")->execute([$id]);
    $pdo->prepare("DELETE FROM hotel_rooms WHERE hotel_id = ?")->execute([$id]);
    $pdo->prepare("DELETE FROM hotel_availability_calendar WHERE hotel_id = ?")->execute([$id]);

    pmsLogAction($pdo, $vendor_id, 'Deleted Hotel', 'Hotels', "Hotel ID '{$id}' deleted.");
    echo json_encode(["success" => true, "message" => "Hotel deleted successfully."]);
    exit();

} elseif ($action === 'pms_update_hotel_status') {
    $id = $payload['hotel_id'] ?? ($payload['id'] ?? null);
    $status = $payload['hotel_status'] ?? ($payload['status'] ?? 'Live');
    $remarks = $payload['approval_remarks'] ?? ($payload['remarks'] ?? '');
    
    if (!$id) throw new Exception("Missing hotel ID.");
    $stmt = $pdo->prepare("UPDATE hotels SET hotel_status = ?, approval_remarks = ? WHERE id = ?");
    $stmt->execute([$status, $remarks, $id]);

    pmsLogAction($pdo, $vendor_id, 'Changed Hotel Status', 'Hotels', "Hotel ID '{$id}' changed to status '{$status}'.");
    echo json_encode(["success" => true, "message" => "Hotel status updated to {$status}."]);
    exit();

} elseif ($action === 'update_hotel_availability') {
    $id = $payload['id'] ?? null;
    if (!$id) throw new Exception("Missing hotel ID.");
    $blocked_dates = isset($payload['blocked_dates']) ? (is_array($payload['blocked_dates']) ? json_encode($payload['blocked_dates']) : $payload['blocked_dates']) : json_encode([]);
    $stmt = $pdo->prepare("UPDATE hotels SET blocked_dates=? WHERE id=?");
    $stmt->execute([$blocked_dates, $id]);
    echo json_encode(["success" => true, "message" => "Hotel availability updated."]);
    exit();

// 2. Room Types CRUD
} elseif ($action === 'pms_create_room_type') {
    $id = !empty($payload['id']) ? $payload['id'] : ('rt-' . uniqid());
    $hotel_id = $payload['hotel_id'] ?? '';
    
    $amenities = !empty($payload['amenities']) ? (is_array($payload['amenities']) ? json_encode($payload['amenities']) : $payload['amenities']) : '[]';
    $images = !empty($payload['images']) ? (is_array($payload['images']) ? json_encode($payload['images']) : $payload['images']) : '[]';

    $stmt = $pdo->prepare("INSERT INTO hotel_room_types (
        id, hotel_id, vendor_id, name, internal_code, description, total_rooms,
        max_adults, max_children, max_occupancy, base_occupancy, bed_type, num_beds,
        room_size, room_size_unit, view_type, smoking, air_conditioned, private_bathroom,
        extra_bed_available, base_price, selling_price, weekend_price, extra_adult_charge,
        extra_child_charge, extra_bed_charge, amenities_json, images_json, status,
        min_stay, max_stay, closed_to_arrival, closed_to_departure, stop_sell, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");

    $stmt->execute([
        $id,
        $hotel_id,
        $vendor_id,
        $payload['name'] ?? 'Standard Room',
        $payload['internal_code'] ?? 'STD',
        $payload['description'] ?? '',
        intval($payload['total_rooms'] ?? 5),
        intval($payload['max_adults'] ?? 2),
        intval($payload['max_children'] ?? 1),
        intval($payload['max_occupancy'] ?? 3),
        intval($payload['base_occupancy'] ?? 2),
        $payload['bed_type'] ?? 'King',
        intval($payload['num_beds'] ?? 1),
        $payload['room_size'] ?? '350',
        $payload['room_size_unit'] ?? 'sqft',
        $payload['view_type'] ?? 'Garden View',
        !empty($payload['smoking']) ? 1 : 0,
        !empty($payload['air_conditioned']) ? 1 : 0,
        !empty($payload['private_bathroom']) ? 1 : 0,
        !empty($payload['extra_bed_available']) ? 1 : 0,
        intval($payload['base_price'] ?? 5000),
        intval($payload['selling_price'] ?? 5500),
        intval($payload['weekend_price'] ?? 6500),
        intval($payload['extra_adult_charge'] ?? 1000),
        intval($payload['extra_child_charge'] ?? 500),
        intval($payload['extra_bed_charge'] ?? 800),
        $amenities,
        $images,
        $payload['status'] ?? 'Active',
        intval($payload['min_stay'] ?? 1),
        intval($payload['max_stay'] ?? 30),
        !empty($payload['closed_to_arrival']) ? 1 : 0,
        !empty($payload['closed_to_departure']) ? 1 : 0,
        !empty($payload['stop_sell']) ? 1 : 0,
        date('Y-m-d H:i:s')
    ]);

    pmsLogAction($pdo, $vendor_id, 'Created Room Type', 'Rooms', "Room Type '{$payload['name']}' created.");
    echo json_encode(["success" => true, "id" => $id, "message" => "Room type created successfully."]);
    exit();

} elseif ($action === 'pms_update_room_type') {
    $id = $payload['id'] ?? null;
    if (!$id) throw new Exception("Missing room type ID.");

    $amenities = !empty($payload['amenities']) ? (is_array($payload['amenities']) ? json_encode($payload['amenities']) : $payload['amenities']) : '[]';
    $images = !empty($payload['images']) ? (is_array($payload['images']) ? json_encode($payload['images']) : $payload['images']) : '[]';

    $stmt = $pdo->prepare("UPDATE hotel_room_types SET 
        name=?, internal_code=?, description=?, total_rooms=?, max_adults=?, max_children=?,
        max_occupancy=?, base_occupancy=?, bed_type=?, num_beds=?, room_size=?, room_size_unit=?,
        view_type=?, smoking=?, air_conditioned=?, private_bathroom=?, extra_bed_available=?,
        base_price=?, selling_price=?, weekend_price=?, extra_adult_charge=?, extra_child_charge=?,
        extra_bed_charge=?, amenities_json=?, images_json=?, status=?, min_stay=?, max_stay=?,
        closed_to_arrival=?, closed_to_departure=?, stop_sell=?
        WHERE id=?");

    $stmt->execute([
        $payload['name'] ?? '',
        $payload['internal_code'] ?? '',
        $payload['description'] ?? '',
        intval($payload['total_rooms'] ?? 5),
        intval($payload['max_adults'] ?? 2),
        intval($payload['max_children'] ?? 1),
        intval($payload['max_occupancy'] ?? 3),
        intval($payload['base_occupancy'] ?? 2),
        $payload['bed_type'] ?? 'King',
        intval($payload['num_beds'] ?? 1),
        $payload['room_size'] ?? '350',
        $payload['room_size_unit'] ?? 'sqft',
        $payload['view_type'] ?? 'Garden View',
        !empty($payload['smoking']) ? 1 : 0,
        !empty($payload['air_conditioned']) ? 1 : 0,
        !empty($payload['private_bathroom']) ? 1 : 0,
        !empty($payload['extra_bed_available']) ? 1 : 0,
        intval($payload['base_price'] ?? 5000),
        intval($payload['selling_price'] ?? 5500),
        intval($payload['weekend_price'] ?? 6500),
        intval($payload['extra_adult_charge'] ?? 1000),
        intval($payload['extra_child_charge'] ?? 500),
        intval($payload['extra_bed_charge'] ?? 800),
        $amenities,
        $images,
        $payload['status'] ?? 'Active',
        intval($payload['min_stay'] ?? 1),
        intval($payload['max_stay'] ?? 30),
        !empty($payload['closed_to_arrival']) ? 1 : 0,
        !empty($payload['closed_to_departure']) ? 1 : 0,
        !empty($payload['stop_sell']) ? 1 : 0,
        $id
    ]);

    pmsLogAction($pdo, $vendor_id, 'Updated Room Type', 'Rooms', "Room Type ID '{$id}' updated.");
    echo json_encode(["success" => true, "message" => "Room type updated successfully."]);
    exit();

} elseif ($action === 'pms_delete_room_type') {
    $id = $payload['id'] ?? null;
    if (!$id) throw new Exception("Missing room type ID.");
    
    $pdo->prepare("DELETE FROM hotel_room_types WHERE id = ?")->execute([$id]);
    $pdo->prepare("DELETE FROM hotel_rooms WHERE room_type_id = ?")->execute([$id]);
    
    pmsLogAction($pdo, $vendor_id, 'Deleted Room Type', 'Rooms', "Room Type ID '{$id}' deleted.");
    echo json_encode(["success" => true, "message" => "Room type deleted successfully."]);
    exit();

// 3. Physical Rooms CRUD & Bulk
} elseif ($action === 'pms_create_room') {
    $id = !empty($payload['id']) ? $payload['id'] : ('room-' . uniqid());
    $stmt = $pdo->prepare("INSERT INTO hotel_rooms (id, hotel_id, room_type_id, vendor_id, room_number, floor, status, internal_note) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([
        $id,
        $payload['hotel_id'] ?? '',
        $payload['room_type_id'] ?? '',
        $vendor_id,
        $payload['room_number'] ?? '101',
        $payload['floor'] ?? '1',
        $payload['status'] ?? 'Available',
        $payload['internal_note'] ?? ''
    ]);

    pmsLogAction($pdo, $vendor_id, 'Created Physical Room', 'Rooms', "Room '{$payload['room_number']}' added.");
    echo json_encode(["success" => true, "id" => $id, "message" => "Room created."]);
    exit();

} elseif ($action === 'pms_update_room') {
    $id = $payload['id'] ?? null;
    if (!$id) throw new Exception("Missing room ID.");
    
    $stmt = $pdo->prepare("UPDATE hotel_rooms SET floor=?, status=?, internal_note=? WHERE id=?");
    $stmt->execute([
        $payload['floor'] ?? '1',
        $payload['status'] ?? 'Available',
        $payload['internal_note'] ?? '',
        $id
    ]);

    pmsLogAction($pdo, $vendor_id, 'Updated Room Status', 'Front Desk', "Room ID '{$id}' status set to '{$payload['status']}'.");
    echo json_encode(["success" => true, "message" => "Room updated."]);
    exit();

} elseif ($action === 'pms_delete_room') {
    $id = $payload['id'] ?? null;
    if (!$id) throw new Exception("Missing room ID.");
    
    $pdo->prepare("DELETE FROM hotel_rooms WHERE id = ?")->execute([$id]);
    echo json_encode(["success" => true, "message" => "Room deleted."]);
    exit();

} elseif ($action === 'pms_bulk_rooms') {
    $hotel_id = $payload['hotel_id'] ?? '';
    $room_type_id = $payload['room_type_id'] ?? '';
    $rooms = $payload['rooms'] ?? [];
    
    $count = 0;
    foreach ($rooms as $rm) {
        $rId = 'room-' . uniqid();
        $stmt = $pdo->prepare("INSERT INTO hotel_rooms (id, hotel_id, room_type_id, vendor_id, room_number, floor, status, internal_note) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $rId,
            $hotel_id,
            $room_type_id ?: ($rm['room_type_id'] ?? ''),
            $vendor_id,
            $rm['room_number'] ?? '',
            $rm['floor'] ?? '1',
            $rm['status'] ?? 'Available',
            $rm['internal_note'] ?? ''
        ]);
        $count++;
    }
    pmsLogAction($pdo, $vendor_id, 'Bulk Added Rooms', 'Rooms', "Added {$count} physical rooms.");
    echo json_encode(["success" => true, "count" => $count, "message" => "Bulk rooms uploaded successfully."]);
    exit();

// 4. Availability Calendar & Pricing Overrides
} elseif ($action === 'pms_update_availability') {
    $hotel_id = $payload['hotel_id'] ?? '';
    $room_type_id = $payload['room_type_id'] ?? '';
    $dates = $payload['dates'] ?? [];
    $status = $payload['status'] ?? 'Available';
    $block_reason = $payload['block_reason'] ?? '';
    $available_rooms = isset($payload['available_rooms']) && $payload['available_rooms'] !== '' ? intval($payload['available_rooms']) : null;
    $price_override = isset($payload['price_override']) && $payload['price_override'] !== '' ? intval($payload['price_override']) : null;
    $min_stay = isset($payload['min_stay']) ? intval($payload['min_stay']) : 1;
    $stop_sale = !empty($payload['stop_sale']) ? 1 : 0;

    foreach ($dates as $d) {
        $cId = "cal-{$hotel_id}-{$room_type_id}-{$d}";
        $stmtChk = $pdo->prepare("SELECT id FROM hotel_availability_calendar WHERE hotel_id = ? AND room_type_id = ? AND date = ?");
        $stmtChk->execute([$hotel_id, $room_type_id, $d]);
        
        if ($stmtChk->fetch()) {
            $stmtUp = $pdo->prepare("UPDATE hotel_availability_calendar SET status=?, block_reason=?, available_rooms=COALESCE(?, available_rooms), price_override=?, min_stay=?, stop_sale=? WHERE hotel_id=? AND room_type_id=? AND date=?");
            $stmtUp->execute([$status, $block_reason, $available_rooms, $price_override, $min_stay, $stop_sale, $hotel_id, $room_type_id, $d]);
        } else {
            $stmtIns = $pdo->prepare("INSERT INTO hotel_availability_calendar (id, hotel_id, room_type_id, vendor_id, date, available_rooms, price_override, status, min_stay, stop_sale, block_reason) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $stmtIns->execute([$cId, $hotel_id, $room_type_id, $vendor_id, $d, $available_rooms ?: 5, $price_override, $status, $min_stay, $stop_sale, $block_reason]);
        }
    }

    pmsLogAction($pdo, $vendor_id, 'Updated Availability Calendar', 'Availability', "Updated " . count($dates) . " dates.");
    echo json_encode(["success" => true, "message" => "Availability and pricing updated for " . count($dates) . " dates."]);
    exit();

// 5. Rate Plans CRUD
} elseif ($action === 'pms_create_rate_plan') {
    $id = !empty($payload['id']) ? $payload['id'] : ('rp-' . uniqid());
    $stmt = $pdo->prepare("INSERT INTO hotel_rate_plans (id, hotel_id, vendor_id, room_type_id, name, meal_plan, price_type, base_price, weekend_price, extra_adult_rate, extra_child_rate, cancellation_policy, is_active, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([
        $id,
        $payload['hotel_id'] ?? '',
        $vendor_id,
        $payload['room_type_id'] ?? '',
        $payload['name'] ?? 'Standard Rate Plan',
        $payload['meal_plan'] ?? 'EP - Room Only',
        $payload['price_type'] ?? 'Fixed',
        intval($payload['base_price'] ?? 5000),
        intval($payload['weekend_price'] ?? 6000),
        intval($payload['extra_adult_rate'] ?? 1000),
        intval($payload['extra_child_rate'] ?? 500),
        $payload['cancellation_policy'] ?? 'Free cancellation up to 48 hours prior to check-in.',
        1,
        date('Y-m-d H:i:s')
    ]);

    pmsLogAction($pdo, $vendor_id, 'Created Rate Plan', 'Rates', "Rate plan '{$payload['name']}' created.");
    echo json_encode(["success" => true, "id" => $id, "message" => "Rate plan created."]);
    exit();

} elseif ($action === 'pms_update_rate_plan') {
    $id = $payload['id'] ?? null;
    if (!$id) throw new Exception("Missing rate plan ID.");
    
    $stmt = $pdo->prepare("UPDATE hotel_rate_plans SET name=?, meal_plan=?, price_type=?, base_price=?, weekend_price=?, extra_adult_rate=?, extra_child_rate=?, cancellation_policy=?, is_active=? WHERE id=?");
    $stmt->execute([
        $payload['name'] ?? '',
        $payload['meal_plan'] ?? 'EP - Room Only',
        $payload['price_type'] ?? 'Fixed',
        intval($payload['base_price'] ?? 5000),
        intval($payload['weekend_price'] ?? 6000),
        intval($payload['extra_adult_rate'] ?? 1000),
        intval($payload['extra_child_rate'] ?? 500),
        $payload['cancellation_policy'] ?? '',
        isset($payload['is_active']) ? intval($payload['is_active']) : 1,
        $id
    ]);

    pmsLogAction($pdo, $vendor_id, 'Updated Rate Plan', 'Rates', "Rate plan ID '{$id}' updated.");
    echo json_encode(["success" => true, "message" => "Rate plan updated."]);
    exit();

} elseif ($action === 'pms_delete_rate_plan') {
    $id = $payload['id'] ?? null;
    if (!$id) throw new Exception("Missing rate plan ID.");
    $pdo->prepare("DELETE FROM hotel_rate_plans WHERE id = ?")->execute([$id]);
    echo json_encode(["success" => true, "message" => "Rate plan deleted."]);
    exit();

// 6. Guest Directory CRUD
} elseif ($action === 'pms_create_guest') {
    $id = !empty($payload['id']) ? $payload['id'] : ('gst-' . uniqid());
    $stmt = $pdo->prepare("INSERT INTO hotel_guests (id, vendor_id, name, phone, email, id_type, id_number, address, city, vip, notes, total_stays, total_spend, last_visit, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([
        $id,
        $vendor_id,
        $payload['name'] ?? '',
        $payload['phone'] ?? '',
        $payload['email'] ?? '',
        $payload['id_type'] ?? 'Aadhaar Card',
        $payload['id_number'] ?? '',
        $payload['address'] ?? '',
        $payload['city'] ?? 'Goa',
        !empty($payload['vip']) ? 1 : 0,
        $payload['notes'] ?? '',
        intval($payload['total_stays'] ?? 1),
        intval($payload['total_spend'] ?? 0),
        $payload['last_visit'] ?? date('Y-m-d'),
        date('Y-m-d H:i:s')
    ]);

    echo json_encode(["success" => true, "id" => $id, "message" => "Guest record created."]);
    exit();

} elseif ($action === 'pms_update_guest') {
    $id = $payload['id'] ?? null;
    if (!$id) throw new Exception("Missing guest ID.");
    
    $stmt = $pdo->prepare("UPDATE hotel_guests SET name=?, phone=?, email=?, id_type=?, id_number=?, address=?, city=?, vip=?, notes=? WHERE id=?");
    $stmt->execute([
        $payload['name'] ?? '',
        $payload['phone'] ?? '',
        $payload['email'] ?? '',
        $payload['id_type'] ?? 'Aadhaar Card',
        $payload['id_number'] ?? '',
        $payload['address'] ?? '',
        $payload['city'] ?? 'Goa',
        !empty($payload['vip']) ? 1 : 0,
        $payload['notes'] ?? '',
        $id
    ]);

    echo json_encode(["success" => true, "message" => "Guest record updated."]);
    exit();

} elseif ($action === 'pms_delete_guest') {
    $id = $payload['id'] ?? null;
    if (!$id) throw new Exception("Missing guest ID.");
    $pdo->prepare("DELETE FROM hotel_guests WHERE id = ?")->execute([$id]);
    echo json_encode(["success" => true, "message" => "Guest deleted."]);
    exit();

// 7. Reviews & Ratings
} elseif ($action === 'pms_reply_review') {
    $id = $payload['id'] ?? null;
    $reply = $payload['reply'] ?? '';
    if (!$id) throw new Exception("Missing review ID.");

    $stmt = $pdo->prepare("UPDATE hotel_reviews SET reply = ?, replied_at = ? WHERE id = ?");
    $stmt->execute([$reply, date('Y-m-d H:i:s'), $id]);

    pmsLogAction($pdo, $vendor_id, 'Replied to Review', 'Reviews', "Replied to review ID '{$id}'.");
    echo json_encode(["success" => true, "message" => "Reply published successfully."]);
    exit();

// 8. Staff Management
} elseif ($action === 'pms_create_staff') {
    $id = !empty($payload['id']) ? $payload['id'] : ('stf-' . uniqid());
    $perms = !empty($payload['permissions']) ? (is_array($payload['permissions']) ? json_encode($payload['permissions']) : $payload['permissions']) : json_encode(['Front Desk', 'Reservations']);

    $stmt = $pdo->prepare("INSERT INTO hotel_staff (id, hotel_id, vendor_id, name, email, phone, role, status, permissions_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([
        $id,
        $payload['hotel_id'] ?? '',
        $vendor_id,
        $payload['name'] ?? '',
        $payload['email'] ?? '',
        $payload['phone'] ?? '',
        $payload['role'] ?? 'Front Desk',
        $payload['status'] ?? 'Active',
        $perms,
        date('Y-m-d H:i:s')
    ]);

    pmsLogAction($pdo, $vendor_id, 'Added Staff Member', 'Staff', "Staff member '{$payload['name']}' added.");
    echo json_encode(["success" => true, "id" => $id, "message" => "Staff member created."]);
    exit();

} elseif ($action === 'pms_update_staff') {
    $id = $payload['id'] ?? null;
    if (!$id) throw new Exception("Missing staff ID.");

    $perms = !empty($payload['permissions']) ? (is_array($payload['permissions']) ? json_encode($payload['permissions']) : $payload['permissions']) : json_encode(['Front Desk', 'Reservations']);

    $stmt = $pdo->prepare("UPDATE hotel_staff SET name=?, email=?, phone=?, role=?, status=?, permissions_json=? WHERE id=?");
    $stmt->execute([
        $payload['name'] ?? '',
        $payload['email'] ?? '',
        $payload['phone'] ?? '',
        $payload['role'] ?? 'Front Desk',
        $payload['status'] ?? 'Active',
        $perms,
        $id
    ]);

    pmsLogAction($pdo, $vendor_id, 'Updated Staff Member', 'Staff', "Staff ID '{$id}' updated.");
    echo json_encode(["success" => true, "message" => "Staff member updated."]);
    exit();

} elseif ($action === 'pms_delete_staff') {
    $id = $payload['id'] ?? null;
    if (!$id) throw new Exception("Missing staff ID.");
    $pdo->prepare("DELETE FROM hotel_staff WHERE id = ?")->execute([$id]);
    echo json_encode(["success" => true, "message" => "Staff member deleted."]);
    exit();

// 9. Notifications Management
} elseif ($action === 'pms_mark_notification_read') {
    $id = $payload['id'] ?? null;
    $all = !empty($payload['all']);

    if ($all) {
        $pdo->prepare("UPDATE hotel_notifications SET is_read = 1 WHERE vendor_id = ? OR vendor_id = 'u-5' OR vendor_id = 'hotel_vendor'")->execute([$vendor_id]);
    } elseif ($id) {
        $pdo->prepare("UPDATE hotel_notifications SET is_read = 1 WHERE id = ?")->execute([$id]);
    }
    echo json_encode(["success" => true, "message" => "Notifications updated."]);
    exit();

} elseif ($action === 'pms_delete_notification') {
    $id = $payload['id'] ?? null;
    $all = !empty($payload['all']);

    if ($all) {
        $pdo->prepare("DELETE FROM hotel_notifications WHERE vendor_id = ? OR vendor_id = 'u-5' OR vendor_id = 'hotel_vendor'")->execute([$vendor_id]);
    } elseif ($id) {
        $pdo->prepare("DELETE FROM hotel_notifications WHERE id = ?")->execute([$id]);
    }
    echo json_encode(["success" => true, "message" => "Notification(s) deleted."]);
    exit();

// 10. Support Tickets
} elseif ($action === 'pms_create_ticket') {
    $id = !empty($payload['id']) ? $payload['id'] : ('TCK-' . rand(10000, 99999));
    $stmt = $pdo->prepare("INSERT INTO hotel_support_tickets (id, vendor_id, subject, category, priority, message, status, replies_json, created_at) VALUES (?, ?, ?, ?, ?, ?, 'Open', '[]', ?)");
    $stmt->execute([
        $id,
        $vendor_id,
        $payload['subject'] ?? 'General Inquiry',
        $payload['category'] ?? 'General',
        $payload['priority'] ?? 'Medium',
        $payload['message'] ?? '',
        date('Y-m-d H:i:s')
    ]);

    pmsLogAction($pdo, $vendor_id, 'Created Support Ticket', 'Support', "Ticket #{$id} opened.");
    echo json_encode(["success" => true, "id" => $id, "message" => "Support ticket created successfully."]);
    exit();

} elseif ($action === 'pms_reply_ticket') {
    $id = $payload['id'] ?? null;
    $replyMsg = $payload['message'] ?? ($payload['reply'] ?? '');
    if (!$id) throw new Exception("Missing ticket ID.");

    $stmt = $pdo->prepare("SELECT replies_json FROM hotel_support_tickets WHERE id = ?");
    $stmt->execute([$id]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    $replies = $row && !empty($row['replies_json']) ? json_decode($row['replies_json'], true) : [];
    
    $replies[] = [
        'id' => 'rep-' . uniqid(),
        'sender' => 'Vendor (' . ($payload['username'] ?? 'Vendor') . ')',
        'message' => $replyMsg,
        'created_at' => date('Y-m-d H:i:s')
    ];

    $stmtUp = $pdo->prepare("UPDATE hotel_support_tickets SET replies_json = ? WHERE id = ?");
    $stmtUp->execute([json_encode($replies), $id]);

    echo json_encode(["success" => true, "message" => "Reply added successfully."]);
    exit();

// 11. Activity Logger Action
} elseif ($action === 'pms_log_activity') {
    pmsLogAction($pdo, $vendor_id, $payload['action'] ?? 'Action', $payload['module'] ?? 'System', $payload['details'] ?? '');
    echo json_encode(["success" => true]);
    exit();

// 12. Manual Booking Creation
} elseif ($action === 'pms_create_manual_booking') {
    $bookingId = 'BK-' . rand(10000, 99999);
    $hotel_id = $payload['hotel_id'] ?? '';
    $hotel_name = $payload['hotel_name'] ?? 'Hotel Room Booking';
    $nights = intval($payload['nights'] ?? 1);
    $total_amount = intval($payload['total_amount'] ?? ($payload['total_paid'] ?? 5000));
    $amount_paid = intval($payload['amount_paid'] ?? $total_amount);
    $remaining = max(0, $total_amount - $amount_paid);

    $stmt = $pdo->prepare("INSERT INTO bookings (
        id, name, phone, email, pickup_loc, pickup_date, pickup_time, drop_date, drop_time,
        item_id, item_name, booking_days, total_amount, amount_paid, remaining_amount, total_paid,
        status, payment_status, payment_method, admin_id, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");

    $stmt->execute([
        $bookingId,
        $payload['guest_name'] ?? ($payload['name'] ?? 'Guest'),
        $payload['phone'] ?? '',
        $payload['email'] ?? '',
        $payload['location'] ?? 'Goa',
        $payload['checkin_date'] ?? ($payload['pickup_date'] ?? date('Y-m-d')),
        $payload['checkin_time'] ?? '14:00',
        $payload['checkout_date'] ?? ($payload['drop_date'] ?? date('Y-m-d', strtotime('+1 day'))),
        $payload['checkout_time'] ?? '11:00',
        $hotel_id,
        $hotel_name,
        $nights,
        $total_amount,
        $amount_paid,
        $remaining,
        $total_amount,
        $payload['status'] ?? 'Confirmed',
        $payload['payment_status'] ?? ($amount_paid >= $total_amount ? 'Paid' : 'Partially Paid'),
        $payload['payment_method'] ?? 'Cash at Desk',
        $tenant_id,
        date('Y-m-d H:i:s')
    ]);

    // Auto-record in guest directory
    try {
        $gstChk = $pdo->prepare("SELECT id FROM hotel_guests WHERE phone = ?");
        $gstChk->execute([$payload['phone'] ?? '']);
        if (!$gstChk->fetch() && !empty($payload['guest_name'])) {
            $gId = 'gst-' . uniqid();
            $pdo->prepare("INSERT INTO hotel_guests (id, vendor_id, name, phone, email, total_stays, total_spend, last_visit, created_at) VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?)")
                ->execute([$gId, $vendor_id, $payload['guest_name'], $payload['phone'] ?? '', $payload['email'] ?? '', $total_amount, $payload['checkin_date'] ?? date('Y-m-d'), date('Y-m-d H:i:s')]);
        }
    } catch (Exception $ge) {}

    pmsLogAction($pdo, $vendor_id, 'Created Manual Reservation', 'Bookings', "Reservation #{$bookingId} created for {$payload['guest_name']}.");
    
    // Create notification
    try {
        $nId = 'notif-' . uniqid();
        $pdo->prepare("INSERT INTO hotel_notifications (id, vendor_id, title, message, type, is_read, created_at) VALUES (?, ?, ?, ?, 'booking', 0, ?)")
            ->execute([$nId, $vendor_id, 'New Booking Created', "Reservation #{$bookingId} created for {$payload['guest_name']}.", date('Y-m-d H:i:s')]);
    } catch (Exception $ne) {}

    echo json_encode(["success" => true, "id" => $bookingId, "message" => "Reservation created successfully."]);
    exit();
}
