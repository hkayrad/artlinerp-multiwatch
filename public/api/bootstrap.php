<?php
declare(strict_types=1);

ini_set('display_errors', '0');

const FANART_COOKIE_NAME = 'artline_admin_session';
const FANART_ALLOWED_VILLAGES = ['konoha', 'suna', 'genel'];
const FANART_ALLOWED_MIMES = [
    'image/jpeg' => 'jpg',
    'image/png' => 'png',
    'image/webp' => 'webp',
    'image/gif' => 'gif',
];

function fanart_root_dir(): string
{
    return dirname(__DIR__);
}

function fanart_public_dir(): string
{
    return fanart_root_dir() . '/uploads/fanart';
}

function fanart_pending_dir(): string
{
    return fanart_root_dir() . '/uploads/fanart/pending';
}

function fanart_data_dir(): string
{
    return fanart_root_dir() . '/fanart-data';
}

function ensure_fanart_dirs(): void
{
    foreach ([fanart_public_dir(), fanart_pending_dir(), fanart_data_dir()] as $dir) {
        if (!is_dir($dir)) {
            @mkdir($dir, 0755, true);
        }
    }
}

function json_response(array $payload, int $status = 200): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('X-Content-Type-Options: nosniff');
    header('Cache-Control: no-store');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function load_fanart_config(): ?array
{
    $path = __DIR__ . '/config.php';
    if (!is_file($path)) {
        return null;
    }

    $cfg = require $path;
    if (!is_array($cfg)) {
        return null;
    }

    $username = trim((string)($cfg['admin_username'] ?? ''));
    $hash = (string)($cfg['admin_password_hash'] ?? '');
    $secret = (string)($cfg['session_secret'] ?? '');

    if ($username === '' || $hash === '' || strlen($secret) < 16) {
        return null;
    }

    return [
        'admin_username' => $username,
        'admin_password_hash' => $hash,
        'session_secret' => $secret,
        'max_file_size_bytes' => (int)($cfg['max_file_size_bytes'] ?? 8 * 1024 * 1024),
        'session_ttl_seconds' => (int)($cfg['session_ttl_seconds'] ?? 60 * 60 * 24 * 7),
    ];
}

function read_json_body(): array
{
    $raw = file_get_contents('php://input');
    if ($raw === false || trim($raw) === '') {
        return [];
    }
    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : [];
}

function verify_same_origin(): void
{
    $hostHeader = strtolower((string)($_SERVER['HTTP_HOST'] ?? ''));
    if ($hostHeader === '') {
        return;
    }
    $expectedHost = explode(':', $hostHeader)[0];

    foreach (['HTTP_ORIGIN', 'HTTP_REFERER'] as $header) {
        $val = (string)($_SERVER[$header] ?? '');
        if ($val === '') {
            continue;
        }
        $parsedHost = strtolower((string)parse_url($val, PHP_URL_HOST));
        if ($parsedHost !== '' && !hash_equals($expectedHost, $parsedHost)) {
            json_response(['error' => 'Geçersiz istek kaynağı.'], 403);
        }
    }
}

function base64url_encode(string $data): string
{
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

function base64url_decode(string $data): string|false
{
    $remainder = strlen($data) % 4;
    if ($remainder !== 0) {
        $data .= str_repeat('=', 4 - $remainder);
    }
    return base64_decode(strtr($data, '-_', '+/'), true);
}

function is_https_request(): bool
{
    if (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') {
        return true;
    }
    return strtolower((string)($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '')) === 'https';
}

function issue_admin_cookie(array $config, string $username): void
{
    $exp = time() + $config['session_ttl_seconds'];
    $payload = base64url_encode((string)json_encode([
        'u' => $username,
        'exp' => $exp,
    ], JSON_UNESCAPED_UNICODE));

    $sig = hash_hmac('sha256', $payload, $config['session_secret']);
    $token = $payload . '.' . $sig;

    setcookie(FANART_COOKIE_NAME, $token, [
        'expires' => $exp,
        'path' => '/',
        'secure' => is_https_request(),
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
}

function clear_admin_cookie(): void
{
    setcookie(FANART_COOKIE_NAME, '', [
        'expires' => time() - 3600,
        'path' => '/',
        'secure' => is_https_request(),
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
}

function current_admin_username(?array $config): ?string
{
    if ($config === null) {
        return null;
    }
    $token = (string)($_COOKIE[FANART_COOKIE_NAME] ?? '');
    if ($token === '' || !str_contains($token, '.')) {
        return null;
    }

    [$payload, $sig] = explode('.', $token, 2);
    $expectedSig = hash_hmac('sha256', $payload, $config['session_secret']);
    if (!hash_equals($expectedSig, $sig)) {
        return null;
    }

    $decodedRaw = base64url_decode($payload);
    if ($decodedRaw === false) {
        return null;
    }
    $data = json_decode($decodedRaw, true);
    if (!is_array($data)) {
        return null;
    }

    $exp = (int)($data['exp'] ?? 0);
    $user = (string)($data['u'] ?? '');
    if ($exp < time() || $user === '' || !hash_equals($config['admin_username'], $user)) {
        return null;
    }

    return $user;
}

function require_admin(?array $config): string
{
    if ($config === null) {
        json_response(['error' => 'Yönetici yapılandırması (api/config.php) tamamlanmamış.'], 503);
    }
    $user = current_admin_username($config);
    if ($user === null) {
        json_response(['error' => 'Bu işlem için yönetici girişi gereklidir.'], 401);
    }
    return $user;
}

function read_json_store(string $filename): array
{
    ensure_fanart_dirs();
    $path = fanart_data_dir() . '/' . $filename;
    if (!is_file($path)) {
        return [];
    }

    $fp = @fopen($path, 'rb');
    if ($fp === false) {
        return [];
    }

    flock($fp, LOCK_SH);
    $content = stream_get_contents($fp);
    flock($fp, LOCK_UN);
    fclose($fp);

    if ($content === false || trim($content) === '') {
        return [];
    }

    $decoded = json_decode($content, true);
    return is_array($decoded) ? $decoded : [];
}

function write_json_store(string $filename, array $data): bool
{
    ensure_fanart_dirs();
    $path = fanart_data_dir() . '/' . $filename;
    $fp = @fopen($path, 'c+b');
    if ($fp === false) {
        return false;
    }

    if (!flock($fp, LOCK_EX)) {
        fclose($fp);
        return false;
    }

    ftruncate($fp, 0);
    rewind($fp);
    $encoded = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    $ok = $encoded !== false && fwrite($fp, $encoded) !== false;
    fflush($fp);
    flock($fp, LOCK_UN);
    fclose($fp);
    return $ok;
}

function check_rate_limit(string $bucket, int $maxAttempts, int $windowSeconds): bool
{
    $ip = (string)($_SERVER['REMOTE_ADDR'] ?? 'unknown');
    $key = $bucket . ':' . hash('sha256', $ip);
    $now = time();

    $limits = read_json_store('ratelimit.json');
    $cleaned = [];
    foreach ($limits as $entryKey => $timestamps) {
        if (!is_array($timestamps)) {
            continue;
        }
        $recent = array_values(array_filter(
            $timestamps,
            static fn($ts): bool => is_int($ts) && ($now - $ts) < $windowSeconds
        ));
        if ($recent !== []) {
            $cleaned[$entryKey] = $recent;
        }
    }

    $current = $cleaned[$key] ?? [];
    if (count($current) >= $maxAttempts) {
        write_json_store('ratelimit.json', $cleaned);
        return false;
    }

    $current[] = $now;
    $cleaned[$key] = $current;
    write_json_store('ratelimit.json', $cleaned);
    return true;
}

function normalize_text_field(string $value, int $maxLength): string
{
    $collapsed = trim((string)preg_replace('/\s+/u', ' ', $value));
    if (function_exists('mb_substr')) {
        return mb_substr($collapsed, 0, $maxLength, 'UTF-8');
    }
    return substr($collapsed, 0, $maxLength);
}

function sanitize_slug(string $input): string
{
    $ascii = @iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $input);
    if ($ascii === false || $ascii === '') {
        $ascii = $input;
    }
    $slug = strtolower((string)preg_replace('/[^a-zA-Z0-9]+/', '-', $ascii));
    $slug = trim($slug, '-');
    return $slug !== '' ? substr($slug, 0, 40) : 'fanart';
}

function validate_and_store_image(array $file, string $destDir, string $title, int $maxBytes): array
{
    $error = (int)($file['error'] ?? UPLOAD_ERR_NO_FILE);
    if ($error !== UPLOAD_ERR_OK) {
        $message = match ($error) {
            UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE => 'Dosya boyutu sunucu sınırını aşıyor.',
            UPLOAD_ERR_NO_FILE => 'Lütfen bir görsel dosyası seçin.',
            default => 'Dosya yüklenirken bir hata oluştu.',
        };
        json_response(['error' => $message], 400);
    }

    $size = (int)($file['size'] ?? 0);
    if ($size <= 0 || $size > $maxBytes) {
        $maxMb = (int)round($maxBytes / (1024 * 1024));
        json_response(['error' => "Görsel boyutu en fazla {$maxMb} MB olabilir."], 400);
    }

    $tmpPath = (string)($file['tmp_name'] ?? '');
    if ($tmpPath === '' || !is_uploaded_file($tmpPath)) {
        json_response(['error' => 'Geçersiz yükleme dosyası.'], 400);
    }

    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mime = (string)$finfo->file($tmpPath);
    if (!isset(FANART_ALLOWED_MIMES[$mime])) {
        json_response(['error' => 'Yalnızca JPG, PNG, WEBP veya GIF görselleri desteklenir.'], 400);
    }

    $imageInfo = @getimagesize($tmpPath);
    if ($imageInfo === false || $imageInfo[0] < 16 || $imageInfo[1] < 16) {
        json_response(['error' => 'Geçerli bir görsel dosyası okunamadı.'], 400);
    }

    $ext = FANART_ALLOWED_MIMES[$mime];
    $filename = sprintf('%s-%d-%s.%s', sanitize_slug($title), time(), bin2hex(random_bytes(3)), $ext);
    $targetPath = $destDir . '/' . $filename;

    if (!@move_uploaded_file($tmpPath, $targetPath)) {
        json_response(['error' => 'Görsel klasöre kaydedilemedi (klasör yazma izinlerini kontrol edin).'], 500);
    }

    return [
        'filename' => $filename,
        'width' => (int)$imageInfo[0],
        'height' => (int)$imageInfo[1],
    ];
}

function title_from_filename(string $filename): string
{
    $stem = pathinfo($filename, PATHINFO_FILENAME);
    $readable = trim((string)preg_replace('/[-_]+/', ' ', $stem));
    return $readable !== '' ? ucwords($readable) : 'Fanart';
}

/**
 * Keeps gallery.json synchronized with files placed directly into uploads/fanart/.
 */
function sync_gallery_folder(): array
{
    ensure_fanart_dirs();
    $dir = fanart_public_dir();
    $items = read_json_store('gallery.json');

    $validItems = [];
    $seenFilenames = [];
    $changed = false;

    foreach ($items as $item) {
        if (!is_array($item) || empty($item['filename'])) {
            $changed = true;
            continue;
        }
        $safeName = basename((string)$item['filename']);
        $fullPath = $dir . '/' . $safeName;
        if (!is_file($fullPath) || isset($seenFilenames[$safeName])) {
            $changed = true;
            continue;
        }
        $item['filename'] = $safeName;
        $item['url'] = '/uploads/fanart/' . rawurlencode($safeName);
        $validItems[] = $item;
        $seenFilenames[$safeName] = true;
    }

    $allowedExts = array_values(FANART_ALLOWED_MIMES);
    $entries = @scandir($dir);
    if (is_array($entries)) {
        foreach ($entries as $entry) {
            if ($entry === '.' || $entry === '..' || $entry === '.htaccess' || $entry === 'pending') {
                continue;
            }
            $fullPath = $dir . '/' . $entry;
            if (!is_file($fullPath) || isset($seenFilenames[$entry])) {
                continue;
            }
            $ext = strtolower((string)pathinfo($entry, PATHINFO_EXTENSION));
            if (!in_array($ext, $allowedExts, true)) {
                continue;
            }
            $dims = @getimagesize($fullPath);
            $mtime = @filemtime($fullPath) ?: time();
            $validItems[] = [
                'id' => 'dir-' . substr(hash('sha256', $entry), 0, 12),
                'filename' => $entry,
                'url' => '/uploads/fanart/' . rawurlencode($entry),
                'title' => title_from_filename($entry),
                'artist' => 'Topluluk',
                'village' => 'genel',
                'description' => '',
                'width' => is_array($dims) ? (int)$dims[0] : null,
                'height' => is_array($dims) ? (int)$dims[1] : null,
                'createdAt' => gmdate('c', $mtime),
                'approvedAt' => gmdate('c', $mtime),
                'uploadedBy' => 'admin',
            ];
            $changed = true;
        }
    }

    usort($validItems, static function (array $a, array $b): int {
        return strcmp((string)($b['createdAt'] ?? ''), (string)($a['createdAt'] ?? ''));
    });

    if ($changed) {
        write_json_store('gallery.json', $validItems);
    }

    return $validItems;
}
