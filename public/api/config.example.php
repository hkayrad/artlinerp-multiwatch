<?php
declare(strict_types=1);

/**
 * Copy this file to `config.php` in the same directory (`public_html/api/config.php`).
 * Keep `config.php` out of Git!
 */
return [
    'admin_username' => 'admin',

    // Generate a hash with:
    // php -r "echo password_hash('your-strong-password', PASSWORD_DEFAULT) . PHP_EOL;"
    'admin_password_hash' => '',

    // Generate a 64-char hex secret with:
    // php -r "echo bin2hex(random_bytes(32)) . PHP_EOL;"
    'session_secret' => '',

    'max_file_size_bytes' => 8 * 1024 * 1024, // 8 MB
    'session_ttl_seconds' => 60 * 60 * 24 * 7, // 7 days
];
