$rootDir = Split-Path -Parent $PSScriptRoot
$outputDir = Join-Path $rootDir "bot-build"

if (Test-Path $outputDir) {
    Write-Host "Existing build found. Removing $outputDir..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force $outputDir
}

New-Item -ItemType Directory -Force -Path "$outputDir\src" | Out-Null
New-Item -ItemType Directory -Force -Path "$outputDir\bot" | Out-Null

Copy-Item (Join-Path $rootDir "package.json"), (Join-Path $rootDir "pnpm-lock.yaml"), (Join-Path $rootDir "pnpm-workspace.yaml"), (Join-Path $rootDir "tsconfig.json") -Destination $outputDir
Copy-Item -Recurse (Join-Path $rootDir "src\lib") -Destination "$outputDir\src\lib"

# Copy env files if they exist in root
Get-ChildItem -Path $rootDir -Filter ".env*" -File | Copy-Item -Destination $outputDir

Get-ChildItem (Join-Path $rootDir "bot") -Exclude "data", "node_modules", "build-bot.ps1", "bot-build" | Copy-Item -Recurse -Destination "$outputDir\bot"

Write-Host "Files copied to $outputDir" -ForegroundColor Green

