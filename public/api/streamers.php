<?php
declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

const STREAMER_ALLOWED_PLATFORMS = ['kick', 'twitch'];
const STREAMER_ALLOWED_VILLAGES = ['konoha', 'suna', 'diger'];

function normalize_streamer_channel(string $rawInput, string $defaultPlatform): array
{
    $trimmed = ltrim(trim($rawInput), '@');
    $platform = in_array($defaultPlatform, STREAMER_ALLOWED_PLATFORMS, true) ? $defaultPlatform : 'kick';

    if (preg_match('/(?:https?:\/\/)?(?:www\.)?twitch\.tv\/([a-zA-Z0-9_-]{2,40})/i', $trimmed, $matches)) {
        return ['channel' => $matches[1], 'platform' => 'twitch'];
    }

    if (preg_match('/(?:https?:\/\/)?(?:www\.)?kick\.com\/([a-zA-Z0-9_-]{2,40})/i', $trimmed, $matches)) {
        return ['channel' => $matches[1], 'platform' => 'kick'];
    }

    $clean = preg_replace('/[^a-zA-Z0-9_-]/', '', $trimmed) ?? '';
    return ['channel' => $clean, 'platform' => $platform];
}

function normalize_streamer_item(mixed $raw): ?array
{
    if (!is_array($raw)) {
        return null;
    }

    $id = trim((string)($raw['id'] ?? ''));
    $name = normalize_text_field((string)($raw['name'] ?? ''), 60);
    $channel = trim((string)($raw['channel'] ?? ''));
    $platform = strtolower(trim((string)($raw['platform'] ?? 'kick')));
    $village = strtolower(trim((string)($raw['village'] ?? 'diger')));
    $roleTag = normalize_text_field((string)($raw['roleTag'] ?? ''), 40);
    $isDefaultActive = (bool)($raw['isDefaultActive'] ?? false);

    if ($channel === '' || $name === '') {
        return null;
    }
    if (!in_array($platform, STREAMER_ALLOWED_PLATFORMS, true)) {
        $platform = 'kick';
    }
    if (!in_array($village, STREAMER_ALLOWED_VILLAGES, true)) {
        $village = 'diger';
    }
    if ($id === '') {
        $id = strtolower($platform . '-' . $channel);
    }

    $item = [
        'id' => $id,
        'name' => $name,
        'channel' => $channel,
        'platform' => $platform,
        'village' => $village,
        'isDefaultActive' => $isDefaultActive,
    ];
    if ($roleTag !== '') {
        $item['roleTag'] = $roleTag;
    }

    return $item;
}

function sort_streamers_alphabetically(array $streams): array
{
    $collator = class_exists('Collator') ? new Collator('tr_TR') : null;
    if ($collator instanceof Collator) {
        $collator->setStrength(Collator::SECONDARY);
    }

    usort($streams, static function (array $a, array $b) use ($collator): int {
        $nameA = (string)($a['name'] ?? '');
        $nameB = (string)($b['name'] ?? '');
        if ($collator instanceof Collator) {
            $cmp = $collator->compare($nameA, $nameB);
            if ($cmp !== false) {
                return $cmp;
            }
        }
        return strcasecmp($nameA, $nameB);
    });

    return $streams;
}

function load_streamers_list(): array
{
    $dataFile = fanart_data_dir() . '/streamers.json';
    $rawList = [];

    if (is_file($dataFile)) {
        $rawList = read_json_store('streamers.json');
    } else {
        $seedPath = fanart_root_dir() . '/streamers.json';
        if (is_file($seedPath)) {
            $content = @file_get_contents($seedPath);
            if ($content !== false) {
                $decoded = json_decode($content, true);
                if (is_array($decoded)) {
                    $rawList = isset($decoded['streams']) && is_array($decoded['streams'])
                        ? $decoded['streams']
                        : $decoded;
                }
            }
        }
    }

    $items = [];
    foreach ($rawList as $entry) {
        $normalized = normalize_streamer_item($entry);
        if ($normalized !== null) {
            $items[] = $normalized;
        }
    }

    return sort_streamers_alphabetically($items);
}

function generate_unique_streamer_id(string $channel, string $platform, array $existing): string
{
    $base = sanitize_slug($channel);
    if ($base === 'fanart' && strtolower($channel) !== 'fanart') {
        $base = strtolower(preg_replace('/[^a-zA-Z0-9-]+/', '-', $channel) ?? 'streamer');
        $base = trim($base, '-') ?: 'streamer';
    }

    $used = [];
    foreach ($existing as $item) {
        $used[(string)($item['id'] ?? '')] = true;
    }

    if (!isset($used[$base])) {
        return $base;
    }

    $withPlatform = $platform . '-' . $base;
    if (!isset($used[$withPlatform])) {
        return $withPlatform;
    }

    $counter = 2;
    while (isset($used[$base . '-' . $counter])) {
        $counter++;
    }
    return $base . '-' . $counter;
}

function has_duplicate_channel(array $streams, string $platform, string $channel, ?string $ignoreId = null): bool
{
    $targetKey = $platform . ':' . strtolower($channel);
    foreach ($streams as $item) {
        if ($ignoreId !== null && ($item['id'] ?? '') === $ignoreId) {
            continue;
        }
        $key = ($item['platform'] ?? '') . ':' . strtolower((string)($item['channel'] ?? ''));
        if ($key === $targetKey) {
            return true;
        }
    }
    return false;
}

$method = strtoupper((string)($_SERVER['REQUEST_METHOD'] ?? 'GET'));
$config = load_fanart_config();

if ($method === 'GET') {
    json_response(['streams' => load_streamers_list()]);
}

if ($method === 'POST') {
    verify_same_origin();
    require_admin($config);

    $body = read_json_body();
    $name = normalize_text_field((string)($body['name'] ?? ''), 60);
    $rawChannel = (string)($body['channel'] ?? '');
    $rawPlatform = strtolower(trim((string)($body['platform'] ?? 'kick')));
    $village = strtolower(trim((string)($body['village'] ?? 'konoha')));
    $roleTag = normalize_text_field((string)($body['roleTag'] ?? ''), 40);
    $isDefaultActive = (bool)($body['isDefaultActive'] ?? false);

    $parsed = normalize_streamer_channel($rawChannel, $rawPlatform);
    $channel = $parsed['channel'];
    $platform = $parsed['platform'];

    if ($name === '') {
        json_response(['error' => 'Karakter / görünen ad zorunludur.'], 400);
    }
    if (!preg_match('/^[a-zA-Z0-9_-]{2,40}$/', $channel)) {
        json_response(['error' => 'Geçerli bir kanal adı veya Twitch/Kick bağlantısı girin.'], 400);
    }
    if (!in_array($village, STREAMER_ALLOWED_VILLAGES, true)) {
        json_response(['error' => 'Geçersiz köy seçimi.'], 400);
    }

    $streams = load_streamers_list();
    if (has_duplicate_channel($streams, $platform, $channel)) {
        json_response(['error' => 'Bu platformda bu kanal zaten kayıtlı.'], 409);
    }

    $newItem = [
        'id' => generate_unique_streamer_id($channel, $platform, $streams),
        'name' => $name,
        'channel' => $channel,
        'platform' => $platform,
        'village' => $village,
        'isDefaultActive' => $isDefaultActive,
    ];
    if ($roleTag !== '') {
        $newItem['roleTag'] = $roleTag;
    }

    $streams[] = $newItem;
    $streams = sort_streamers_alphabetically($streams);
    if (!write_json_store('streamers.json', $streams)) {
        json_response(['error' => 'Yayıncı listesi kaydedilemedi (fanart-data/ yazma izinlerini kontrol edin).'], 500);
    }

    json_response(['item' => $newItem, 'streams' => $streams], 201);
}

if ($method === 'PATCH') {
    verify_same_origin();
    require_admin($config);

    $body = read_json_body();
    $id = trim((string)($body['id'] ?? ''));
    if ($id === '') {
        json_response(['error' => 'Düzenlenecek yayıncı kimliği belirtilmedi.'], 400);
    }

    $streams = load_streamers_list();
    $foundIndex = null;
    foreach ($streams as $idx => $item) {
        if (($item['id'] ?? '') === $id) {
            $foundIndex = $idx;
            break;
        }
    }

    if ($foundIndex === null) {
        json_response(['error' => 'Güncellenecek yayıncı bulunamadı.'], 404);
    }

    $current = $streams[$foundIndex];
    $name = isset($body['name'])
        ? normalize_text_field((string)$body['name'], 60)
        : (string)$current['name'];
    $rawChannel = isset($body['channel'])
        ? (string)$body['channel']
        : (string)$current['channel'];
    $rawPlatform = isset($body['platform'])
        ? strtolower(trim((string)$body['platform']))
        : (string)$current['platform'];
    $village = isset($body['village'])
        ? strtolower(trim((string)$body['village']))
        : (string)$current['village'];
    $roleTag = array_key_exists('roleTag', $body)
        ? normalize_text_field((string)$body['roleTag'], 40)
        : (string)($current['roleTag'] ?? '');
    $isDefaultActive = array_key_exists('isDefaultActive', $body)
        ? (bool)$body['isDefaultActive']
        : (bool)($current['isDefaultActive'] ?? false);

    $parsed = normalize_streamer_channel($rawChannel, $rawPlatform);
    $channel = $parsed['channel'];
    $platform = $parsed['platform'];

    if ($name === '') {
        json_response(['error' => 'Karakter / görünen ad zorunludur.'], 400);
    }
    if (!preg_match('/^[a-zA-Z0-9_-]{2,40}$/', $channel)) {
        json_response(['error' => 'Geçerli bir kanal adı veya Twitch/Kick bağlantısı girin.'], 400);
    }
    if (!in_array($village, STREAMER_ALLOWED_VILLAGES, true)) {
        json_response(['error' => 'Geçersiz köy seçimi.'], 400);
    }
    if (has_duplicate_channel($streams, $platform, $channel, $id)) {
        json_response(['error' => 'Bu platformda bu kanal zaten kayıtlı.'], 409);
    }

    $updated = [
        'id' => $id,
        'name' => $name,
        'channel' => $channel,
        'platform' => $platform,
        'village' => $village,
        'isDefaultActive' => $isDefaultActive,
    ];
    if ($roleTag !== '') {
        $updated['roleTag'] = $roleTag;
    }

    $streams[$foundIndex] = $updated;
    $streams = sort_streamers_alphabetically($streams);
    if (!write_json_store('streamers.json', $streams)) {
        json_response(['error' => 'Yayıncı listesi kaydedilemedi.'], 500);
    }

    json_response(['item' => $updated, 'streams' => $streams]);
}

if ($method === 'DELETE') {
    verify_same_origin();
    require_admin($config);

    $body = read_json_body();
    $id = trim((string)($_GET['id'] ?? $body['id'] ?? ''));
    if ($id === '') {
        json_response(['error' => 'Silinecek yayıncı kimliği belirtilmedi.'], 400);
    }

    $streams = load_streamers_list();
    $remaining = [];
    $removed = false;
    foreach ($streams as $item) {
        if (($item['id'] ?? '') === $id && !$removed) {
            $removed = true;
            continue;
        }
        $remaining[] = $item;
    }

    if (!$removed) {
        json_response(['error' => 'Silinecek yayıncı bulunamadı.'], 404);
    }

    if (!write_json_store('streamers.json', $remaining)) {
        json_response(['error' => 'Yayıncı listesi kaydedilemedi.'], 500);
    }

    json_response(['deleted' => $id, 'streams' => $remaining]);
}

json_response(['error' => 'Desteklenmeyen HTTP metodu.'], 405);
