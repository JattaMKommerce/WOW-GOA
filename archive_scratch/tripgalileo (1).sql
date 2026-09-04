-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jul 17, 2026 at 06:20 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `tripgalileo`
--

-- --------------------------------------------------------

--
-- Table structure for table `add_ons`
--

CREATE TABLE `add_ons` (
  `id` int(11) NOT NULL,
  `title` varchar(255) DEFAULT NULL,
  `type` varchar(50) DEFAULT NULL,
  `location` varchar(100) DEFAULT NULL,
  `price` int(11) DEFAULT NULL,
  `duration` varchar(50) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `image_url` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `ai_leads`
--

CREATE TABLE `ai_leads` (
  `id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `phone` varchar(255) NOT NULL,
  `created_at` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `ai_leads`
--

INSERT INTO `ai_leads` (`id`, `name`, `phone`, `created_at`) VALUES
('ai-6a56018b73577', 'Test Lead', '1234567890', '2026-07-14 11:29:47'),
('ai-6a5729ec95e2b', 'ashwin', '78411728568', '2026-07-15 08:34:20'),
('ai-6a573ec45a7fd', 'Test', '1234567890', '2026-07-15 10:03:16'),
('ai-6a573fbaa76ac', 'ashwini', '741172653', '2026-07-15 10:07:22'),
('ai-6a5891467dfb3', 'ashwini', '7411725695', '2026-07-16 10:07:34');

-- --------------------------------------------------------

--
-- Table structure for table `bikes`
--

CREATE TABLE `bikes` (
  `id` varchar(50) NOT NULL,
  `vendor_id` varchar(50) DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `category` varchar(100) NOT NULL,
  `price` int(11) NOT NULL,
  `engine` varchar(50) NOT NULL,
  `fuel` varchar(50) NOT NULL,
  `mileage` varchar(50) NOT NULL,
  `rating` decimal(3,2) DEFAULT 4.70,
  `badge` varchar(50) DEFAULT 'Popular',
  `image` text NOT NULL,
  `is_available` tinyint(1) DEFAULT 1,
  `location` varchar(100) DEFAULT 'Goa',
  `documents_json` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `bookings`
--

CREATE TABLE `bookings` (
  `id` varchar(50) NOT NULL,
  `name` varchar(255) NOT NULL,
  `phone` varchar(50) NOT NULL,
  `license` varchar(100) DEFAULT NULL,
  `pickup_loc` varchar(255) NOT NULL,
  `pickup_date` varchar(50) NOT NULL,
  `pickup_time` varchar(50) NOT NULL,
  `drop_date` varchar(50) NOT NULL,
  `drop_time` varchar(50) NOT NULL,
  `item_id` varchar(50) NOT NULL,
  `item_name` varchar(255) NOT NULL,
  `booking_days` int(11) NOT NULL,
  `total_paid` int(11) NOT NULL,
  `created_at` datetime NOT NULL,
  `customizations` text DEFAULT NULL,
  `payment_method` varchar(50) DEFAULT NULL,
  `payment_proof` varchar(255) DEFAULT NULL,
  `status` varchar(50) DEFAULT 'Draft',
  `payment_status` varchar(50) DEFAULT 'Pending',
  `traveller_details_json` text DEFAULT NULL,
  `price_breakdown_json` text DEFAULT NULL,
  `total_amount` int(11) DEFAULT 0,
  `amount_paid` int(11) DEFAULT 0,
  `remaining_amount` int(11) DEFAULT 0,
  `payment_due_date` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `bookings`
--

INSERT INTO `bookings` (`id`, `name`, `phone`, `license`, `pickup_loc`, `pickup_date`, `pickup_time`, `drop_date`, `drop_time`, `item_id`, `item_name`, `booking_days`, `total_paid`, `created_at`, `customizations`, `payment_method`, `payment_proof`, `status`, `payment_status`, `traveller_details_json`, `price_breakdown_json`, `total_amount`, `amount_paid`, `remaining_amount`, `payment_due_date`) VALUES
('TG-225048', 'yyy yyy', '9513700902', '', 'Calangute (North Goa)', '2026-07-08', '10:00', '2026-07-11', '10:00', '6a561d8cc7b12', 'Ultimate Goa Premium Experience', 3, 0, '2026-07-15 07:20:58', '{\"withFlight\":false,\"cabType\":\"company\",\"selectedSelfDriveVehicle\":null,\"airportTransit\":false,\"sightseeingPrefs\":{\"0\":{\"included\":true,\"locations\":[\"North Goa\"]},\"1\":{\"included\":true,\"locations\":[\"South Goa\"]}},\"selectedAddOns\":{},\"selectedHotels\":{},\"selectedTransfers\":{},\"appliedCoupon\":\"HGY\"}', NULL, NULL, 'Draft', 'Pending', NULL, NULL, 0, 0, 0, NULL),
('TG-276666', 'rohan', '985253764', '', '', '2026-07-07', '10:00', '2026-07-09', '10:00', 'pkg-1784183801030', 'tets', 2, 9688, '2026-07-16 14:05:51', NULL, NULL, NULL, 'Confirmed', 'Full', NULL, NULL, 9688, 9688, 0, NULL),
('TG-488056', 'fghj', '8904489513', '', 'Calangute (North Goa)', '2026-07-07', '10:00', '2026-07-09', '10:00', 'pkg-1784006227274', 'test', 2, 10629, '2026-07-14 09:09:52', '{\"withFlight\":false,\"cabType\":\"company\",\"selectedSelfDriveVehicle\":null,\"airportTransit\":false}', NULL, NULL, 'Draft', 'Pending', NULL, NULL, 0, 0, 0, NULL),
('TG-683664', 'assss jty', '7411728653', '', 'Calangute (North Goa)', '2026-07-07', '10:00', '2026-07-09', '10:00', '6a561d8cc7b12', 'Ultimate Goa Premium Experience', 2, 25999, '2026-07-15 07:07:37', '{\"withFlight\":false,\"cabType\":\"company\",\"selectedSelfDriveVehicle\":null,\"airportTransit\":false,\"sightseeingPrefs\":{\"0\":{\"included\":true,\"locations\":[\"North Goa\"]},\"1\":{\"included\":true,\"locations\":[\"South Goa\"]}},\"selectedAddOns\":{},\"selectedHotels\":{},\"selectedTransfers\":{},\"appliedCoupon\":null}', NULL, NULL, 'Draft', 'Pending', NULL, NULL, 0, 0, 0, NULL),
('TG-745878', 'aashwini s', '47558415875', '', 'Calangute (North Goa)', '2026-07-07', '10:00', '2026-07-09', '10:00', 'pkg-1784181268766', 'test', 2, 0, '2026-07-16 08:08:52', '{\"withFlight\":false,\"cabType\":\"self-drive\",\"selectedSelfDriveVehicle\":\"car-1\",\"airportTransit\":false,\"sightseeingPrefs\":{\"0\":{\"included\":true,\"locations\":[\"Church\",\"Goa Beach\"]},\"1\":{\"included\":true,\"locations\":[\"United States\"]}},\"selectedAddOns\":{},\"selectedHotels\":{},\"selectedTransfers\":{},\"appliedCoupon\":null}', NULL, NULL, 'Confirmed', 'Full', '{\"adults\":1,\"children\":0,\"list\":[{\"type\":\"Adult\",\"firstName\":\"aashwini\",\"lastName\":\"s\",\"gender\":\"\",\"age\":\"22\",\"idType\":\"Aadhaar\"}],\"contactEmail\":\"a@gmail.com\",\"contactPhone\":\"47558415875\"}', '{\"base_price\":3000,\"total_price\":6200,\"breakdown\":{\"withFlight\":false,\"cabType\":\"self-drive\",\"selectedSelfDriveVehicle\":\"car-1\",\"airportTransit\":false,\"sightseeingPrefs\":[{\"included\":true,\"locations\":[\"Church\",\"Goa Beach\"]},{\"included\":true,\"locations\":[\"United States\"]}],\"selectedAddOns\":[],\"selectedHotels\":[],\"selectedTransfers\":[],\"appliedCoupon\":null}}', 6200, 0, 0, NULL),
('TG-868499', 'yuiop[', '8965210365', '', 'Baga Beach (North Goa)', '2026-07-09', '10:00', '2026-07-11', '10:00', 'pkg-1784007545188', 'test', 2, 10738, '2026-07-14 08:13:16', NULL, NULL, NULL, 'Draft', 'Pending', NULL, NULL, 0, 0, 0, NULL),
('TG-877771', 'Rudra M  fghj', '74117258659', '', 'hubli', '2026-07-25', '10:00', '2026-07-09', '10:00', '6a561d8cc7b12', 'Ultimate Goa Premium Experience', 16, 0, '2026-07-15 09:03:05', '{\"withFlight\":false,\"cabType\":\"company\",\"selectedSelfDriveVehicle\":null,\"airportTransit\":false,\"sightseeingPrefs\":{\"0\":{\"included\":true,\"locations\":[\"North Goa\"]},\"1\":{\"included\":true,\"locations\":[\"South Goa\"]}},\"selectedAddOns\":{},\"selectedHotels\":{},\"selectedTransfers\":{},\"appliedCoupon\":null}', NULL, NULL, 'Draft', 'Pending', NULL, NULL, 0, 0, 0, NULL),
('TG-937092', 'ashwini', '7411728653', '', 'Calangute (North Goa)', '2026-07-07', '10:00', '2026-07-09', '10:00', 'pkg-1784006227274', 'test', 2, 23151, '2026-07-14 07:22:06', NULL, NULL, NULL, 'Draft', 'Pending', NULL, NULL, 0, 0, 0, NULL),
('TG-969163', 'ashwini shivalli', '7411728653', '', 'Calangute (North Goa)', '2026-07-07', '10:00', '2026-07-09', '10:00', '6a561d8cc7b12', 'Ultimate Goa Premium Experience', 2, 25999, '2026-07-14 14:24:38', '{\"withFlight\":false,\"cabType\":\"company\",\"selectedSelfDriveVehicle\":null,\"airportTransit\":false,\"sightseeingPrefs\":{\"0\":{\"included\":true,\"locations\":[\"North Goa\"]},\"1\":{\"included\":true,\"locations\":[\"South Goa\"]}},\"selectedAddOns\":{},\"selectedHotels\":{},\"selectedTransfers\":{},\"appliedCoupon\":null}', NULL, NULL, 'Draft', 'Pending', NULL, NULL, 0, 0, 0, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `booking_payments`
--

CREATE TABLE `booking_payments` (
  `id` int(11) NOT NULL,
  `booking_id` varchar(255) DEFAULT NULL,
  `transaction_id` varchar(255) DEFAULT NULL,
  `amount` int(11) DEFAULT NULL,
  `method` varchar(50) DEFAULT NULL,
  `status` varchar(50) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `cars`
--

CREATE TABLE `cars` (
  `id` varchar(50) NOT NULL,
  `vendor_id` varchar(50) DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `category` varchar(100) NOT NULL,
  `price` int(11) NOT NULL,
  `seating` varchar(50) NOT NULL,
  `fuel` varchar(50) NOT NULL,
  `transmission` varchar(50) NOT NULL,
  `rating` decimal(3,2) DEFAULT 4.80,
  `badge` varchar(50) DEFAULT 'Popular',
  `image` text NOT NULL,
  `is_available` tinyint(1) DEFAULT 1,
  `location` varchar(100) DEFAULT 'Goa',
  `documents_json` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `cars`
--

INSERT INTO `cars` (`id`, `vendor_id`, `name`, `category`, `price`, `seating`, `fuel`, `transmission`, `rating`, `badge`, `image`, `is_available`, `location`, `documents_json`) VALUES
('car-vendor-1784200993554', 'vendor-1784200910786', 'Ashwini', 'Car', 2222, '5 Seater', 'Petrol', 'Automatic', 4.80, 'Popular', 'blob:http://localhost:5173/9c1243b8-ac16-474d-a1ca-64ed4cd227b7', 1, 'Goa', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `coupons`
--

CREATE TABLE `coupons` (
  `id` int(11) NOT NULL,
  `code` varchar(50) DEFAULT NULL,
  `discount_value` int(11) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `coupons`
--

INSERT INTO `coupons` (`id`, `code`, `discount_value`, `is_active`, `created_at`) VALUES
(1, 'HGY', 144, 1, '2026-07-14 11:27:15');

-- --------------------------------------------------------

--
-- Table structure for table `destinations`
--

CREATE TABLE `destinations` (
  `id` varchar(50) NOT NULL,
  `name` varchar(255) NOT NULL,
  `region` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `tag` varchar(255) NOT NULL,
  `image` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `destinations`
--

INSERT INTO `destinations` (`id`, `name`, `region`, `description`, `tag`, `image`) VALUES
('dest-1', 'Wow Goa', 'India', 'The ultimate beach paradise! Explore sandy shores, Portuguese heritage, open-air shacks, and active water sports.', 'Sun, Sand & Seafood', 'https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=800&q=80'),
('dest-2', 'Wow Dubai', 'Middle East', 'A futuristic oasis. Marvel at Burj Khalifa, shop at massive malls, enjoy desert safaris, and visit artificial islands.', 'Luxury & Skyline', 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=80'),
('dest-3', 'Wow Europe', 'Europe', 'Breathtaking scenery and history! Wander through the streets of Paris, Venice, and Swiss Alps chalet pathways.', 'Heritage & Landscapes', 'https://images.unsplash.com/photo-1473951574080-01fe45ec8643?auto=format&fit=crop&w=800&q=80'),
('dest-4', 'Wow Maldives', 'Tropical Islands', 'Incredible water bungalows, transparent turquoise lagoons, colorful coral reefs, and romantic sunset cruises.', 'Private Luxury Residing', 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=800&q=80'),
('dest-5', 'Wow Bali', 'Asia', 'Lush green terraced rice paddies, serene volcanic mountains, iconic sea temples, and spiritual beach culture.', 'Nature & Spirituality', 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=800&q=80'),
('dest-6', 'Wow Thailand', 'Asia', 'Vibrant street foods, ornate golden Buddhist shrines, busy night bazaars, and beautiful tropical islands like Phuket.', 'Culture & Nightlife', 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=800&q=80');

-- --------------------------------------------------------

--
-- Table structure for table `flights`
--

CREATE TABLE `flights` (
  `id` int(11) NOT NULL,
  `airline` varchar(100) DEFAULT NULL,
  `flight_number` varchar(100) DEFAULT NULL,
  `departure_time` varchar(100) DEFAULT NULL,
  `arrival_time` varchar(100) DEFAULT NULL,
  `price` int(11) DEFAULT NULL,
  `from_loc` varchar(50) DEFAULT NULL,
  `to_loc` varchar(50) DEFAULT NULL,
  `duration` varchar(50) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `flights`
--

INSERT INTO `flights` (`id`, `airline`, `flight_number`, `departure_time`, `arrival_time`, `price`, `from_loc`, `to_loc`, `duration`, `created_at`) VALUES
(1, 'IndiGo', NULL, '06:30', '09:05', 4401, 'BANGLORE', 'GOA', '2h 35m', '2026-07-14 04:32:45'),
(2, 'Air India', NULL, '10:15', '13:00', 6767, 'BANGLORE', 'GOA', '2h 45m', '2026-07-14 04:32:56'),
(3, 'Vistara', NULL, '14:20', '18:45', 6829, 'GOA', 'PUNE', '4h 25m', '2026-07-15 07:15:15');

-- --------------------------------------------------------

--
-- Table structure for table `flight_bookings`
--

CREATE TABLE `flight_bookings` (
  `id` varchar(50) NOT NULL,
  `booking_number` varchar(50) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `search_id` varchar(50) NOT NULL,
  `duffel_offer_id` varchar(100) NOT NULL,
  `duffel_order_id` varchar(100) DEFAULT NULL,
  `booking_reference` varchar(50) DEFAULT NULL,
  `status` varchar(50) NOT NULL,
  `provider_status` varchar(50) DEFAULT NULL,
  `payment_status` varchar(50) NOT NULL,
  `customer_amount` decimal(10,2) NOT NULL,
  `customer_currency` varchar(10) NOT NULL,
  `duffel_amount` decimal(10,2) NOT NULL,
  `duffel_currency` varchar(10) NOT NULL,
  `service_fee` decimal(10,2) DEFAULT 0.00,
  `live_mode` tinyint(1) DEFAULT 0,
  `provider_request_id` varchar(100) DEFAULT NULL,
  `failure_code` varchar(100) DEFAULT NULL,
  `failure_message` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `flight_offers`
--

CREATE TABLE `flight_offers` (
  `id` varchar(50) NOT NULL,
  `search_id` varchar(50) NOT NULL,
  `duffel_offer_id` varchar(100) NOT NULL,
  `owner_airline` varchar(100) NOT NULL,
  `total_amount` decimal(10,2) NOT NULL,
  `total_currency` varchar(10) NOT NULL,
  `base_amount` decimal(10,2) NOT NULL,
  `tax_amount` decimal(10,2) NOT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `status` varchar(50) NOT NULL,
  `normalized_response` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`normalized_response`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `flight_passengers`
--

CREATE TABLE `flight_passengers` (
  `id` varchar(50) NOT NULL,
  `booking_id` varchar(50) NOT NULL,
  `duffel_passenger_id` varchar(100) NOT NULL,
  `passenger_type` varchar(20) NOT NULL,
  `title` varchar(20) DEFAULT NULL,
  `given_name` varchar(100) NOT NULL,
  `family_name` varchar(100) NOT NULL,
  `born_on` date NOT NULL,
  `gender` varchar(10) NOT NULL,
  `nationality` varchar(10) DEFAULT NULL,
  `encrypted_passport_number` text DEFAULT NULL,
  `passport_expiry` date DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `flight_payments`
--

CREATE TABLE `flight_payments` (
  `id` varchar(50) NOT NULL,
  `booking_id` varchar(50) NOT NULL,
  `gateway` varchar(50) NOT NULL,
  `gateway_order_id` varchar(100) DEFAULT NULL,
  `gateway_payment_id` varchar(100) DEFAULT NULL,
  `amount` decimal(10,2) NOT NULL,
  `currency` varchar(10) NOT NULL,
  `status` varchar(50) NOT NULL,
  `verified_at` timestamp NULL DEFAULT NULL,
  `refund_status` varchar(50) DEFAULT NULL,
  `refund_reference` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `flight_searches`
--

CREATE TABLE `flight_searches` (
  `id` varchar(50) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `offer_request_id` varchar(100) NOT NULL,
  `trip_type` varchar(20) NOT NULL,
  `origin` varchar(10) NOT NULL,
  `destination` varchar(10) NOT NULL,
  `departure_date` date NOT NULL,
  `return_date` date DEFAULT NULL,
  `cabin_class` varchar(20) NOT NULL,
  `adult_count` int(11) DEFAULT 1,
  `child_count` int(11) DEFAULT 0,
  `infant_count` int(11) DEFAULT 0,
  `currency` varchar(10) NOT NULL,
  `live_mode` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `expires_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `flight_services`
--

CREATE TABLE `flight_services` (
  `id` varchar(50) NOT NULL,
  `booking_id` varchar(50) NOT NULL,
  `passenger_id` varchar(50) NOT NULL,
  `segment_id` varchar(100) NOT NULL,
  `duffel_service_id` varchar(100) NOT NULL,
  `service_type` varchar(50) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `currency` varchar(10) NOT NULL,
  `status` varchar(50) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `flight_webhook_events`
--

CREATE TABLE `flight_webhook_events` (
  `id` varchar(50) NOT NULL,
  `provider_event_id` varchar(100) NOT NULL,
  `event_type` varchar(100) NOT NULL,
  `payload` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`payload`)),
  `processing_status` varchar(50) NOT NULL,
  `processed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `hotels`
--

CREATE TABLE `hotels` (
  `id` varchar(50) NOT NULL,
  `name` varchar(255) NOT NULL,
  `area` varchar(255) NOT NULL,
  `price` int(11) NOT NULL,
  `stars` int(11) NOT NULL,
  `amenities` text NOT NULL,
  `rating` decimal(3,2) DEFAULT 4.60,
  `badge` varchar(50) DEFAULT 'Premium',
  `image` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `hotels`
--

INSERT INTO `hotels` (`id`, `name`, `area`, `price`, `stars`, `amenities`, `rating`, `badge`, `image`) VALUES
('HTL-28566', 'Moustache Goa Luxuria', 'Goa', 4145, 2, 'Breakfast ($), Free Wi-Fi, Free parking, Outdoor pool, Air conditioning', 4.40, 'Live Search', 'https://lh3.googleusercontent.com/gps-cs-s/AHRPTWkX1yEgeoMfkWNJ6nLFjjVcozHXVcmxxyTx_tL9mZAuFoG-73AlhCZNJdg44jSaBDgOcAcLlcQ2egx8ehMpYDwHhH2s3ztrqd_MyIS-Oer0_PYuxYcdVGDbaR-x1t0ff7koDT0=s287-w287-h192-n-k-no-v1'),
('HTL-75215', 'JW Marriott Goa', 'Goa', 60545, 5, 'Free breakfast, Free Wi-Fi, Free parking, Outdoor pool, Hot tub', 4.60, 'Live Search', 'https://lh3.googleusercontent.com/gps-cs-s/APNQkAEUwAzyyO5z64pz6lnTsjN_KvEWVq_-KNiV9N1xc0uZTqmjsHsju2k9322uyUPms7TPxTb0rpppg2_PPU0x-ox0EdBHP7cwbdHcASkpMqcw-2vLQrKbSDFPrE2QN-lcoZ29jlUT5sxwqAK2=s287-w287-h192-n-k-no-v1');

-- --------------------------------------------------------

--
-- Table structure for table `packages`
--

CREATE TABLE `packages` (
  `id` varchar(50) NOT NULL,
  `name` varchar(255) NOT NULL,
  `duration` varchar(100) NOT NULL,
  `car_included` varchar(255) DEFAULT NULL,
  `hotel_included` varchar(255) DEFAULT NULL,
  `price` int(11) NOT NULL,
  `description` text NOT NULL,
  `tag` varchar(100) DEFAULT 'Popular',
  `image` text NOT NULL,
  `package_type` varchar(100) DEFAULT 'Complete Package',
  `flights_included` varchar(255) DEFAULT NULL,
  `food_included` varchar(255) DEFAULT NULL,
  `pickup_drop_included` varchar(255) DEFAULT NULL,
  `places_included` text DEFAULT NULL,
  `price_with_flight` int(11) DEFAULT NULL,
  `is_flight_customizable` tinyint(1) DEFAULT 0,
  `base_flight_price` int(11) DEFAULT 0,
  `is_cab_customizable` tinyint(1) DEFAULT 0,
  `company_cab_price` int(11) DEFAULT 0,
  `day_wise_itinerary` text DEFAULT NULL,
  `pickup_drop_price` int(11) DEFAULT 0,
  `pickup_drop_image` text DEFAULT NULL,
  `cancellation_policy` text DEFAULT NULL,
  `highlights_json` text DEFAULT NULL,
  `inclusions_exclusions_json` text DEFAULT NULL,
  `advance_percentage` int(11) DEFAULT 25,
  `package_addons_json` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `packages`
--

INSERT INTO `packages` (`id`, `name`, `duration`, `car_included`, `hotel_included`, `price`, `description`, `tag`, `image`, `package_type`, `flights_included`, `food_included`, `pickup_drop_included`, `places_included`, `price_with_flight`, `is_flight_customizable`, `base_flight_price`, `is_cab_customizable`, `company_cab_price`, `day_wise_itinerary`, `pickup_drop_price`, `pickup_drop_image`, `cancellation_policy`, `highlights_json`, `inclusions_exclusions_json`, `advance_percentage`, `package_addons_json`) VALUES
('pkg-1784183801030', 'tets', '1 Nights / 1 Days', NULL, 'JW Marriott Goa', 3999, 'test', 'New Package', 'http://localhost/tripgalileo/backend/uploads/img_6a587b0fcb1bc.jpg', 'Self Drive Package', 'IndiGo Round Trip', 'Breakfast & Dinner Included', 'test', 'Baga Beach, Baga, Calangute, Bardez, North Goa, Goa, India | Goa Catholic Church, Seonsan-daero, Goa-eup, Gumi-si, North Gyeongsang, 39142, South Korea | Goa Velha Church, MDR1, Goa Velha, Palem, Tiswadi, North Goa, Goa, 403203, India', 14999, 0, 0, 1, 300, '[{\"day\":1,\"title\":\"tets\",\"activities\":\"\",\"meals\":\"test\",\"hotel\":\"test\",\"images\":[],\"location\":\"\",\"tips\":\"\",\"morning\":\"test\",\"afternoon\":\"test\",\"evening\":\"test\",\"night\":\"test\",\"sightseeing_locations\":[{\"name\":\"Goa\",\"map_query\":\"Goa, India\",\"tips\":\"Coordinates: 15.3004543,74.0855134\"},{\"name\":\"Fort\",\"map_query\":\"Fort, A Ward, Mumbai Zone 1, Mumbai City District, Maharashtra, 400038, India\",\"tips\":\"Coordinates: 18.9332665,72.8345146\"}]}]', 200, 'http://localhost/tripgalileo/backend/uploads/img_6a587b6728f20.jpeg', 'test', 'tes1\ntest2\ntest3\ntest4', 'test', 8, '[{\"title\":\"scuba\",\"type\":\"Activity\",\"location\":\"ee\",\"price\":\"300\",\"duration\":\"3\",\"description\":\"rrrr\",\"image_url\":\"\",\"id\":\"addon-1784183784075\"},{\"title\":\"rr\",\"type\":\"Activity\",\"location\":\"ree\",\"price\":\"222\",\"duration\":\"2\",\"description\":\"ssd\",\"image_url\":\"\",\"id\":\"addon-1784183799146\"}]');

-- --------------------------------------------------------

--
-- Table structure for table `package_reviews`
--

CREATE TABLE `package_reviews` (
  `id` int(11) NOT NULL,
  `package_id` varchar(255) DEFAULT NULL,
  `user_name` varchar(255) DEFAULT NULL,
  `rating` int(11) DEFAULT NULL,
  `review_text` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `payment_settings`
--

CREATE TABLE `payment_settings` (
  `id` int(11) NOT NULL,
  `razorpay_enabled` tinyint(1) DEFAULT 0,
  `upi_enabled` tinyint(1) DEFAULT 1,
  `razorpay_key` varchar(255) DEFAULT NULL,
  `razorpay_secret` varchar(255) DEFAULT NULL,
  `upi_id` varchar(255) DEFAULT NULL,
  `upi_qr_url` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `payment_settings`
--

INSERT INTO `payment_settings` (`id`, `razorpay_enabled`, `upi_enabled`, `razorpay_key`, `razorpay_secret`, `upi_id`, `upi_qr_url`) VALUES
(1, 0, 1, 'rakhi@gmail.com', 'Jatta@2026', 'md.jattamkommerce@idbi', 'http://localhost/tripgalileo/backend/uploads/img_6a55dfe08397d.jpeg');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` varchar(50) NOT NULL,
  `username` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` varchar(50) NOT NULL,
  `created_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `username`, `email`, `password_hash`, `role`, `created_at`) VALUES
('u-1', 'superadmin', 'superadmin@gmail.com', '$2y$10$WKsb0a6yQSD3mgDbllPpPeOXxKhxOC4lmXh5uFC57nvccFXkkXQL6', 'superadmin', '2026-07-07 09:07:22'),
('u-2', 'admin', 'admin@gmail.com', '$2y$10$QqAyefcu9PdebfSlewl.XeM1pLZcxgjA.3zNKiC.vrk8dHIQj4bzO', 'admin', '2026-07-07 09:07:22'),
('u-3', 'vendor', 'vendor@tripgalileo.com', '$2y$10$/.nJStPn2yq.qgA0kH0gfesYIOeUhjwUbJO3/GPQTFMfLr9Vnk3AC', 'vendor', '2026-07-07 09:07:22'),
('vendor-1783681575800', 'rakhi@gmail.com', 'rakhi@gmail.com', '$2y$10$YwkoRuWoAp0SGcFGph49xeii6.PNRXLtfzD1zazOdO6FredFS/kLi', 'vendor', '2026-07-15 16:54:15'),
('vendor-1784200910786', 'as@gmail.com', 'as@gmail.com', '$2y$10$x7CUwAdlJJ.ApYTCVnmdI.nOCh18n55KMliI1JTx2RSarir1.Hx3C', 'vendor', '2026-07-16 16:51:51');

-- --------------------------------------------------------

--
-- Table structure for table `vendors`
--

CREATE TABLE `vendors` (
  `id` varchar(50) NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(50) NOT NULL,
  `city` varchar(100) NOT NULL,
  `created_at` date NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `vendors`
--

INSERT INTO `vendors` (`id`, `name`, `email`, `phone`, `city`, `created_at`) VALUES
('vendor-1783681575800', 'rakhi', 'rakhi@gmail.com', '7411728653', 'Calangute, Goa', '2026-07-10'),
('vendor-1784200910786', 'ashwini', 'as@gmail.com', '7411728653', 'hubli', '2026-07-16');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `add_ons`
--
ALTER TABLE `add_ons`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `ai_leads`
--
ALTER TABLE `ai_leads`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `bikes`
--
ALTER TABLE `bikes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `vendor_id` (`vendor_id`);

--
-- Indexes for table `bookings`
--
ALTER TABLE `bookings`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `booking_payments`
--
ALTER TABLE `booking_payments`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `cars`
--
ALTER TABLE `cars`
  ADD PRIMARY KEY (`id`),
  ADD KEY `vendor_id` (`vendor_id`);

--
-- Indexes for table `coupons`
--
ALTER TABLE `coupons`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code` (`code`);

--
-- Indexes for table `destinations`
--
ALTER TABLE `destinations`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `flights`
--
ALTER TABLE `flights`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `flight_bookings`
--
ALTER TABLE `flight_bookings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `booking_number` (`booking_number`),
  ADD KEY `search_id` (`search_id`);

--
-- Indexes for table `flight_offers`
--
ALTER TABLE `flight_offers`
  ADD PRIMARY KEY (`id`),
  ADD KEY `search_id` (`search_id`);

--
-- Indexes for table `flight_passengers`
--
ALTER TABLE `flight_passengers`
  ADD PRIMARY KEY (`id`),
  ADD KEY `booking_id` (`booking_id`);

--
-- Indexes for table `flight_payments`
--
ALTER TABLE `flight_payments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `booking_id` (`booking_id`);

--
-- Indexes for table `flight_searches`
--
ALTER TABLE `flight_searches`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `flight_services`
--
ALTER TABLE `flight_services`
  ADD PRIMARY KEY (`id`),
  ADD KEY `booking_id` (`booking_id`),
  ADD KEY `passenger_id` (`passenger_id`);

--
-- Indexes for table `flight_webhook_events`
--
ALTER TABLE `flight_webhook_events`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `provider_event_id` (`provider_event_id`);

--
-- Indexes for table `hotels`
--
ALTER TABLE `hotels`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `packages`
--
ALTER TABLE `packages`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `package_reviews`
--
ALTER TABLE `package_reviews`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `payment_settings`
--
ALTER TABLE `payment_settings`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `vendors`
--
ALTER TABLE `vendors`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `add_ons`
--
ALTER TABLE `add_ons`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `booking_payments`
--
ALTER TABLE `booking_payments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `coupons`
--
ALTER TABLE `coupons`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `flights`
--
ALTER TABLE `flights`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `package_reviews`
--
ALTER TABLE `package_reviews`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `payment_settings`
--
ALTER TABLE `payment_settings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `bikes`
--
ALTER TABLE `bikes`
  ADD CONSTRAINT `bikes_ibfk_1` FOREIGN KEY (`vendor_id`) REFERENCES `vendors` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `cars`
--
ALTER TABLE `cars`
  ADD CONSTRAINT `cars_ibfk_1` FOREIGN KEY (`vendor_id`) REFERENCES `vendors` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `flight_bookings`
--
ALTER TABLE `flight_bookings`
  ADD CONSTRAINT `flight_bookings_ibfk_1` FOREIGN KEY (`search_id`) REFERENCES `flight_searches` (`id`);

--
-- Constraints for table `flight_offers`
--
ALTER TABLE `flight_offers`
  ADD CONSTRAINT `flight_offers_ibfk_1` FOREIGN KEY (`search_id`) REFERENCES `flight_searches` (`id`);

--
-- Constraints for table `flight_passengers`
--
ALTER TABLE `flight_passengers`
  ADD CONSTRAINT `flight_passengers_ibfk_1` FOREIGN KEY (`booking_id`) REFERENCES `flight_bookings` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `flight_payments`
--
ALTER TABLE `flight_payments`
  ADD CONSTRAINT `flight_payments_ibfk_1` FOREIGN KEY (`booking_id`) REFERENCES `flight_bookings` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `flight_services`
--
ALTER TABLE `flight_services`
  ADD CONSTRAINT `flight_services_ibfk_1` FOREIGN KEY (`booking_id`) REFERENCES `flight_bookings` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `flight_services_ibfk_2` FOREIGN KEY (`passenger_id`) REFERENCES `flight_passengers` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
