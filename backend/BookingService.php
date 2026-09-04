<?php
/**
 * WOW GOA - Central Authoritative Booking Service (Phase 4, 5, 6)
 *
 * Single authoritative backend booking pipeline handling:
 * - Authentication & input validation
 * - Authoritative shared inventory availability & anti-double-booking validation
 * - Authoritative server-side B2B pricing calculation
 * - Customer identity & permanent DOB management
 * - Customer wallet deduction with transaction safety
 * - Master booking insertion
 * - Master-Child booking creation for packages (Hotel, Vehicle, Driver child allocations)
 * - Atomic database transactions with rollback on failure
 */

class BookingServiceException extends Exception {
    protected $httpCode = 400;
    protected $isConflict = false;

    public function __construct($message, $httpCode = 400, $isConflict = false) {
        parent::__construct($message);
        $this->httpCode = $httpCode;
        $this->isConflict = $isConflict;
    }

    public function getHttpCode() {
        return $this->httpCode;
    }

    public function isConflict() {
        return $this->isConflict;
    }
}

class BookingService {

    /**
     * Create an authoritative booking (D2C or B2B) within an atomic database transaction.
     *
     * @param PDO $pdo Active PDO database handle
     * @param array $payload Client booking request payload
     * @param array|null $actor Authenticated actor (partner or user)
     * @param string $channel 'D2C' or 'B2B'
     * @return array Standardized booking response
     * @throws BookingServiceException
     */
    public static function createBooking(PDO $pdo, array $payload, ?array $actor = null, string $channel = 'D2C'): array {
        $channel = strtoupper(trim($channel ?: 'D2C'));
        $isB2B = ($channel === 'B2B');

        // 1. Idempotency Check
        $idempotencyKey = trim($payload['idempotency_key'] ?? '');
        if (!empty($idempotencyKey)) {
            $stmtIdemp = $pdo->prepare("SELECT * FROM bookings WHERE idempotency_key = ? LIMIT 1");
            $stmtIdemp->execute([$idempotencyKey]);
            $existing = $stmtIdemp->fetch(PDO::FETCH_ASSOC);
            if ($existing) {
                return [
                    'success' => true,
                    'idempotent' => true,
                    'message' => 'Booking retrieved via idempotency key.',
                    'booking_id' => $existing['id'],
                    'id' => $existing['id'],
                    'booking' => $existing,
                    'data' => $existing
                ];
            }
        }

        // 2. Validate Guest / Customer Details
        $custName = trim($payload['name'] ?? ($payload['customer_name'] ?? ($payload['guest_name'] ?? ($payload['customer']['name'] ?? ''))));
        $rawPhone = preg_replace('/\D/', '', $payload['phone'] ?? ($payload['customer_phone'] ?? ($payload['guest_phone'] ?? ($payload['customer']['phone'] ?? ''))));
        $custEmail = strtolower(trim($payload['email'] ?? ($payload['customer_email'] ?? ($payload['guest_email'] ?? ($payload['customer']['email'] ?? '')))));
        $rawDob = trim($payload['date_of_birth'] ?? ($payload['dob'] ?? ($payload['guest_dob'] ?? ($payload['customer']['dob'] ?? ''))));

        if (empty($custName)) {
            throw new BookingServiceException("Guest / Customer name is required.", 400);
        }
        if (empty($rawPhone) || strlen($rawPhone) < 10) {
            throw new BookingServiceException("A valid 10-digit mobile phone number is required.", 400);
        }

        $last10 = substr($rawPhone, -10);

        // 3. Normalise Dates, Service Type & Item
        $depDate = $payload['start_date'] ?? ($payload['departure_date'] ?? ($payload['pickup_date'] ?? ($payload['check_in_date'] ?? date('Y-m-d'))));
        $retDate = $payload['end_date'] ?? ($payload['return_date'] ?? ($payload['drop_date'] ?? ($payload['check_out_date'] ?? date('Y-m-d', strtotime('+1 day')))));
        $depDate = substr(trim($depDate), 0, 10);
        $retDate = substr(trim($retDate), 0, 10);

        $calcDays = 1;
        if (!empty($depDate) && !empty($retDate)) {
            $tDiff = strtotime($retDate) - strtotime($depDate);
            if ($tDiff > 0) {
                $calcDays = max(1, (int)round($tDiff / 86400));
            }
        }
        $daysCount = max(1, intval($payload['booking_days'] ?? ($payload['days'] ?? $calcDays)));
        $qtyCount = max(1, intval($payload['qty'] ?? ($payload['num_rooms'] ?? ($payload['guests'] ?? 1))));
        $durationVal = $payload['duration'] ?? ($daysCount . ' Nights / ' . ($daysCount + 1) . ' Days');

        $serviceType = strtolower(trim($payload['type'] ?? ($payload['service_type'] ?? 'package')));
        if ($serviceType === 'car' || $serviceType === 'bike' || $serviceType === 'selfdrive') {
            $serviceType = 'vehicle';
        }
        $itemId = trim($payload['item_id'] ?? '');

        // 4. Begin Database Transaction
        $pdo->beginTransaction();

        try {
            // 5. Anti-Double-Booking & Shared Physical Inventory Check (Phase 3 & Phase 7)
            $allocatedPhysicalUnitId = null;
            $authoritativeVendorId = null;
            if (!empty($itemId) && function_exists('checkInventoryAvailability')) {
                $avail = checkInventoryAvailability($pdo, $serviceType, $itemId, $depDate, $retDate);
                if (!$avail['available']) {
                    throw new BookingServiceException($avail['reason'] ?? "The selected item is already reserved or unavailable for the chosen dates.", 409, true);
                }
                $allocatedPhysicalUnitId = $avail['physical_unit_id'] ?? ($avail['allocated_unit']['id'] ?? null);
                $authoritativeVendorId = $avail['vendor_id'] ?? ($avail['allocated_unit']['vendor_id'] ?? null);
            }

            // Authoritative server-side vendor determination (Never trust client payload or query params)
            if (empty($authoritativeVendorId) && !empty($itemId)) {
                if ($serviceType === 'vehicle') {
                    $stmtV = $pdo->prepare("SELECT vendor_id FROM cars WHERE id = ?");
                    $stmtV->execute([$itemId]);
                    $vRow = $stmtV->fetch(PDO::FETCH_ASSOC);
                    if (!$vRow) {
                        $stmtV = $pdo->prepare("SELECT vendor_id FROM bikes WHERE id = ?");
                        $stmtV->execute([$itemId]);
                        $vRow = $stmtV->fetch(PDO::FETCH_ASSOC);
                    }
                    if ($vRow && !empty($vRow['vendor_id'])) {
                        $authoritativeVendorId = $vRow['vendor_id'];
                    }
                } elseif ($serviceType === 'hotel') {
                    $stmtH = $pdo->prepare("SELECT vendor_id FROM hotels WHERE id = ?");
                    $stmtH->execute([$itemId]);
                    $hRow = $stmtH->fetch(PDO::FETCH_ASSOC);
                    if ($hRow && !empty($hRow['vendor_id'])) {
                        $authoritativeVendorId = $hRow['vendor_id'];
                    }
                }
            }

            // 6. Authoritative Pricing Calculation (Phase 5)
            $totalAmount = 0;
            $amountPaid = 0;
            $remainingAmount = 0;
            $driverReq = 0;
            $driverDays = 0;
            $driverCharge = 0;
            $driverEarning = 0;
            $driverPaymentStatus = 'Pending';
            $commercials = null;
            $itemName = $payload['item_name'] ?? 'Trip Booking';
            $ratePerDay = floatval($payload['price'] ?? 1500);
            $imageVal = $payload['vehicle_image'] ?? ($payload['image'] ?? ($payload['image_url'] ?? ''));

            // Authoritative driver_service_type determination (Rule 3)
            // Valid values: strictly PICKUP, DROP, FULL. NULL/empty = no driver job.
            $rawServiceType = strtoupper(trim($payload['driver_service_type'] ?? ($payload['extra_details']['driver_service_type'] ?? '')));
            $driverServiceType = null;
            if (in_array($rawServiceType, ['PICKUP', 'DROP', 'FULL'])) {
                $driverServiceType = $rawServiceType;
            } elseif (!empty($payload['driver_required']) && ($payload['driver_required'] == 1 || $payload['driver_required'] === '1' || $payload['driver_required'] === 'yes' || $payload['driver_required'] === true)) {
                // Backward-compatible fallback for legacy payloads if explicit driver_required passed without driver_service_type
                $driverServiceType = 'FULL';
            }

            $driverReq = $driverServiceType ? 1 : 0;
            if ($driverServiceType === 'PICKUP' || $driverServiceType === 'DROP') {
                $driverDays = 1;
                $driverCharge = 400;
                $driverEarning = 400;
            } elseif ($driverServiceType === 'FULL') {
                $driverDays = max(1, intval($payload['driver_days'] ?? $daysCount));
                $driverCharge = 800 * $driverDays;
                $driverEarning = 800 * $driverDays;
            } else {
                $driverDays = 0;
                $driverCharge = 0;
                $driverEarning = 0;
            }

            if ($isB2B) {
                // Authoritative B2B pricing calculation with rule precedence
                $b2bMode = strtoupper(trim($payload['b2b_mode'] ?? 'COMMISSION'));
                if (function_exists('calculateAuthoritativeB2BPrice')) {
                    $pricing = calculateAuthoritativeB2BPrice($pdo, $serviceType, $itemId, $daysCount, $qtyCount, $payload, $actor, $b2bMode);
                } else {
                    $pricing = [
                        'item_name' => $payload['item_name'] ?? 'Booking Item',
                        'item_image' => '',
                        'final_payable_amount' => floatval($payload['total_amount'] ?? 0)
                    ];
                }

                $itemName = $pricing['item_name'];
                if (empty($imageVal) && !empty($pricing['item_image'])) {
                    $imageVal = $pricing['item_image'];
                }

                $totalAmount = $pricing['final_payable_amount'];
                $amountPaid = $totalAmount;
                $remainingAmount = 0;
                $commercials = $pricing;
            } else {
                // Authoritative D2C calculation
                $totalAmount = floatval($payload['total_amount'] ?? ($payload['total_paid'] ?? 0));
                $amountPaid = floatval($payload['amount_paid'] ?? ($payload['total_paid'] ?? $totalAmount));
                $remainingAmount = max(0, $totalAmount - $amountPaid);

                // Fetch image if not present
                if (empty($imageVal) && !empty($itemId)) {
                    $stmtImg = $pdo->prepare("SELECT image FROM cars WHERE id = ?");
                    $stmtImg->execute([$itemId]);
                    $imgRow = $stmtImg->fetch(PDO::FETCH_ASSOC);
                    if (!$imgRow) {
                        $stmtImgB = $pdo->prepare("SELECT image FROM bikes WHERE id = ?");
                        $stmtImgB->execute([$itemId]);
                        $imgRow = $stmtImgB->fetch(PDO::FETCH_ASSOC);
                    }
                    if (!$imgRow) {
                        $stmtImgH = $pdo->prepare("SELECT image FROM hotels WHERE id = ?");
                        $stmtImgH->execute([$itemId]);
                        $imgRow = $stmtImgH->fetch(PDO::FETCH_ASSOC);
                    }
                    if ($imgRow && !empty($imgRow['image'])) {
                        $imageVal = $imgRow['image'];
                    }
                }
            }

            // 7. Customer Identity & Permanent DOB Management
            $custDob = null;
            if (!empty($last10)) {
                try {
                    $chkCust = $pdo->prepare("SELECT id, name, phone, email, date_of_birth FROM users WHERE (phone != '' AND (phone LIKE ? OR phone LIKE ?)) OR (email != '' AND LOWER(email) = ?) LIMIT 1");
                    $chkCust->execute(["%$last10", "%$rawPhone", $custEmail]);
                    $existingCust = $chkCust->fetch(PDO::FETCH_ASSOC);

                    if ($existingCust) {
                        if (!empty($existingCust['date_of_birth'])) {
                            // Retain existing stored DOB - NEVER overwrite
                            $custDob = $existingCust['date_of_birth'];
                        } elseif (!empty($rawDob)) {
                            $custDob = $rawDob;
                            $updCust = $pdo->prepare("UPDATE users SET date_of_birth = ? WHERE id = ?");
                            $updCust->execute([$custDob, $existingCust['id']]);
                        }
                    } else {
                        // Create new customer profile with mandatory DOB
                        $custDob = !empty($rawDob) ? $rawDob : null;
                        $newCustId = 'c_' . $last10;
                        $chkExistingId = $pdo->prepare("SELECT id FROM users WHERE id = ?");
                        $chkExistingId->execute([$newCustId]);
                        if (!$chkExistingId->fetch()) {
                            $insCust = $pdo->prepare("INSERT INTO users (id, username, name, email, phone, role, status, date_of_birth, created_at) VALUES (?, ?, ?, ?, ?, 'customer', 'active', ?, ?)");
                            $insCust->execute([$newCustId, $rawPhone, $custName, $custEmail, $rawPhone, $custDob, date('Y-m-d H:i:s')]);
                        }
                    }
                } catch (Exception $ce) {}

                if (empty($custDob) && !empty($rawDob)) {
                    $custDob = $rawDob;
                }
            }

            // 8. Generate Authoritative Master Booking ID
            $bookingId = !empty($payload['id']) ? $payload['id'] : ($isB2B ? ('TG-B2B-' . strtoupper(substr(uniqid(), -6))) : ('TG-' . rand(100000, 999999)));

            // 9. Customer Wallet Deduction (D2C)
            $walletAmountUsed = max(0, round(floatval($payload['wallet_amount_used'] ?? 0), 2));
            $cashbackEarned = 0;
            $cashbackStatus = 'Pending';
            if ($walletAmountUsed > 0 && function_exists('deductCustomerWallet')) {
                deductCustomerWallet($pdo, $rawPhone, 'c_' . $last10, $walletAmountUsed, $bookingId);
            }
            if (!$isB2B) {
                $eligiblePaidAmt = max(0, $totalAmount - $walletAmountUsed);
                $cashbackEarned = round($eligiblePaidAmt * 0.10, 2);
            }

            // 10. Insert Authoritative Master Booking
            $initStatus = $payload['status'] ?? 'Confirmed';
            $paymentStatus = $payload['payment_status'] ?? 'Paid';
            $paymentMethod = $payload['payment_method'] ?? ($payload['payment_mode'] ?? ($isB2B ? 'B2B Account / Cash' : 'Cash'));
            $tenantId = $payload['tenant_id'] ?? ($actor['tenant_id'] ?? 'admin');

            $sqlMaster = "INSERT INTO bookings (
                id, parent_booking_id, name, phone, email, license, pickup_loc, pickup_date, pickup_time, drop_date, drop_time,
                departure_date, return_date, check_in_date, check_out_date, duration, item_id, item_name,
                booking_days, total_amount, amount_paid, remaining_amount, total_paid, status, payment_status,
                customizations, created_at, payment_method, admin_id, driver_required, driver_charge,
                driver_days, driver_earning, driver_payment_status, image, vehicle_image, date_of_birth,
                type, wallet_amount_used, cashback_earned, cashback_status,
                booking_channel, b2b_mode, b2b_partner_id, b2b_partner_name,
                b2b_original_price, b2b_base_price, b2b_tax_amount,
                b2b_commission_percentage, b2b_commission_amount, b2b_commission_status,
                b2b_net_discount_percentage, b2b_net_price, b2b_pricing_rule_id, idempotency_key,
                vendor_id, physical_unit_id, driver_service_type
            ) VALUES (
                ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?,
                ?, ?, ?, ?,
                ?, ?, ?,
                ?, ?, ?,
                ?, ?, ?, ?,
                ?, ?, ?
            )";

            $stmtMaster = $pdo->prepare($sqlMaster);
            $stmtMaster->execute([
                $bookingId,
                $custName,
                $rawPhone,
                $custEmail,
                $payload['license'] ?? '',
                $payload['pickup_loc'] ?? ($payload['pickup_location'] ?? 'Goa'),
                $depDate,
                $payload['pickup_time'] ?? '10:00 AM',
                $retDate,
                $payload['drop_time'] ?? '10:00 AM',
                $depDate,
                $retDate,
                $depDate,
                $retDate,
                $durationVal,
                $itemId,
                $itemName,
                $daysCount,
                $totalAmount,
                $amountPaid,
                $remainingAmount,
                $amountPaid,
                $initStatus,
                $paymentStatus,
                is_array($payload['customizations'] ?? null) ? json_encode($payload['customizations']) : ($payload['customizations'] ?? null),
                date('Y-m-d H:i:s'),
                $paymentMethod,
                $tenantId,
                $driverReq,
                $driverCharge,
                $driverDays,
                $driverEarning,
                $driverPaymentStatus,
                $imageVal,
                $imageVal,
                $custDob,
                $serviceType,
                $walletAmountUsed,
                $cashbackEarned,
                $cashbackStatus,
                $channel,
                $commercials['b2b_mode'] ?? null,
                $actor['id'] ?? ($payload['b2b_partner_id'] ?? null),
                $actor['company_name'] ?? ($actor['name'] ?? ($payload['b2b_partner_name'] ?? null)),
                $commercials['original_reference_price'] ?? null,
                $commercials['base_price'] ?? null,
                $commercials['tax_amount'] ?? null,
                $commercials['commission_percent'] ?? null,
                $commercials['commission_amount'] ?? null,
                $commercials ? 'Approved' : null,
                $commercials['net_discount_percent'] ?? null,
                $commercials['net_price'] ?? null,
                $commercials['pricing_rule_id'] ?? null,
                $idempotencyKey ?: null,
                $authoritativeVendorId,
                $allocatedPhysicalUnitId,
                $driverServiceType
            ]);

            // 11. Master-Child Booking Creation for Package Bookings (Phase 6)
            $children = [];
            if ($serviceType === 'package') {
                $children = self::createPackageChildBookings($pdo, $bookingId, $itemId, $payload, $depDate, $retDate, $daysCount, $custName, $rawPhone, $custEmail, $tenantId);
            }

            // 12. Commit Transaction
            $pdo->commit();

            // 13. Central Notification Dispatch (Phase 8)
            try {
                if (function_exists('createAuthoritativeNotification')) {
                    $custRecipient = !empty($last10) ? ('c_' . $last10) : $rawPhone;
                    createAuthoritativeNotification(
                        $pdo,
                        $custRecipient,
                        'customer',
                        'booking_confirmed',
                        'Booking Confirmed #' . $bookingId,
                        "Your booking for {$itemName} has been confirmed.",
                        'booking',
                        $bookingId
                    );

                    if (!empty($authoritativeVendorId)) {
                        // Determine correct vendor role based on service type
                        $vendorRole = ($serviceType === 'hotel') ? 'hotel_vendor' : 'vendor';
                        $notifType = ($serviceType === 'hotel') ? 'hotel_booking' : 'vehicle_booking';
                        
                        createAuthoritativeNotification(
                            $pdo,
                            $authoritativeVendorId,
                            $vendorRole,
                            $notifType,
                            'New Booking Received #' . $bookingId,
                            "New reservation received for {$itemName}" . ($allocatedPhysicalUnitId ? " (Unit: {$allocatedPhysicalUnitId})" : "") . ".",
                            'booking',
                            $bookingId
                        );
                    }

                    if ($isB2B && !empty($actor['id'])) {
                        createAuthoritativeNotification(
                            $pdo,
                            $actor['id'],
                            'b2b',
                            'b2b_booking_confirmed',
                            'B2B Booking Confirmed #' . $bookingId,
                            "B2B reservation for {$itemName} confirmed.",
                            'booking',
                            $bookingId,
                            $actor['id']
                        );
                    }

                    createAuthoritativeNotification(
                        $pdo,
                        'admin',
                        'admin',
                        'booking_created',
                        'New ' . $channel . ' Booking #' . $bookingId,
                        "{$channel} booking created by {$custName} for {$itemName}.",
                        'booking',
                        $bookingId
                    );
                }
            } catch (Exception $ne) {}

            // 13. Fetch Final Created Master Booking Record
            $stmtFetch = $pdo->prepare("SELECT * FROM bookings WHERE id = ?");
            $stmtFetch->execute([$bookingId]);
            $createdRecord = $stmtFetch->fetch(PDO::FETCH_ASSOC);

            return [
                'success' => true,
                'booking_id' => $bookingId,
                'id' => $bookingId,
                'message' => $isB2B ? 'B2B booking confirmed successfully.' : 'Booking created successfully.',
                'booking' => $createdRecord,
                'data' => $createdRecord,
                'children' => $children,
                'commercials' => $commercials
            ];

        } catch (BookingServiceException $bse) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            throw $bse;
        } catch (Exception $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            throw new BookingServiceException("Booking failed: " . $e->getMessage(), 400);
        }
    }

    /**
     * Create child operational bookings for a Master Package booking (Phase 6).
     * Allocates hotel room, vehicle rental, and driver transfer under the same transaction.
     */
    private static function createPackageChildBookings(
        PDO $pdo,
        string $masterBookingId,
        string $packageId,
        array $payload,
        string $pickupDate,
        string $dropDate,
        int $daysCount,
        string $custName,
        string $custPhone,
        string $custEmail,
        string $tenantId
    ): array {
        $children = [];

        // Fetch package details
        $stmtPkg = $pdo->prepare("SELECT * FROM packages WHERE id = ?");
        $stmtPkg->execute([$packageId]);
        $pkg = $stmtPkg->fetch(PDO::FETCH_ASSOC);

        $hotelName = $payload['hotel_name'] ?? ($pkg['hotel_included'] ?? '');
        $carName = $payload['car_name'] ?? ($pkg['car_included'] ?? '');
        $pickupDropInc = $payload['pickup_drop_included'] ?? ($pkg['pickup_drop_included'] ?? '');
        $driverReq = (!empty($payload['driver_required']) || !empty($pickupDropInc));

        // 1. Hotel Child Allocation
        if (!empty($hotelName)) {
            // Find hotel in inventory
            $stmtH = $pdo->prepare("SELECT id, name, is_available, blocked_dates FROM hotels WHERE name = ? OR id = ? OR name LIKE ? LIMIT 1");
            $stmtH->execute([$hotelName, $hotelName, "%$hotelName%"]);
            $hotel = $stmtH->fetch(PDO::FETCH_ASSOC);
            $hotelId = $hotel['id'] ?? ('hotel-pkg-' . substr(md5($hotelName), 0, 8));

            // Availability validation for hotel component
            if ($hotel) {
                $hAvail = checkInventoryAvailability($pdo, 'hotel', $hotel['id'], $pickupDate, $dropDate);
                if (!$hAvail['available']) {
                    throw new BookingServiceException("Package Hotel Allocation Failed: " . ($hAvail['reason'] ?? "Hotel unavailable."), 409, true);
                }
            }

            $childHotelId = 'BK-H-' . strtoupper(substr(uniqid(), -6));
            $hChildVendorId = $hAvail['vendor_id'] ?? ($hotel['vendor_id'] ?? null);
            $stmtInsH = $pdo->prepare("INSERT INTO bookings (
                id, parent_booking_id, name, phone, email, item_id, item_name, type,
                pickup_date, drop_date, check_in_date, check_out_date, booking_days,
                status, payment_status, total_amount, amount_paid, created_at, admin_id,
                vendor_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 'hotel', ?, ?, ?, ?, ?, 'Confirmed', 'Paid', 0, 0, ?, ?, ?)");
            $stmtInsH->execute([
                $childHotelId,
                $masterBookingId,
                $custName,
                $custPhone,
                $custEmail,
                $hotelId,
                $hotel['name'] ?? $hotelName,
                $pickupDate,
                $dropDate,
                $pickupDate,
                $dropDate,
                $daysCount,
                date('Y-m-d H:i:s'),
                $tenantId,
                $hChildVendorId
            ]);
            $children['hotel'] = $childHotelId;
        }

        // 2. Vehicle Child Allocation
        if (!empty($carName)) {
            // Find car in inventory
            $stmtC = $pdo->prepare("SELECT id, name, is_available, vendor_id FROM cars WHERE name = ? OR id = ? OR name LIKE ? LIMIT 1");
            $stmtC->execute([$carName, $carName, "%$carName%"]);
            $car = $stmtC->fetch(PDO::FETCH_ASSOC);
            $carId = $car['id'] ?? ('car-pkg-' . substr(md5($carName), 0, 8));

            // Availability validation for vehicle component
            $vChildUnitId = null;
            $vChildVendorId = $car['vendor_id'] ?? null;
            if ($car) {
                $vAvail = checkInventoryAvailability($pdo, 'car', $car['id'], $pickupDate, $dropDate);
                if (!$vAvail['available']) {
                    throw new BookingServiceException("Package Vehicle Allocation Failed: " . ($vAvail['reason'] ?? "Vehicle unavailable."), 409, true);
                }
                $vChildUnitId = $vAvail['physical_unit_id'] ?? null;
                $vChildVendorId = $vAvail['vendor_id'] ?? ($car['vendor_id'] ?? null);
            }

            $childVehId = 'BK-V-' . strtoupper(substr(uniqid(), -6));
            $stmtInsV = $pdo->prepare("INSERT INTO bookings (
                id, parent_booking_id, name, phone, email, item_id, item_name, type,
                pickup_date, drop_date, departure_date, return_date, booking_days,
                status, payment_status, total_amount, amount_paid, created_at, admin_id,
                vendor_id, physical_unit_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 'car', ?, ?, ?, ?, ?, 'Confirmed', 'Paid', 0, 0, ?, ?, ?, ?)");
            $stmtInsV->execute([
                $childVehId,
                $masterBookingId,
                $custName,
                $custPhone,
                $custEmail,
                $carId,
                $car['name'] ?? $carName,
                $pickupDate,
                $dropDate,
                $pickupDate,
                $dropDate,
                $daysCount,
                date('Y-m-d H:i:s'),
                $tenantId,
                $vChildVendorId,
                $vChildUnitId
            ]);
            $children['vehicle'] = $childVehId;
        }

        // 3. Driver Child Allocation
        if ($driverReq) {
            $childDriverId = 'BK-D-' . strtoupper(substr(uniqid(), -6));
            $driverDays = $daysCount;
            // Driver standard rates: ₹800/day (₹400 pickup + ₹400 drop)
            $driverCharge = 800 * $driverDays;
            $stmtInsD = $pdo->prepare("INSERT INTO bookings (
                id, parent_booking_id, name, phone, email, item_id, item_name, type,
                pickup_date, drop_date, driver_required, driver_days, driver_charge,
                driver_earning, driver_job_status, driver_payment_status,
                status, payment_status, total_amount, amount_paid, created_at, admin_id
            ) VALUES (?, ?, ?, ?, ?, 'driver-transfer', 'Airport Transfer & Sightseeing Driver', 'driver', ?, ?, 1, ?, ?, ?, 'Pending', 'Pending', 'Confirmed', 'Paid', 0, 0, ?, ?)");
            $stmtInsD->execute([
                $childDriverId,
                $masterBookingId,
                $custName,
                $custPhone,
                $custEmail,
                $pickupDate,
                $dropDate,
                $driverDays,
                $driverCharge,
                $driverCharge,
                date('Y-m-d H:i:s'),
                $tenantId
            ]);
            $children['driver'] = $childDriverId;
        }

        return $children;
    }
}
