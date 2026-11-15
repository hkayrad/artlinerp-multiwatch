<?php
declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

$method = strtoupper((string)($_SERVER['REQUEST_METHOD'] ?? 'GET'));
$config = load_fanart_config();

if ($method === 'GET') {
    $user = current_admin_username($config);
    json_response([
        'authenticated' => $user !== null,
        'username' => $user,
        'configured' => $config !== null,
    ]);
}

if ($method === 'POST') {
    verify_same_origin();

    if ($config === null) {
        json_response([
            'error' => 'Yönetici yapılandırması (api/config.php) eksik. Lütfen api/config.example.php dosyasını kopyalayın.',
        ], 503);
    }

    if (!check_rate_limit('admin_login', 8, 900)) {
        json_response(['error' => 'Çok fazla başarısız deneme. Lütfen 15 dakika sonra tekrar deneyin.'], 429);
    }

    $body = read_json_body();
    $username = trim((string)($body['username'] ?? ''));
    $password = (string)($body['password'] ?? '');

    if ($username === '' || $password === '') {
        json_response(['error' => 'Kullanıcı adı ve şifre zorunludur.'], 400);
    }

    $validUser = hash_equals($config['admin_username'], $username);
    $validPass = password_verify($password, $config['admin_password_hash']);

    if (!$validUser || !$validPass) {
        json_response(['error' => 'Kullanıcı adı veya şifre hatalı.'], 401);
    }

    issue_admin_cookie($config, $config['admin_username']);
    json_response([
        'authenticated' => true,
        'username' => $config['admin_username'],
        'configured' => true,
    ]);
}

if ($method === 'DELETE') {
    verify_same_origin();
    clear_admin_cookie();
    json_response([
        'authenticated' => false,
        'configured' => $config !== null,
    ]);
}

json_response(['error' => 'Desteklenmeyen HTTP metodu.'], 405);
