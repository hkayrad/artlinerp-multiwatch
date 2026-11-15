<?php
declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

$method = strtoupper((string)($_SERVER['REQUEST_METHOD'] ?? 'GET'));
$config = load_fanart_config();

if ($method === 'GET') {
    if (isset($_GET['pending_image'])) {
        require_admin($config);
        $targetId = trim((string)$_GET['pending_image']);
        $pending = read_json_store('pending.json');
        foreach ($pending as $item) {
            if (!is_array($item) || ($item['id'] ?? '') !== $targetId) {
                continue;
            }
            $safeName = basename((string)($item['filename'] ?? ''));
            $fullPath = fanart_pending_dir() . '/' . $safeName;
            if ($safeName === '' || !is_file($fullPath)) {
                json_response(['error' => 'Bekleyen görsel bulunamadı.'], 404);
            }
            $finfo = new finfo(FILEINFO_MIME_TYPE);
            $mime = (string)$finfo->file($fullPath);
            if (!isset(FANART_ALLOWED_MIMES[$mime])) {
                json_response(['error' => 'Geçersiz görsel türü.'], 400);
            }
            header('Content-Type: ' . $mime);
            header('Content-Length: ' . (string)filesize($fullPath));
            header('Cache-Control: private, no-store');
            header('X-Content-Type-Options: nosniff');
            readfile($fullPath);
            exit;
        }
        json_response(['error' => 'Bekleyen görsel bulunamadı.'], 404);
    }

    if (($_GET['scope'] ?? '') === 'pending') {
        require_admin($config);
        $pending = read_json_store('pending.json');
        usort($pending, static function (array $a, array $b): int {
            return strcmp((string)($b['createdAt'] ?? ''), (string)($a['createdAt'] ?? ''));
        });
        $mapped = array_map(static function (array $item): array {
            $id = (string)($item['id'] ?? '');
            $item['url'] = '/api/fanart.php?pending_image=' . rawurlencode($id);
            return $item;
        }, $pending);
        json_response(['items' => $mapped]);
    }

    $items = sync_gallery_folder();
    $village = strtolower(trim((string)($_GET['village'] ?? '')));
    if ($village !== '' && $village !== 'all' && in_array($village, FANART_ALLOWED_VILLAGES, true)) {
        $items = array_values(array_filter(
            $items,
            static fn(array $item): bool => ($item['village'] ?? 'genel') === $village
        ));
    }

    json_response(['items' => $items]);
}

if ($method === 'POST') {
    verify_same_origin();

    // Anti-spam honeypot field for bots
    if (trim((string)($_POST['website'] ?? '')) !== '') {
        json_response(['error' => 'Gönderim reddedildi.'], 400);
    }

    $adminUser = current_admin_username($config);
    $isAdmin = $adminUser !== null;

    if (!$isAdmin && !check_rate_limit('visitor_upload', 5, 900)) {
        json_response(['error' => 'Çok sık gönderim yaptınız. Lütfen biraz bekleyip tekrar deneyin.'], 429);
    }

    $title = normalize_text_field((string)($_POST['title'] ?? ''), 80);
    $artist = normalize_text_field((string)($_POST['artist'] ?? ''), 50);
    $village = strtolower(trim((string)($_POST['village'] ?? 'genel')));
    $description = normalize_text_field((string)($_POST['description'] ?? ''), 300);

    if ($title === '') {
        json_response(['error' => 'Eser başlığı zorunludur.'], 400);
    }
    if ($artist === '') {
        json_response(['error' => 'Sanatçı / çizer adı zorunludur.'], 400);
    }
    if (!in_array($village, FANART_ALLOWED_VILLAGES, true)) {
        $village = 'genel';
    }

    $maxBytes = $config['max_file_size_bytes'] ?? (8 * 1024 * 1024);
    $file = $_FILES['image'] ?? null;
    if (!is_array($file)) {
        json_response(['error' => 'Lütfen bir görsel dosyası seçin.'], 400);
    }

    ensure_fanart_dirs();
    if ($isAdmin) {
        $gallery = sync_gallery_folder();
    }
    $destDir = $isAdmin ? fanart_public_dir() : fanart_pending_dir();
    $stored = validate_and_store_image($file, $destDir, $title, $maxBytes);

    $nowIso = gmdate('c');
    $id = 'fa-' . bin2hex(random_bytes(6));

    $record = [
        'id' => $id,
        'filename' => $stored['filename'],
        'url' => $isAdmin
            ? '/uploads/fanart/' . rawurlencode($stored['filename'])
            : '/api/fanart.php?pending_image=' . rawurlencode($id),
        'title' => $title,
        'artist' => $artist,
        'village' => $village,
        'description' => $description,
        'width' => $stored['width'],
        'height' => $stored['height'],
        'createdAt' => $nowIso,
        'uploadedBy' => $isAdmin ? 'admin' : 'visitor',
    ];

    if ($isAdmin) {
        $record['approvedAt'] = $nowIso;
        array_unshift($gallery, $record);
        if (!write_json_store('gallery.json', $gallery)) {
            json_response(['error' => 'Galeri verisi kaydedilemedi.'], 500);
        }
        json_response(['status' => 'approved', 'item' => $record], 201);
    }

    $pending = read_json_store('pending.json');
    array_unshift($pending, $record);
    if (!write_json_store('pending.json', $pending)) {
        json_response(['error' => 'Gönderim sıraya kaydedilemedi.'], 500);
    }
    json_response(['status' => 'pending', 'item' => $record], 202);
}

if ($method === 'PATCH') {
    verify_same_origin();
    require_admin($config);

    $body = read_json_body();
    $id = trim((string)($body['id'] ?? ''));
    $action = trim((string)($body['action'] ?? 'update'));

    if ($id === '') {
        json_response(['error' => 'Geçersiz eser kimliği.'], 400);
    }

    if ($action === 'approve') {
        $pending = read_json_store('pending.json');
        $targetIndex = null;
        foreach ($pending as $idx => $item) {
            if (is_array($item) && ($item['id'] ?? '') === $id) {
                $targetIndex = $idx;
                break;
            }
        }
        if ($targetIndex === null) {
            json_response(['error' => 'Onaylanacak gönderim bulunamadı.'], 404);
        }

        $item = $pending[$targetIndex];
        $safeName = basename((string)($item['filename'] ?? ''));
        $srcPath = fanart_pending_dir() . '/' . $safeName;
        $destPath = fanart_public_dir() . '/' . $safeName;

        if ($safeName === '' || !is_file($srcPath)) {
            json_response(['error' => 'Bekleyen görsel dosyası diskte bulunamadı.'], 404);
        }
        $gallery = sync_gallery_folder();
        if (!@rename($srcPath, $destPath)) {
            json_response(['error' => 'Görsel onay klasörüne taşınamadı.'], 500);
        }

        if (isset($body['title'])) {
            $t = normalize_text_field((string)$body['title'], 80);
            if ($t !== '') {
                $item['title'] = $t;
            }
        }
        if (isset($body['artist'])) {
            $a = normalize_text_field((string)$body['artist'], 50);
            if ($a !== '') {
                $item['artist'] = $a;
            }
        }
        if (isset($body['village'])) {
            $v = strtolower(trim((string)$body['village']));
            if (in_array($v, FANART_ALLOWED_VILLAGES, true)) {
                $item['village'] = $v;
            }
        }
        if (isset($body['description'])) {
            $item['description'] = normalize_text_field((string)$body['description'], 300);
        }

        $item['url'] = '/uploads/fanart/' . rawurlencode($safeName);
        $item['approvedAt'] = gmdate('c');

        array_splice($pending, $targetIndex, 1);
        write_json_store('pending.json', $pending);

        array_unshift($gallery, $item);
        write_json_store('gallery.json', $gallery);

        json_response(['item' => $item]);
    }

    if ($action === 'update') {
        $gallery = sync_gallery_folder();
        $found = false;
        foreach ($gallery as &$item) {
            if (!is_array($item) || ($item['id'] ?? '') !== $id) {
                continue;
            }
            if (isset($body['title'])) {
                $t = normalize_text_field((string)$body['title'], 80);
                if ($t !== '') {
                    $item['title'] = $t;
                }
            }
            if (isset($body['artist'])) {
                $a = normalize_text_field((string)$body['artist'], 50);
                if ($a !== '') {
                    $item['artist'] = $a;
                }
            }
            if (isset($body['village'])) {
                $v = strtolower(trim((string)$body['village']));
                if (in_array($v, FANART_ALLOWED_VILLAGES, true)) {
                    $item['village'] = $v;
                }
            }
            if (isset($body['description'])) {
                $item['description'] = normalize_text_field((string)$body['description'], 300);
            }
            $updatedItem = $item;
            $found = true;
            break;
        }
        unset($item);

        if (!$found) {
            json_response(['error' => 'Güncellenecek eser bulunamadı.'], 404);
        }

        write_json_store('gallery.json', $gallery);
        json_response(['item' => $updatedItem]);
    }

    json_response(['error' => 'Bilinmeyen işlem türü.'], 400);
}

if ($method === 'DELETE') {
    verify_same_origin();
    require_admin($config);

    $body = read_json_body();
    $id = trim((string)($_GET['id'] ?? $body['id'] ?? ''));
    $scope = trim((string)($_GET['scope'] ?? $body['scope'] ?? 'approved'));

    if ($id === '') {
        json_response(['error' => 'Silinecek eser kimliği belirtilmedi.'], 400);
    }

    $storeName = $scope === 'pending' ? 'pending.json' : 'gallery.json';
    $dir = $scope === 'pending' ? fanart_pending_dir() : fanart_public_dir();
    $items = $scope === 'pending' ? read_json_store('pending.json') : sync_gallery_folder();

    $removed = null;
    $remaining = [];
    foreach ($items as $item) {
        if (is_array($item) && ($item['id'] ?? '') === $id && $removed === null) {
            $removed = $item;
            continue;
        }
        $remaining[] = $item;
    }

    if ($removed === null) {
        json_response(['error' => 'Silinecek eser bulunamadı.'], 404);
    }

    $safeName = basename((string)($removed['filename'] ?? ''));
    if ($safeName !== '') {
        $filePath = $dir . '/' . $safeName;
        if (is_file($filePath)) {
            @unlink($filePath);
        }
    }

    write_json_store($storeName, $remaining);
    json_response(['deleted' => $id]);
}

json_response(['error' => 'Desteklenmeyen HTTP metodu.'], 405);
