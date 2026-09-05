<?php
// backend/config.php

/**
 * Simple .env parser to load environment variables.
 */
function loadEnv($path) {
    if (!file_exists($path)) {
        return;
    }
    
    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) {
            continue;
        }
        
        list($name, $value) = explode('=', $line, 2);
        $name = trim($name);
        $value = trim($value);
        
        if (!array_key_exists($name, $_SERVER) && !array_key_exists($name, $_ENV)) {
            putenv(sprintf('%s=%s', $name, $value));
            $_ENV[$name] = $value;
            $_SERVER[$name] = $value;
        }
    }
}

// Load the .env file
loadEnv(__DIR__ . '/.env');

// Expose constants for easy access
define('DUFFEL_ACCESS_TOKEN', $_ENV['DUFFEL_ACCESS_TOKEN'] ?? '');
define('DUFFEL_API_BASE_URL', $_ENV['DUFFEL_API_BASE_URL'] ?? 'https://api.duffel.com');
define('DUFFEL_API_VERSION', $_ENV['DUFFEL_API_VERSION'] ?? 'v2');
define('DUFFEL_MODE', $_ENV['DUFFEL_MODE'] ?? 'test');

if (!defined('DB_CONNECTION')) define('DB_CONNECTION', $_ENV['DB_CONNECTION'] ?? getenv('DB_CONNECTION') ?: 'sqlite');
if (!defined('DB_HOST')) define('DB_HOST', $_ENV['DB_HOST'] ?? getenv('DB_HOST') ?: 'localhost');
if (!defined('DB_PORT')) define('DB_PORT', $_ENV['DB_PORT'] ?? getenv('DB_PORT') ?: '3306');
if (!defined('DB_NAME')) define('DB_NAME', $_ENV['DB_NAME'] ?? getenv('DB_NAME') ?: 'tripgalileo');
if (!defined('DB_USER')) define('DB_USER', $_ENV['DB_USER'] ?? getenv('DB_USER') ?: 'root');
if (!defined('DB_PASS')) define('DB_PASS', $_ENV['DB_PASS'] ?? (getenv('DB_PASS') !== false ? getenv('DB_PASS') : ''));

