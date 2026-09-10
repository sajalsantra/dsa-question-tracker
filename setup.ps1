$root = "c:\Users\SAJAL SANTRA\Documents\DSA Question Tracker"
Set-Location $root

# 1. Remove old vanilla files
$toRemove = @('css', 'js', 'firebase.json', 'firestore.rules', 'layout-demo.html', 'migrate.ps1', 'migrate2.ps1')
foreach ($item in $toRemove) {
    $p = Join-Path $root $item
    if (Test-Path $p) {
        Remove-Item $p -Recurse -Force
        Write-Host "Removed: $item"
    }
}

# 2. Copy questions.json to Angular assets
$assetDir = Join-Path $root "src\assets\data"
if (-not (Test-Path $assetDir)) {
    New-Item -Path $assetDir -ItemType Directory -Force | Out-Null
}
$src = Join-Path $root "data\questions.json"
$dst = Join-Path $assetDir "questions.json"
Copy-Item $src $dst -Force
Write-Host "Copied: questions.json -> src/assets/data/"

# 3. Remove old data dir
$dataDir = Join-Path $root "data"
if (Test-Path $dataDir) {
    Remove-Item $dataDir -Recurse -Force
    Write-Host "Removed: data/"
}

# 4. Create docs directory
$docsDir = Join-Path $root "docs"
if (-not (Test-Path $docsDir)) {
    New-Item -Path $docsDir -ItemType Directory -Force | Out-Null
    Write-Host "Created: docs/"
}

Write-Host "`n=== Final project structure ==="
Get-ChildItem $root -Force | Select-Object Name | Format-Table
