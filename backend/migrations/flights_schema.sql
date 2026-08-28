-- Flight Searches Table
CREATE TABLE IF NOT EXISTS flight_searches (
    id VARCHAR(50) PRIMARY KEY,
    user_id INT NULL,
    offer_request_id VARCHAR(100) NOT NULL,
    trip_type VARCHAR(20) NOT NULL,
    origin VARCHAR(10) NOT NULL,
    destination VARCHAR(10) NOT NULL,
    departure_date DATE NOT NULL,
    return_date DATE NULL,
    cabin_class VARCHAR(20) NOT NULL,
    adult_count INT DEFAULT 1,
    child_count INT DEFAULT 0,
    infant_count INT DEFAULT 0,
    currency VARCHAR(10) NOT NULL,
    live_mode BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL
);

-- Flight Offers Table
CREATE TABLE IF NOT EXISTS flight_offers (
    id VARCHAR(50) PRIMARY KEY,
    search_id VARCHAR(50) NOT NULL,
    duffel_offer_id VARCHAR(100) NOT NULL,
    owner_airline VARCHAR(100) NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    total_currency VARCHAR(10) NOT NULL,
    base_amount DECIMAL(10, 2) NOT NULL,
    tax_amount DECIMAL(10, 2) NOT NULL,
    expires_at TIMESTAMP NULL,
    status VARCHAR(50) NOT NULL,
    normalized_response JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (search_id) REFERENCES flight_searches(id)
);

-- Flight Bookings Table (Drop the old simple one and recreate if needed, or alter)
-- Wait, I created flight_bookings earlier. Let's drop it and recreate with new schema.
DROP TABLE IF EXISTS flight_bookings;
CREATE TABLE flight_bookings (
    id VARCHAR(50) PRIMARY KEY,
    booking_number VARCHAR(50) UNIQUE NOT NULL,
    user_id INT NULL,
    search_id VARCHAR(50) NOT NULL,
    duffel_offer_id VARCHAR(100) NOT NULL,
    duffel_order_id VARCHAR(100) NULL,
    booking_reference VARCHAR(50) NULL,
    status VARCHAR(50) NOT NULL,
    provider_status VARCHAR(50) NULL,
    payment_status VARCHAR(50) NOT NULL,
    customer_amount DECIMAL(10, 2) NOT NULL,
    customer_currency VARCHAR(10) NOT NULL,
    duffel_amount DECIMAL(10, 2) NOT NULL,
    duffel_currency VARCHAR(10) NOT NULL,
    service_fee DECIMAL(10, 2) DEFAULT 0,
    live_mode BOOLEAN DEFAULT FALSE,
    provider_request_id VARCHAR(100) NULL,
    failure_code VARCHAR(100) NULL,
    failure_message TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (search_id) REFERENCES flight_searches(id)
);

-- Flight Passengers Table
CREATE TABLE IF NOT EXISTS flight_passengers (
    id VARCHAR(50) PRIMARY KEY,
    booking_id VARCHAR(50) NOT NULL,
    duffel_passenger_id VARCHAR(100) NOT NULL,
    passenger_type VARCHAR(20) NOT NULL,
    title VARCHAR(20) NULL,
    given_name VARCHAR(100) NOT NULL,
    family_name VARCHAR(100) NOT NULL,
    born_on DATE NOT NULL,
    gender VARCHAR(10) NOT NULL,
    nationality VARCHAR(10) NULL,
    encrypted_passport_number TEXT NULL,
    passport_expiry DATE NULL,
    email VARCHAR(100) NULL,
    phone VARCHAR(50) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES flight_bookings(id) ON DELETE CASCADE
);

-- Flight Payments Table
CREATE TABLE IF NOT EXISTS flight_payments (
    id VARCHAR(50) PRIMARY KEY,
    booking_id VARCHAR(50) NOT NULL,
    gateway VARCHAR(50) NOT NULL,
    gateway_order_id VARCHAR(100) NULL,
    gateway_payment_id VARCHAR(100) NULL,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL,
    status VARCHAR(50) NOT NULL,
    verified_at TIMESTAMP NULL,
    refund_status VARCHAR(50) NULL,
    refund_reference VARCHAR(100) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES flight_bookings(id) ON DELETE CASCADE
);

-- Flight Services Table (Add-ons, Seats)
CREATE TABLE IF NOT EXISTS flight_services (
    id VARCHAR(50) PRIMARY KEY,
    booking_id VARCHAR(50) NOT NULL,
    passenger_id VARCHAR(50) NOT NULL,
    segment_id VARCHAR(100) NOT NULL,
    duffel_service_id VARCHAR(100) NOT NULL,
    service_type VARCHAR(50) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL,
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES flight_bookings(id) ON DELETE CASCADE,
    FOREIGN KEY (passenger_id) REFERENCES flight_passengers(id) ON DELETE CASCADE
);

-- Webhook Events Table
CREATE TABLE IF NOT EXISTS flight_webhook_events (
    id VARCHAR(50) PRIMARY KEY,
    provider_event_id VARCHAR(100) UNIQUE NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    payload JSON NOT NULL,
    processing_status VARCHAR(50) NOT NULL,
    processed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
