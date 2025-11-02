<?php
/**
 * K-pop Anime Shop - Image Upload API
 *
 * Handles image uploads for the admin panel with Firebase authentication
 * Saves images to /assets/products/ or /assets/blog/
 */

// Error reporting (disable in production)
error_reporting(E_ALL);
ini_set('display_errors', '1');
ini_set('log_errors', '1');
ini_set('error_log', __DIR__ . '/php_errors.log');

// CORS Headers
header('Access-Control-Allow-Origin: *'); // Update to specific domain in production
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'error' => 'METHOD_NOT_ALLOWED',
        'message' => 'Only POST requests are allowed'
    ]);
    exit();
}

// ======================
// CONFIGURATION
// ======================

define('MAX_FILE_SIZE', 5 * 1024 * 1024); // 5MB
define('ALLOWED_TYPES', ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);
define('UPLOAD_BASE_PATH', dirname(__DIR__) . '/public/assets/');
define('WEB_BASE_PATH', '/assets/');

// Firebase Project ID (update with your project ID)
define('FIREBASE_PROJECT_ID', 'kpopanimeshop');

// ======================
// HELPER FUNCTIONS
// ======================

/**
 * Verify Firebase Authentication Token
 */
function verifyFirebaseToken($token) {
    if (empty($token)) {
        error_log("verifyFirebaseToken: Token is empty");
        return false;
    }

    // Remove 'Bearer ' prefix if present
    $token = str_replace('Bearer ', '', $token);
    error_log("verifyFirebaseToken: Token length: " . strlen($token));

    // Use Firebase REST API to verify token
    // This is a simple verification - for production, consider using Firebase Admin SDK
    $apiKey = getFirebaseApiKey();
    error_log("verifyFirebaseToken: API Key: " . substr($apiKey, 0, 10) . "...");

    $url = 'https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=' . $apiKey;

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(['idToken' => $token]));
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);

    // For local development only: disable SSL verification
    $isLocalhost = isset($_SERVER['HTTP_HOST']) && strpos($_SERVER['HTTP_HOST'], 'localhost') !== false;
    if ($isLocalhost) {
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
    }

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);

    error_log("verifyFirebaseToken: HTTP Code: " . $httpCode);
    if ($curlError) {
        error_log("verifyFirebaseToken: cURL Error: " . $curlError);
    }
    error_log("verifyFirebaseToken: Response: " . substr($response, 0, 200));

    if ($httpCode !== 200) {
        error_log("verifyFirebaseToken: Verification failed with code " . $httpCode);
        return false;
    }

    $data = json_decode($response, true);

    // Check if user exists and token is valid
    if (!isset($data['users']) || empty($data['users'])) {
        error_log("verifyFirebaseToken: No users in response");
        return false;
    }

    error_log("verifyFirebaseToken: Token verified successfully");
    return $data['users'][0]; // Return user data
}

/**
 * Get Firebase API Key from config
 */
function getFirebaseApiKey() {
    // Try to read from firebase-config.js
    $configPath = dirname(__DIR__) . '/firebase-config.js';

    if (file_exists($configPath)) {
        $content = file_get_contents($configPath);
        if (preg_match('/apiKey:\s*["\']([^"\']+)["\']/', $content, $matches)) {
            return $matches[1];
        }
    }

    // Fallback: return hardcoded key (update this)
    return 'AIzaSyCQfQUmUuKHp3VvHQ2MFX9r9Me_Tl59CQo';
}

/**
 * Generate unique filename
 */
function generateFilename($originalName, $mimeType = '') {
    $timestamp = time();
    $random = bin2hex(random_bytes(4));
    $ext = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));

    // If no extension, try to get it from MIME type
    if (empty($ext) && !empty($mimeType)) {
        $mimeToExt = [
            'image/jpeg' => 'jpg',
            'image/jpg' => 'jpg',
            'image/png' => 'png',
            'image/webp' => 'webp',
            'image/gif' => 'gif'
        ];
        $ext = $mimeToExt[$mimeType] ?? 'jpg'; // Default to jpg
    }

    // Sanitize original filename
    $baseName = pathinfo($originalName, PATHINFO_FILENAME);
    $baseName = preg_replace('/[^a-z0-9]/', '-', strtolower($baseName));
    $baseName = substr($baseName, 0, 30); // Limit length

    return $timestamp . '-' . $baseName . '-' . $random . '.' . $ext;
}

/**
 * Validate uploaded file
 */
function validateFile($file) {
    $errors = [];

    // Check if file was uploaded
    if (!isset($file['error']) || is_array($file['error'])) {
        $errors[] = 'Invalid file upload';
        return $errors;
    }

    // Check for upload errors
    if ($file['error'] !== UPLOAD_ERR_OK) {
        $errors[] = 'Upload error: ' . $file['error'];
        return $errors;
    }

    // Check file size
    if ($file['size'] > MAX_FILE_SIZE) {
        $errors[] = 'File too large (max 5MB)';
    }

    // Check file type
    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mimeType = $finfo->file($file['tmp_name']);

    if (!in_array($mimeType, ALLOWED_TYPES)) {
        $errors[] = 'Invalid file type. Only JPEG, PNG, and WebP images allowed';
    }

    // Check if it's actually an image
    $imageInfo = getimagesize($file['tmp_name']);
    if ($imageInfo === false) {
        $errors[] = 'File is not a valid image';
    }

    return $errors;
}

/**
 * Save uploaded file
 */
function saveFile($file, $category) {
    // Validate category
    $validCategories = ['products', 'blog'];
    if (!in_array($category, $validCategories)) {
        $category = 'products';
    }

    // Get MIME type
    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mimeType = $finfo->file($file['tmp_name']);

    // Generate unique filename with MIME type fallback
    $filename = generateFilename($file['name'], $mimeType);

    // Create full path (normalize slashes for Windows)
    $uploadDir = str_replace('/', DIRECTORY_SEPARATOR, UPLOAD_BASE_PATH . $category . '/');
    $filePath = $uploadDir . $filename;

    // Ensure directory exists with full permissions
    if (!is_dir($uploadDir)) {
        if (!mkdir($uploadDir, 0777, true)) {
            throw new Exception('Failed to create upload directory: ' . $uploadDir);
        }
    }

    // Move uploaded file
    if (!move_uploaded_file($file['tmp_name'], $filePath)) {
        $error = error_get_last();
        throw new Exception('Failed to save file: ' . ($error['message'] ?? 'Unknown error'));
    }

    // Set file permissions
    @chmod($filePath, 0666); // Use @ to suppress errors on Windows

    // Return web-accessible URL (always use forward slashes for URLs)
    $webUrl = WEB_BASE_PATH . $category . '/' . $filename;

    return [
        'url' => $webUrl,
        'filename' => $filename,
        'path' => $filePath,
        'size' => filesize($filePath),
        'category' => $category
    ];
}

// ======================
// MAIN UPLOAD HANDLER
// ======================

try {
    // 1. Verify Authentication
    $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';

    // DEBUG: Log the auth header
    error_log("Auth header received: " . ($authHeader ? 'YES' : 'NO'));
    error_log("Auth header value: " . substr($authHeader, 0, 50) . "...");

    if (empty($authHeader)) {
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'error' => 'UNAUTHORIZED',
            'message' => 'No authorization token provided',
            'debug' => 'No Authorization header found'
        ]);
        exit();
    }

    $user = verifyFirebaseToken($authHeader);

    if (!$user) {
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'error' => 'UNAUTHORIZED',
            'message' => 'Invalid or expired authentication token',
            'debug' => 'Token verification failed - check PHP error log for details'
        ]);
        exit();
    }

    // 2. Check if file was uploaded
    if (!isset($_FILES['image'])) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error' => 'NO_FILE',
            'message' => 'No image file provided'
        ]);
        exit();
    }

    $file = $_FILES['image'];

    // 3. Validate file
    $validationErrors = validateFile($file);

    if (!empty($validationErrors)) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error' => 'VALIDATION_ERROR',
            'message' => implode(', ', $validationErrors)
        ]);
        exit();
    }

    // 4. Get category
    $category = $_POST['category'] ?? 'products';

    // 5. Save file
    $result = saveFile($file, $category);

    // 6. Return success response
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'url' => $result['url'],
        'filename' => $result['filename'],
        'size' => $result['size'],
        'category' => $result['category'],
        'message' => 'Image uploaded successfully'
    ]);

} catch (Exception $e) {
    // Handle errors
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'SERVER_ERROR',
        'message' => $e->getMessage()
    ]);
}
