<?php
// backend/FlightProvider.php

require_once __DIR__ . '/config.php';

class FlightProvider {
    private $apiKey;
    private $baseUrl;
    private $apiVersion;
    private $isLive;

    public function __construct() {
        $this->apiKey = DUFFEL_ACCESS_TOKEN;
        $this->baseUrl = rtrim(DUFFEL_API_BASE_URL, '/');
        $this->apiVersion = DUFFEL_API_VERSION;
        $this->isLive = (strtolower(DUFFEL_MODE) === 'live');
    }

    /**
     * Masks sensitive data in logs.
     */
    private function maskSensitiveData($data) {
        if (is_array($data)) {
            foreach (['passengers', 'payments'] as $sensitiveKey) {
                if (isset($data[$sensitiveKey])) {
                    $data[$sensitiveKey] = '[REDACTED]';
                }
            }
        }
        return $data;
    }

    /**
     * Securely logs API requests and responses.
     */
    private function logSecurely($method, $endpoint, $payload, $response, $httpCode) {
        $logEntry = [
            'timestamp' => date('c'),
            'method' => $method,
            'endpoint' => $endpoint,
            'http_code' => $httpCode,
            'request' => $this->maskSensitiveData($payload),
            'response_snippet' => is_array($response) && isset($response['data']) ? 'SUCCESS_DATA_PRESENT' : ($response['errors'] ?? 'UNKNOWN_ERROR')
        ];
        
        $logMsg = json_encode($logEntry) . PHP_EOL;
        file_put_contents(__DIR__ . '/duffel_api.log', $logMsg, FILE_APPEND);
    }

    private function request($method, $endpoint, $data = null, $timeout = 30) {
        $ch = curl_init($this->baseUrl . $endpoint);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, $timeout); // Important: Search timeout vs Booking timeout
        curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 10);
        
        $headers = [
            'Accept: application/json',
            'Content-Type: application/json',
            'Accept-Encoding: gzip',
            'Duffel-Version: ' . $this->apiVersion,
            'Authorization: Bearer ' . $this->apiKey
        ];

        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        curl_setopt($ch, CURLOPT_ENCODING, 'gzip'); // Handle gzip encoding

        if ($method === 'POST') {
            curl_setopt($ch, CURLOPT_POST, true);
            if ($data) {
                curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
            }
        } elseif ($method === 'GET') {
            curl_setopt($ch, CURLOPT_HTTPGET, true);
        }

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);

        $decoded = json_decode($response, true);
        
        // Log the interaction
        $this->logSecurely($method, $endpoint, $data, $decoded, $httpCode);

        if ($curlError) {
            return ['error' => true, 'message' => 'cURL Error: ' . $curlError];
        }

        if ($httpCode >= 400 || isset($decoded['errors'])) {
            return [
                'error' => true, 
                'message' => 'API Request Failed', 
                'http_code' => $httpCode, 
                'details' => $decoded['errors'] ?? $decoded
            ];
        }

        return $decoded;
    }

    public function searchPlaces($query) {
        return $this->request('GET', "/places/suggestions?query=" . urlencode($query));
    }

    /**
     * Create an Offer Request.
     */
    public function searchFlights($from, $to, $departureDate, $passengers, $cabinClass, $returnDate = null) {
        $slices = [
            [
                'origin' => $from,
                'destination' => $to,
                'departure_date' => $departureDate
            ]
        ];
        
        if ($returnDate) {
            $slices[] = [
                'origin' => $to,
                'destination' => $from,
                'departure_date' => $returnDate
            ];
        }

        $data = [
            'data' => [
                'slices' => $slices,
                'passengers' => $passengers,
                'cabin_class' => $cabinClass,
                'return_offers' => true
            ]
        ];

        return $this->request('POST', '/air/offer_requests', $data, 30);
    }

    /**
     * Get a Single Offer by ID.
     */
    public function getOffer($offerId) {
        return $this->request('GET', '/air/offers/' . urlencode($offerId) . '?return_available_services=true');
    }

    /**
     * Get Seat Maps for an Offer.
     */
    public function getSeatMaps($offerId) {
        return $this->request('GET', '/air/seat_maps?offer_id=' . urlencode($offerId));
    }

    /**
     * Create an Order.
     * Orders can take longer, so we increase the timeout to 60s.
     */
    public function createOrder($offerId, $passengers, $payments = [], $services = []) {
        $data = [
            'data' => [
                'selected_offers' => [$offerId],
                'passengers' => $passengers,
                'type' => 'instant'
            ]
        ];

        if (!empty($payments)) {
            $data['data']['payments'] = $payments;
        }

        if (!empty($services)) {
            $data['data']['services'] = $services;
        }

        return $this->request('POST', '/air/orders', $data, 60);
    }

    /**
     * Get a Single Order by ID.
     */
    public function getOrder($orderId) {
        return $this->request('GET', '/air/orders/' . urlencode($orderId));
    }

    /**
     * Get Order Cancellation Quote.
     */
    public function getOrderCancellationQuote($orderId) {
        $data = [
            'data' => [
                'order_id' => $orderId
            ]
        ];
        return $this->request('POST', '/air/order_cancellations', $data);
    }

    /**
     * Confirm Order Cancellation.
     */
    public function confirmOrderCancellation($cancellationId) {
        return $this->request('POST', '/air/order_cancellations/' . urlencode($cancellationId) . '/actions/confirm');
    }
}
