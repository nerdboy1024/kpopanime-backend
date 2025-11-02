<?php
/**
 * Square Payment Configuration
 *
 * IMPORTANT: Keep this file secure and never commit to public repositories
 */

// Environment: 'sandbox' for testing, 'production' for live payments
define('SQUARE_ENVIRONMENT', 'sandbox');

// Sandbox Credentials (for testing)
define('SQUARE_SANDBOX_ACCESS_TOKEN', 'EAAAl0e_jRAel8zEjz6ITsEJQXSZtDCikgiG8U_LMaIPGIyr--9hmfPL1i0PIxyJ');
define('SQUARE_SANDBOX_APP_ID', 'sq0idp-7fnZ25EAXbhRZlgc4pGpHA');
define('SQUARE_SANDBOX_LOCATION_ID', 'L30C5FKCRGZVF');

// Production Credentials (add these when ready to go live)
define('SQUARE_PRODUCTION_ACCESS_TOKEN', ''); // Add your production token here
define('SQUARE_PRODUCTION_APP_ID', ''); // Add your production app ID here
define('SQUARE_PRODUCTION_LOCATION_ID', ''); // Add your production location ID here

/**
 * Get current Square Access Token based on environment
 */
function getSquareAccessToken() {
    return SQUARE_ENVIRONMENT === 'production'
        ? SQUARE_PRODUCTION_ACCESS_TOKEN
        : SQUARE_SANDBOX_ACCESS_TOKEN;
}

/**
 * Get current Square Application ID based on environment
 */
function getSquareAppId() {
    return SQUARE_ENVIRONMENT === 'production'
        ? SQUARE_PRODUCTION_APP_ID
        : SQUARE_SANDBOX_APP_ID;
}

/**
 * Get current Square Location ID based on environment
 */
function getSquareLocationId() {
    return SQUARE_ENVIRONMENT === 'production'
        ? SQUARE_PRODUCTION_LOCATION_ID
        : SQUARE_SANDBOX_LOCATION_ID;
}

/**
 * Get Square API base URL based on environment
 */
function getSquareApiUrl() {
    return SQUARE_ENVIRONMENT === 'production'
        ? 'https://connect.squareup.com'
        : 'https://connect.squareupsandbox.com';
}
