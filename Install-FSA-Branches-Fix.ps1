# Restore missing Branches admin functions in FSA LMS v5.1.
# Does not modify PHP, MySQL, database content, or port settings.
# Recommended: run from the extracted ZIP so branches-functions.js is beside this script.
param(
    [string]$ProjectPath = 'D:\Portals\full-stack-academy-lms-v5.1-structured (2)\full-stack-academy-lms-v5.1-structured'
)
$ErrorActionPreference = 'Stop'

$jsPath = Join-Path $ProjectPath 'admin\js\admin.js'
$htmlPath = Join-Path $ProjectPath 'admin\index.html'
$snippetPath = Join-Path $PSScriptRoot 'branches-functions.js'
foreach ($path in @($jsPath, $htmlPath, $snippetPath)) {
    if (-not (Test-Path -LiteralPath $path -PathType Leaf)) {
        throw "Required file not found: $path"
    }
}

$source = [System.IO.File]::ReadAllText($jsPath)
$html = [System.IO.File]::ReadAllText($htmlPath)
$snippet = [System.IO.File]::ReadAllText($snippetPath)
$hasRenderer = [regex]::IsMatch($source, '\bfunction\s+renderBranchesAdmin\s*\(')
$hasEditor = [regex]::IsMatch($source, '\bfunction\s+openBranchEditor\s*\(')

if ($hasRenderer -xor $hasEditor) {
    throw 'This project has only one of the two Branches functions. No files were changed; request a customized patch.'
}

$newJs = $source
if (-not $hasRenderer) {
    $anchor = '  async function renderCompaniesAdmin(){'
    if (-not $source.Contains($anchor) -or $source.IndexOf($anchor) -ne $source.LastIndexOf($anchor)) {
        throw 'Expected insertion point not found exactly once. No files were changed.'
    }
    $newJs = $source.Replace($anchor, $snippet.TrimEnd() + "`n" + $anchor)
}

# Changing the browser cache version ensures a previously cached admin.js is not reused.
$cachePattern = 'js/admin\.js\?v=[^"''<>\s]+'
if (-not [regex]::IsMatch($html, $cachePattern)) {
    throw 'Could not find the versioned admin JavaScript reference. No files were changed.'
}
$newHtml = [regex]::Replace($html, $cachePattern, 'js/admin.js?v=122.1-branches')

if ($source -ceq $newJs -and $html -ceq $newHtml) {
    Write-Host 'Both Branches functions and the cache version are already installed.' -ForegroundColor Green
    exit 0
}

# Validate the replacement JavaScript with Node.js only if Node is already installed.
# PHP-only XAMPP users do not need Node.js for the project.
$tempJs = Join-Path ([System.IO.Path]::GetTempPath()) ('fsa-branches-' + [guid]::NewGuid().ToString('N') + '.js')
try {
    [System.IO.File]::WriteAllText($tempJs, $newJs, (New-Object System.Text.UTF8Encoding($false)))
    $node = Get-Command node.exe -ErrorAction SilentlyContinue
    if ($node) {
        & $node.Source --check $tempJs
        if ($LASTEXITCODE -ne 0) { throw 'Patched JavaScript did not pass syntax validation. No files were changed.' }
    } else {
        Write-Host 'Node.js not installed; syntax validation skipped (Node.js is not needed to run the LMS).' -ForegroundColor Yellow
    }
} finally {
    if (Test-Path -LiteralPath $tempJs) { Remove-Item -LiteralPath $tempJs -Force }
}

$stamp = (Get-Date -Format 'yyyyMMdd-HHmmss') + '-' + [guid]::NewGuid().ToString('N').Substring(0,6)
$backupJs = "$jsPath.before-branches-$stamp.bak"
$backupHtml = "$htmlPath.before-branches-$stamp.bak"
Copy-Item -LiteralPath $jsPath -Destination $backupJs -ErrorAction Stop
Copy-Item -LiteralPath $htmlPath -Destination $backupHtml -ErrorAction Stop
try {
    $encoding = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($jsPath, $newJs, $encoding)
    [System.IO.File]::WriteAllText($htmlPath, $newHtml, $encoding)
} catch {
    Copy-Item -LiteralPath $backupJs -Destination $jsPath -Force
    Copy-Item -LiteralPath $backupHtml -Destination $htmlPath -Force
    throw
}
Write-Host ''
Write-Host 'Branches admin functions restored successfully.' -ForegroundColor Green
Write-Host "Updated: $jsPath"
Write-Host "Updated: $htmlPath"
Write-Host "Backup: $backupJs" -ForegroundColor Cyan
Write-Host "Backup: $backupHtml" -ForegroundColor Cyan
Write-Host 'Open http://localhost:8000/admin/#branches and press Ctrl+Shift+R.' -ForegroundColor Yellow
