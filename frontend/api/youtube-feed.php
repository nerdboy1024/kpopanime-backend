<?php
/**
 * YouTube RSS Feed Proxy
 * Fetches YouTube channel RSS feed to bypass CORS restrictions
 */

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Only allow GET
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Only GET requests allowed']);
    exit();
}

try {
    $channelId = $_GET['channel_id'] ?? '';

    if (empty($channelId)) {
        throw new Exception('Channel ID is required');
    }

    // Validate channel ID format
    if (!preg_match('/^UC[a-zA-Z0-9_-]{22}$/', $channelId)) {
        throw new Exception('Invalid channel ID format');
    }

    // Fetch YouTube RSS feed
    $rssUrl = "https://www.youtube.com/feeds/videos.xml?channel_id=" . urlencode($channelId);

    $ch = curl_init($rssUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

    // For local development only: disable SSL verification
    $isLocalhost = isset($_SERVER['HTTP_HOST']) && strpos($_SERVER['HTTP_HOST'], 'localhost') !== false;
    if ($isLocalhost) {
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
    }

    $xmlContent = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);

    if ($curlError) {
        throw new Exception('cURL error: ' . $curlError);
    }

    if ($httpCode !== 200) {
        throw new Exception('YouTube returned status code: ' . $httpCode);
    }

    if (empty($xmlContent)) {
        throw new Exception('Empty response from YouTube');
    }

    // Parse XML to extract video data
    $xml = simplexml_load_string($xmlContent);
    if ($xml === false) {
        throw new Exception('Failed to parse XML');
    }

    // Register namespaces
    $namespaces = $xml->getNamespaces(true);
    $videos = [];

    // Extract video entries
    foreach ($xml->entry as $entry) {
        $mediaGroup = $entry->children('http://search.yahoo.com/mrss/');
        $ytNamespace = $entry->children('http://www.youtube.com/xml/schemas/2015');

        $videos[] = [
            'videoId' => (string)$ytNamespace->videoId,
            'title' => (string)$entry->title,
            'published' => (string)$entry->published,
            'updated' => (string)$entry->updated,
            'thumbnail' => (string)$mediaGroup->group->thumbnail->attributes()->url,
            'description' => (string)$mediaGroup->group->description,
        ];
    }

    echo json_encode([
        'success' => true,
        'videos' => $videos,
        'count' => count($videos)
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
