$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
$root = $PSScriptRoot
$port = 8000
$hostName = '127.0.0.1'
$adminUrl = "http://${hostName}:$port/admin/"

function Find-PHP {
    $candidates = @(
        'C:\xampp\php\php.exe',
        'D:\xampp\php\php.exe',
        'C:\wamp64\bin\php\php8.4.0\php.exe',
        'C:\wamp64\bin\php\php8.3.0\php.exe',
        'C:\wamp64\bin\php\php8.2.0\php.exe'
    )

    foreach ($candidate in $candidates) {
        if (Test-Path $candidate) { return $candidate }
    }

    $cmd = Get-Command php.exe -ErrorAction SilentlyContinue
    if ($cmd) { return $cmd.Source }
    return $null
}

function Test-PortListening([int]$Port) {
    try {
        $listener = Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction Stop
        return [bool]$listener
    }
    catch {
        try {
            $client = New-Object System.Net.Sockets.TcpClient
            $iar = $client.BeginConnect($hostName, $Port, $null, $null)
            $ok = $iar.AsyncWaitHandle.WaitOne(300)
            if ($ok -and $client.Connected) {
                $client.EndConnect($iar)
                $client.Close()
                return $true
            }
            $client.Close()
        } catch {}
        return $false
    }
}

$php = Find-PHP
if (-not $php) {
    Write-Host ''
    Write-Host 'PHP was not found.' -ForegroundColor Red
    Write-Host 'Install XAMPP, then run START-LOCALHOST.bat again.' -ForegroundColor Yellow
    Write-Host 'Do not open the admin folder with a D:\... path in Chrome.' -ForegroundColor Yellow
    exit 1
}

# Start XAMPP MySQL automatically when it is available and not already listening.
if (-not (Test-PortListening 3306)) {
    $mysqlStarters = @('C:\xampp\mysql_start.bat', 'D:\xampp\mysql_start.bat')
    foreach ($starter in $mysqlStarters) {
        if (Test-Path $starter) {
            Start-Process -FilePath 'cmd.exe' -ArgumentList '/c', ('"' + $starter + '"') -WindowStyle Minimized
            Start-Sleep -Seconds 2
            break
        }
    }
}

# Start PHP's local web server only when port 8000 is not already being used.
if (-not (Test-PortListening $port)) {
    # Start-Process joins array arguments without preserving spaces in path arguments.
    # Supply a single argument string with the document root explicitly quoted.
    $arguments = '-S {0}:{1} -t "{2}"' -f $hostName, $port, $root
    $logDir = Join-Path ([System.IO.Path]::GetTempPath()) 'FSA-LMS'
    if (-not (Test-Path -LiteralPath $logDir)) {
        New-Item -ItemType Directory -Path $logDir -Force | Out-Null
    }
    $stamp = [guid]::NewGuid().ToString('N').Substring(0, 8)
    $errorLog = Join-Path $logDir ("php-server-$stamp-error.log")
    $outputLog = Join-Path $logDir ("php-server-$stamp-output.log")
    try {
        Start-Process -FilePath $php -ArgumentList $arguments -WorkingDirectory $root `
            -WindowStyle Minimized -RedirectStandardError $errorLog `
            -RedirectStandardOutput $outputLog -ErrorAction Stop | Out-Null
    }
    catch {
        Write-Host ''
        Write-Host "Unable to launch PHP: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "PHP path: $php" -ForegroundColor Yellow
        Write-Host "Project path: $root" -ForegroundColor Yellow
        exit 1
    }

    $started = $false
    for ($i = 0; $i -lt 20; $i++) {
        Start-Sleep -Milliseconds 250
        if (Test-PortListening $port) {
            $started = $true
            break
        }
    }

    if (-not $started) {
        Write-Host ''
        Write-Host 'The PHP server did not start on port 8000.' -ForegroundColor Red
        Write-Host "PHP path: $php" -ForegroundColor Yellow
        Write-Host "Project path: $root" -ForegroundColor Yellow
        if (Test-Path -LiteralPath $errorLog) {
            $lastError = Get-Content -LiteralPath $errorLog -Tail 25 -ErrorAction SilentlyContinue
            if ($lastError) {
                Write-Host ''
                Write-Host 'Actual PHP error:' -ForegroundColor Red
                $lastError | ForEach-Object { Write-Host $_ }
            }
        }
        Write-Host "PHP error log: $errorLog" -ForegroundColor Cyan
        Write-Host "If needed, run this command from the project folder:" -ForegroundColor Yellow
        Write-Host ('& "{0}" -S 127.0.0.1:8000 -t "{1}"' -f $php, $root) -ForegroundColor Yellow
        exit 1
    }
}

Write-Host ''
Write-Host 'Full Stack Academy local server is running.' -ForegroundColor Green
Write-Host "Admin:   $adminUrl" -ForegroundColor Cyan
Write-Host "Website: http://${hostName}:$port/" -ForegroundColor Cyan
Write-Host ''
Write-Host 'IMPORTANT: Use the http:// address above. Do not use File / D:\... in Chrome.' -ForegroundColor Yellow

Start-Process $adminUrl
exit 0
