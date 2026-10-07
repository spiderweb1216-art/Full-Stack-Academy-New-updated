<?php
declare(strict_types=1);

final class Database
{
    private PDO $pdo;

    public function __construct(string $configFile)
    {
        if (!extension_loaded('pdo_mysql')) {
            throw new RuntimeException('The PDO MySQL PHP extension is required. Enable pdo_mysql in PHP or XAMPP.');
        }
        if (!is_file($configFile)) {
            throw new RuntimeException('Database is not installed. Open /install/ to complete setup.');
        }
        $config = require $configFile;
        if (!is_array($config)) {
            throw new RuntimeException('Database configuration is invalid.');
        }
        $host = (string)($config['host'] ?? '127.0.0.1');
        $port = (int)($config['port'] ?? 3306);
        $database = (string)($config['database'] ?? '');
        $charset = (string)($config['charset'] ?? 'utf8mb4');
        $dsn = "mysql:host={$host};port={$port};dbname={$database};charset={$charset}";
        $this->pdo = new PDO($dsn, (string)($config['username'] ?? ''), (string)($config['password'] ?? ''), [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
            PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES {$charset}",
        ]);
    }

    public function pdo(): PDO
    {
        return $this->pdo;
    }
}
