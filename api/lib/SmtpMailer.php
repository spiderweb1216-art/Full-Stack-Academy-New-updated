<?php
declare(strict_types=1);

final class SmtpMailer
{
    private $socket = null;
    private array $transcript = [];

    public function send(array $config, string $to, string $subject, string $html, string $plain = ''): array
    {
        $host = trim((string)($config['host'] ?? ''));
        $port = (int)($config['port'] ?? 587);
        $encryption = strtolower((string)($config['encryption'] ?? 'tls'));
        $username = trim((string)($config['username'] ?? ''));
        $password = (string)($config['password'] ?? '');
        $fromEmail = trim((string)($config['from_email'] ?? $username));
        $fromName = trim((string)($config['from_name'] ?? 'Full Stack Academy'));
        $timeout = max(5, min(30, (int)($config['timeout'] ?? 15)));

        if ($host === '' || $port < 1 || $fromEmail === '' || !filter_var($fromEmail, FILTER_VALIDATE_EMAIL)) {
            throw new InvalidArgumentException('SMTP host, port and a valid sender email are required.');
        }
        if (!filter_var($to, FILTER_VALIDATE_EMAIL)) {
            throw new InvalidArgumentException('A valid recipient email is required.');
        }

        $remote = ($encryption === 'ssl' ? 'ssl://' : '') . $host . ':' . $port;
        $errno = 0;
        $error = '';
        $this->socket = @stream_socket_client($remote, $errno, $error, $timeout, STREAM_CLIENT_CONNECT);
        if (!is_resource($this->socket)) {
            throw new RuntimeException("SMTP connection failed: {$error} ({$errno}).");
        }
        stream_set_timeout($this->socket, $timeout);

        try {
            $this->expect([220]);
            $domain = $_SERVER['HTTP_HOST'] ?? 'localhost';
            $this->command('EHLO ' . preg_replace('/[^a-z0-9.-]/i', '', $domain), [250]);

            if ($encryption === 'tls') {
                $this->command('STARTTLS', [220]);
                $cryptoOk = @stream_socket_enable_crypto($this->socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT);
                if ($cryptoOk !== true) {
                    throw new RuntimeException('Unable to enable TLS encryption for SMTP.');
                }
                $this->command('EHLO ' . preg_replace('/[^a-z0-9.-]/i', '', $domain), [250]);
            }

            if ($username !== '') {
                $this->command('AUTH LOGIN', [334]);
                $this->command(base64_encode($username), [334], true);
                $this->command(base64_encode($password), [235], true);
            }

            $this->command('MAIL FROM:<' . $fromEmail . '>', [250]);
            $this->command('RCPT TO:<' . $to . '>', [250, 251]);
            $this->command('DATA', [354]);

            $boundary = 'fsa_' . bin2hex(random_bytes(12));
            $messageIdDomain = preg_replace('/^.*@/', '', $fromEmail) ?: 'localhost';
            $headers = [
                'Date: ' . date(DATE_RFC2822),
                'Message-ID: <' . bin2hex(random_bytes(12)) . '@' . $messageIdDomain . '>',
                'From: ' . $this->encodeHeader($fromName) . ' <' . $fromEmail . '>',
                'To: <' . $to . '>',
                'Subject: ' . $this->encodeHeader($subject),
                'MIME-Version: 1.0',
                'Content-Type: multipart/alternative; boundary="' . $boundary . '"'
            ];
            $plain = $plain !== '' ? $plain : trim(html_entity_decode(strip_tags(str_replace(['<br>', '<br/>', '<br />'], "\n", $html))));
            $body = implode("\r\n", $headers) . "\r\n\r\n";
            $body .= '--' . $boundary . "\r\nContent-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: quoted-printable\r\n\r\n" . quoted_printable_encode($plain) . "\r\n";
            $body .= '--' . $boundary . "\r\nContent-Type: text/html; charset=UTF-8\r\nContent-Transfer-Encoding: quoted-printable\r\n\r\n" . quoted_printable_encode($html) . "\r\n";
            $body .= '--' . $boundary . "--\r\n";
            $body = preg_replace('/(?m)^\./', '..', $body) . "\r\n.\r\n";
            fwrite($this->socket, $body);
            $this->expect([250]);
            $this->command('QUIT', [221]);
        } finally {
            if (is_resource($this->socket)) {
                fclose($this->socket);
            }
            $this->socket = null;
        }

        return ['success' => true, 'message' => 'Email accepted by the SMTP server.'];
    }

    private function command(string $command, array $expected, bool $sensitive = false): string
    {
        if (!is_resource($this->socket)) {
            throw new RuntimeException('SMTP connection is not available.');
        }
        $this->transcript[] = 'C: ' . ($sensitive ? '[hidden]' : $command);
        fwrite($this->socket, $command . "\r\n");
        return $this->expect($expected);
    }

    private function expect(array $expected): string
    {
        if (!is_resource($this->socket)) {
            throw new RuntimeException('SMTP connection is not available.');
        }
        $response = '';
        while (($line = fgets($this->socket, 515)) !== false) {
            $response .= $line;
            if (strlen($line) < 4 || $line[3] === ' ') {
                break;
            }
        }
        $this->transcript[] = 'S: ' . trim($response);
        $code = (int)substr($response, 0, 3);
        if (!in_array($code, $expected, true)) {
            throw new RuntimeException('SMTP server rejected the request: ' . trim($response));
        }
        return $response;
    }

    private function encodeHeader(string $value): string
    {
        return '=?UTF-8?B?' . base64_encode($value) . '?=';
    }
}
