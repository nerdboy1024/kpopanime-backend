<?php
/**
 * Square Checkout API Endpoint
 *
 * Creates a Square checkout session and redirects customer to payment page
 */

require_once __DIR__ . '/square-config.php';

// Error reporting
error_reporting(E_ALL);
ini_set('display_errors', '1');

// CORS Headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Only allow POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Only POST requests allowed']);
    exit();
}

try {
    // Get request body
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);

    if (!$data) {
        throw new Exception('Invalid JSON in request body');
    }

    // Validate required fields
    if (empty($data['cart']) || !is_array($data['cart'])) {
        throw new Exception('Cart is required and must be an array');
    }

    if (empty($data['customerEmail'])) {
        throw new Exception('Customer email is required');
    }

    // Build line items for Square
    $lineItems = [];
    $totalAmount = 0;

    foreach ($data['cart'] as $item) {
        // Validate cart item
        if (empty($item['name']) || empty($item['price']) || empty($item['quantity'])) {
            throw new Exception('Invalid cart item: missing name, price, or quantity');
        }

        // Square expects amounts in cents
        $priceInCents = (int)round($item['price'] * 100);
        $quantity = (int)$item['quantity'];

        $lineItems[] = [
            'name' => $item['name'],
            'quantity' => (string)$quantity,
            'base_price_money' => [
                'amount' => $priceInCents,
                'currency' => 'USD'
            ]
        ];

        $totalAmount += $priceInCents * $quantity;
    }

    // Create unique idempotency key
    $idempotencyKey = uniqid('checkout_', true);

    // Determine redirect URLs
    $isLocalhost = isset($_SERVER['HTTP_HOST']) && strpos($_SERVER['HTTP_HOST'], 'localhost') !== false;
    $baseUrl = $isLocalhost ? 'http://localhost:8080' : 'https://' . $_SERVER['HTTP_HOST'];

    // Build checkout request
    $checkoutData = [
        'idempotency_key' => $idempotencyKey,
        'order' => [
            'location_id' => getSquareLocationId(),
            'line_items' => $lineItems,
            'customer_id' => null, // Optional: add if you have Square customer ID
        ],
        'checkout_options' => [
            'redirect_url' => $baseUrl . '/order-confirmation.html',
            'ask_for_shipping_address' => true,
        ],
        'pre_populate_buyer_email' => $data['customerEmail'],
    ];

    // Optional: Add customer name if provided
    if (!empty($data['customerName'])) {
        $checkoutData['pre_populate_shipping_address'] = [
            'address_line_1' => '',
            'locality' => '',
            'administrative_district_level_1' => '',
            'postal_code' => '',
            'country' => 'US',
            'first_name' => $data['customerName'],
        ];
    }

    // Make request to Square API
    $apiUrl = getSquareApiUrl() . '/v2/online-checkout/payment-links';
    $accessToken = getSquareAccessToken();

    $ch = curl_init($apiUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($checkoutData));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $accessToken,
        'Square-Version: 2024-10-17'
    ]);

    // Disable SSL verification for local development only
    if ($isLocalhost) {
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
    }

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);

    if ($curlError) {
        throw new Exception('cURL error: ' . $curlError);
    }

    $responseData = json_decode($response, true);

    if ($httpCode !== 200) {
        $errorMessage = 'Square API error';
        if (isset($responseData['errors'])) {
            $errorMessage .= ': ' . json_encode($responseData['errors']);
        }
        throw new Exception($errorMessage);
    }

    // Return checkout URL
    if (isset($responseData['payment_link']['url'])) {
        echo json_encode([
            'success' => true,
            'checkoutUrl' => $responseData['payment_link']['url'],
            'orderId' => $responseData['payment_link']['id'] ?? null,
        ]);
    } else {
        throw new Exception('No checkout URL in Square response');
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
