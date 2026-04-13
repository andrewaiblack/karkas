$ErrorActionPreference = "Stop"

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$srcKeys = Join-Path $root "validator-keys\\assigned_data\\keys"
$srcSecrets = Join-Path $root "validator-keys\\assigned_data\\secrets"
$dst = Join-Path $root "data\\validator"

if (!(Test-Path $srcKeys) -or !(Test-Path $srcSecrets)) {
  throw "Missing validator-keys output. Run scripts/02-generate-keys.ps1 first."
}

New-Item -ItemType Directory -Force -Path (Join-Path $dst "validators") | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $dst "secrets") | Out-Null

Copy-Item -Recurse -Force (Join-Path $srcKeys "*") (Join-Path $dst "validators")
Copy-Item -Recurse -Force (Join-Path $srcSecrets "*") (Join-Path $dst "secrets")

Write-Host "Validator keys copied to $dst"
