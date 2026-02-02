
# ------------------------------------------------------------------
# Portable Node.js Loader
# ------------------------------------------------------------------
# Usage: 
# 1. Download the Node.js Windows Binary (.zip) from https://nodejs.org/en/download/prebuilt-binaries
# 2. Extract the zip contents.
# 3. Rename the extracted folder to 'node_bin'.
# 4. Place the 'node_bin' folder inside this project folder: c:\dev\opa_app\node_bin
# 5. Run this script: .\portable-dev.ps1
# ------------------------------------------------------------------

$NodePath = Join-Path $PSScriptRoot "node_bin"

if (-not (Test-Path $NodePath)) {
    Write-Host "Error: Could not find 'node_bin' folder." -ForegroundColor Red
    Write-Host "Please download the Node.js ZIP, extract it, rename the folder to 'node_bin', and place it in this directory."
    Exit
}

# Add node to the current process PATH
$env:Path = "$NodePath;$env:Path"

Write-Host "Portable Node.js environment configured." -ForegroundColor Green
node -v 
npm -v 

Write-Host "`nInstalling dependencies (if needed)..."
npm install --no-audit --prefer-offline

Write-Host "`nStarting Development Server..."
npm run dev
