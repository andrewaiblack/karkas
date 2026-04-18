$ErrorActionPreference = "Stop"

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$envPath = Join-Path $root ".env"
$envLocalPath = Join-Path $root ".env.local"
$valuesPath = Join-Path $root "config\\values.env"
$genesisConfig = Join-Path $root "config\\el\\genesis-config.yaml"

$defaultMnemonic = "sleep moment list remain like wall lake industry canvas wonder ecology elite duck salad naive syrup frame brass utility club odor country obey pudding"

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
  throw "Docker is required to generate secrets. Please install docker first."
}

New-Item -ItemType File -Force -Path $envPath | Out-Null
New-Item -ItemType File -Force -Path $envLocalPath | Out-Null
New-Item -ItemType File -Force -Path $valuesPath | Out-Null

function Read-EnvValue([string]$path, [string]$key) {
  if (!(Test-Path $path)) { return $null }
  $line = Get-Content $path | Where-Object { $_ -match ("^\s*$key=") } | Select-Object -Last 1
  if (-not $line) { return $null }
  return ($line -replace "^\s*$key=", "")
}

function Read-ExportValue([string]$path, [string]$key) {
  if (!(Test-Path $path)) { return $null }
  $line = Get-Content $path | Where-Object { $_ -match ("^\s*export\s+$key=") } | Select-Object -Last 1
  if (-not $line) { return $null }
  $value = $line -replace "^\s*export\s+$key=", ""
  $value = $value.Trim()
  if ($value.StartsWith('"') -and $value.EndsWith('"')) {
    $value = $value.Substring(1, $value.Length - 2)
  }
  return $value
}

function Upsert-Env([string]$path, [string]$key, [string]$value) {
  $lines = if (Test-Path $path) { Get-Content $path } else { @() }
  $pattern = "^\s*$key="
  $newLine = "$key=$value"
  $updated = $false
  $out = foreach ($line in $lines) {
    if ($line -match $pattern) {
      $updated = $true
      $newLine
    } else {
      $line
    }
  }
  if (-not $updated) { $out += $newLine }
  Set-Content -Path $path -Value $out
}

function Upsert-Export([string]$path, [string]$key, [string]$value) {
  $lines = if (Test-Path $path) { Get-Content $path } else { @() }
  $pattern = "^\s*export\s+$key="
  $escaped = $value.Replace('"', '\"')
  $newLine = "export $key=`"$escaped`""
  $updated = $false
  $out = foreach ($line in $lines) {
    if ($line -match $pattern) {
      $updated = $true
      $newLine
    } else {
      $line
    }
  }
  if (-not $updated) { $out += $newLine }
  Set-Content -Path $path -Value $out
}

function Generate-Secrets() {
  $script = @"
import { Wallet } from 'ethers';
const validator = Wallet.createRandom();
const faucet = Wallet.createRandom();
console.log(`VALIDATOR_MNEMONIC=${validator.mnemonic.phrase}`);
console.log(`FAUCET_PRIVATE_KEY=${faucet.privateKey}`);
console.log(`FAUCET_ADDRESS=${faucet.address.toLowerCase()}`);
"@

  $args = @(
    "run","--rm",
    "node:20-alpine","sh","-lc",
    "npm -s init -y >/dev/null && npm -s i ethers@6 >/dev/null && node - <<'NODE'`n$script`nNODE"
  )
  & docker @args
}

function Derive-Address([string]$key) {
  $script = @"
import { Wallet } from 'ethers';
const key = process.env.FAUCET_KEY;
const wallet = new Wallet(key);
console.log(wallet.address.toLowerCase());
"@

  $args = @(
    "run","--rm",
    "-e","FAUCET_KEY=$key",
    "node:20-alpine","sh","-lc",
    "npm -s init -y >/dev/null && npm -s i ethers@6 >/dev/null && node - <<'NODE'`n$script`nNODE"
  )
  & docker @args
}

$needsMnemonic = $false
$needsFaucetKey = $false

$currentMnemonic = Read-ExportValue $valuesPath "EL_AND_CL_MNEMONIC"
if ([string]::IsNullOrWhiteSpace($currentMnemonic) -or $currentMnemonic -eq $defaultMnemonic) {
  $needsMnemonic = $true
}

$currentFaucetKey = Read-EnvValue $envPath "FAUCET_PRIVATE_KEY"
if ([string]::IsNullOrWhiteSpace($currentFaucetKey)) {
  $currentFaucetKey = Read-EnvValue $envLocalPath "FAUCET_PRIVATE_KEY"
}
if ([string]::IsNullOrWhiteSpace($currentFaucetKey)) {
  $needsFaucetKey = $true
}

$validatorMnemonic = $currentMnemonic
$faucetPrivateKey = $currentFaucetKey
$faucetAddress = Read-EnvValue $envPath "FAUCET_ADDRESS"

if ($needsMnemonic -or $needsFaucetKey) {
  Write-Host "Generating secrets with docker..."
  $secrets = Generate-Secrets
  if ($needsMnemonic) {
    $validatorMnemonic = ($secrets | Where-Object { $_ -like "VALIDATOR_MNEMONIC=*" }) -replace "^VALIDATOR_MNEMONIC=", ""
  }
  if ($needsFaucetKey) {
    $faucetPrivateKey = ($secrets | Where-Object { $_ -like "FAUCET_PRIVATE_KEY=*" }) -replace "^FAUCET_PRIVATE_KEY=", ""
    $faucetAddress = ($secrets | Where-Object { $_ -like "FAUCET_ADDRESS=*" }) -replace "^FAUCET_ADDRESS=", ""
  }
}

if ([string]::IsNullOrWhiteSpace($faucetAddress) -and -not [string]::IsNullOrWhiteSpace($faucetPrivateKey)) {
  Write-Host "Deriving faucet address from existing private key..."
  $faucetAddress = Derive-Address $faucetPrivateKey
}

if (-not [string]::IsNullOrWhiteSpace($validatorMnemonic)) {
  Upsert-Export $valuesPath "EL_AND_CL_MNEMONIC" $validatorMnemonic
}

if (-not [string]::IsNullOrWhiteSpace($faucetPrivateKey)) {
  Upsert-Env $envPath "FAUCET_PRIVATE_KEY" $faucetPrivateKey
  Upsert-Env $envLocalPath "FAUCET_PRIVATE_KEY" $faucetPrivateKey
}

if (-not [string]::IsNullOrWhiteSpace($faucetAddress)) {
  Upsert-Env $envPath "FAUCET_ADDRESS" $faucetAddress
  Upsert-Export $valuesPath "WITHDRAWAL_ADDRESS" $faucetAddress
}

$feeRecipient = Read-EnvValue $envPath "FEE_RECIPIENT"
if (-not [string]::IsNullOrWhiteSpace($faucetAddress) -and ([string]::IsNullOrWhiteSpace($feeRecipient) -or $feeRecipient -eq "0x0000000000000000000000000000000000000000")) {
  Upsert-Env $envPath "FEE_RECIPIENT" $faucetAddress
}

if (-not [string]::IsNullOrWhiteSpace($faucetAddress) -and (Test-Path $genesisConfig)) {
  $genesis = Get-Content $genesisConfig -Raw
  if ($genesis -match "0xYOUR_FAUCET_ADDRESS") {
    $genesis = $genesis -replace "0xYOUR_FAUCET_ADDRESS", $faucetAddress
  } elseif ($genesis -match "0x0000000000000000000000000000000000000000") {
    $genesis = $genesis -replace "0x0000000000000000000000000000000000000000", $faucetAddress
  }
  Set-Content -Path $genesisConfig -Value $genesis
}

Write-Host "Secrets ready."
