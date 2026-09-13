<?php
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

function json_out($code, $data) {
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function load_telegram_config() {
    $token = '';
    $chatId = '';

    $local = __DIR__ . '/config.local.php';
    if (is_readable($local)) {
        $cfg = include $local;
        if (is_array($cfg)) {
            $token = trim((string)($cfg['bot_token'] ?? $cfg['TELEGRAM_BOT_TOKEN'] ?? ''));
            $chatId = trim((string)($cfg['chat_id'] ?? $cfg['TELEGRAM_CHAT_ID'] ?? ''));
        }
    }

    if ($token === '' || $chatId === '') {
        $jsonPath = dirname(__DIR__) . '/config/telegram.json';
        if (is_readable($jsonPath)) {
            $cfg = json_decode((string)file_get_contents($jsonPath), true);
            if (is_array($cfg)) {
                if ($token === '') {
                    $token = trim((string)($cfg['TELEGRAM_BOT_TOKEN'] ?? ''));
                }
                if ($chatId === '') {
                    $chatId = trim((string)($cfg['TELEGRAM_CHAT_ID'] ?? ''));
                }
            }
        }
    }

    return [$token, $chatId];
}

function sanitize_tg($text, $limit = 2000) {
    if ($text === null || $text === '') {
        return '—';
    }
    $text = preg_replace('/[\x00-\x1F\\\\]/u', ' ', (string)$text);
    if (function_exists('mb_substr')) {
        return mb_substr($text, 0, $limit, 'UTF-8');
    }
    return substr($text, 0, $limit);
}

function format_rub($n) {
    return number_format((float)$n, 0, '.', ' ') . ' ₽';
}

function build_order_message($body, $pageUrl) {
    $name = sanitize_tg($body['name'] ?? '');
    $phone = sanitize_tg($body['phone'] ?? '');
    $comment = sanitize_tg($body['comment'] ?? '');
    $address = sanitize_tg($body['address'] ?? '');
    $source = sanitize_tg($body['source'] ?? 'Сайт');
    $orderType = sanitize_tg($body['orderType'] ?? 'Заявка');
    $safePage = sanitize_tg($pageUrl);
    $cart = isset($body['cart']) && is_array($body['cart']) ? $body['cart'] : [];

    $tz = new DateTimeZone('Europe/Moscow');
    $now = (new DateTime('now', $tz))->format('d.m.Y, H:i:s');

    $message = "📩 {$orderType} — АЛКОдоставка\n\n";
    $message .= "👤 Имя: {$name}\n";
    $message .= "📞 Телефон: {$phone}\n";

    if ($address !== '—') {
        $message .= "📍 Адрес: {$address}\n";
    }

    $items = [];
    foreach ($cart as $it) {
        if (!is_array($it) || empty($it['name'])) {
            continue;
        }
        $items[] = $it;
    }

    if ($items) {
        $message .= "\n📦 Состав заказа:\n";
        $total = 0;
        $idx = 1;
        foreach ($items as $it) {
            $qty = max(1, (int)($it['qty'] ?? $it['quantity'] ?? 1));
            $price = (float)($it['price'] ?? 0);
            $lineTotal = $price * $qty;
            $total += $lineTotal;
            $itemName = sanitize_tg($it['name'], 200);
            $message .= "{$idx}. {$itemName} × {$qty} — " . format_rub($lineTotal) . "\n";
            $idx++;
        }
        $message .= "\n💰 Итого: " . format_rub($total) . "\n";
    }

    if ($comment !== '—') {
        $message .= "\n💬 Комментарий: {$comment}\n";
    }

    $message .= "\n🕐 Время: {$now}\n";
    $message .= "📍 Источник: {$source}";
    if ($pageUrl) {
        $message .= "\nСтраница: {$safePage}";
    }

    return $message;
}

function telegram_send($token, $chatId, $text) {
    $url = 'https://api.telegram.org/bot' . $token . '/sendMessage';
    $payload = json_encode([
        'chat_id' => $chatId,
        'text' => $text,
        'disable_web_page_preview' => true,
    ], JSON_UNESCAPED_UNICODE);

    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => $payload,
            CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CONNECTTIMEOUT => 10,
            CURLOPT_TIMEOUT => 20,
            CURLOPT_SSL_VERIFYPEER => true,
        ]);
        $raw = curl_exec($ch);
        $err = curl_error($ch);
        curl_close($ch);
        if ($raw === false) {
            return [false, $err !== '' ? $err : 'Не удалось связаться с Telegram', 'TELEGRAM_NETWORK'];
        }
        $data = json_decode($raw, true);
        if (!empty($data['ok'])) {
            return [true, null, null];
        }
        return [false, $data['description'] ?? 'Telegram API error', 'TELEGRAM_API'];
    }

    $ctx = stream_context_create([
        'http' => [
            'method' => 'POST',
            'header' => "Content-Type: application/json\r\n",
            'content' => $payload,
            'timeout' => 20,
            'ignore_errors' => true,
        ],
    ]);
    $raw = @file_get_contents($url, false, $ctx);
    if ($raw === false) {
        return [false, 'Не удалось связаться с Telegram', 'TELEGRAM_NETWORK'];
    }
    $data = json_decode($raw, true);
    if (!empty($data['ok'])) {
        return [true, null, null];
    }
    return [false, $data['description'] ?? 'Telegram API error', 'TELEGRAM_API'];
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
list($token, $chatId) = load_telegram_config();

if ($method === 'GET') {
    $configured = ($token !== '' && $chatId !== '');
    json_out(200, [
        'ok' => $configured,
        'configured' => $configured,
        'hasToken' => $token !== '',
        'hasChatId' => $chatId !== '',
        'hint' => $configured ? null : 'Задайте токен в api/config.local.php или config/telegram.json',
    ]);
}

if ($method === 'OPTIONS') {
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    http_response_code(204);
    exit;
}

if ($method !== 'POST') {
    json_out(405, ['error' => 'Method not allowed']);
}

$raw = file_get_contents('php://input');
$body = json_decode($raw, true);
if (!is_array($body)) {
    $body = $_POST;
}
if (!is_array($body)) {
    json_out(400, ['error' => 'Некорректный JSON', 'code' => 'INVALID_JSON']);
}

if ($token === '' || $chatId === '') {
    json_out(503, [
        'error' => 'Telegram не настроен: задайте токен в api/config.local.php',
        'code' => 'TELEGRAM_NOT_CONFIGURED',
    ]);
}

$message = isset($body['message']) ? trim((string)$body['message']) : '';
$name = isset($body['name']) ? trim((string)$body['name']) : '';
$phone = isset($body['phone']) ? trim((string)$body['phone']) : '';
$pageUrl = isset($body['pageUrl']) ? (string)$body['pageUrl'] : (string)($_SERVER['HTTP_REFERER'] ?? '');

if ($message !== '' && $name === '' && $phone === '') {
    list($ok, $error, $code) = telegram_send($token, $chatId, $message);
    if ($ok) {
        json_out(200, ['success' => true]);
    }
    json_out($code === 'TELEGRAM_NOT_CONFIGURED' ? 503 : 502, [
        'error' => $error,
        'code' => $code ?: 'TELEGRAM_ERROR',
    ]);
}

if ($name === '' || $phone === '') {
    json_out(400, ['error' => 'Имя и телефон обязательны', 'code' => 'VALIDATION']);
}

$text = build_order_message($body, $pageUrl);
list($ok, $error, $code) = telegram_send($token, $chatId, $text);
if ($ok) {
    json_out(200, ['success' => true]);
}

json_out($code === 'TELEGRAM_NOT_CONFIGURED' ? 503 : 502, [
    'error' => $error,
    'code' => $code ?: 'TELEGRAM_ERROR',
]);
