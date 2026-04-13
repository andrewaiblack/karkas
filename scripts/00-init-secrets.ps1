$ErrorActionPreference = "Stop"

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$values = Join-Path $root "config\\values.env"
$envLocal = Join-Path $root ".env.local"
$envLocalExample = Join-Path $root ".env.local.example"

if (!(Test-Path $values)) {
  throw "Missing $values"
}

if (!(Test-Path $envLocal)) {
  if (Test-Path $envLocalExample) {
    Copy-Item $envLocalExample $envLocal
  } else {
    New-Item -ItemType File -Path $envLocal | Out-Null
  }
}

function Trim-Quotes([string]$v) {
  if ($null -eq $v) { return "" }
  $v = $v.Trim()
  if ($v.StartsWith('"') -and $v.EndsWith('"')) { return $v.Substring(1, $v.Length - 2) }
  if ($v.StartsWith("'") -and $v.EndsWith("'")) { return $v.Substring(1, $v.Length - 2) }
  return $v
}

function Get-Export([string]$key) {
  $line = Get-Content $values | Where-Object { $_ -match ("^\s*export\s+$key=") } | Select-Object -Last 1
  if (-not $line) { return "" }
  $value = $line -replace "^\s*export\s+$key=", ""
  return (Trim-Quotes $value)
}

function Set-Export([string]$key, [string]$value, [string]$quote = "double") {
  $line = switch ($quote) {
    "none" { "export $key=$value" }
    "single" { "export $key='$value'" }
    default { "export $key=`"$value`"" }
  }
  $content = Get-Content $values
  $re = "^\s*export\s+$key="
  $out = @()
  $done = $false
  foreach ($l in $content) {
    if ($l -match $re) {
      if (-not $done) { $out += $line; $done = $true }
      continue
    }
    $out += $l
  }
  if (-not $done) { $out += ""; $out += $line }
  Set-Content -Path $values -Value $out
}

function Get-EnvLocal([string]$key) {
  $line = Get-Content $envLocal | Where-Object { $_ -match ("^\s*$key=") } | Select-Object -Last 1
  if (-not $line) { return "" }
  $value = $line -replace "^\s*$key=", ""
  return (Trim-Quotes $value)
}

function Set-EnvLocal([string]$key, [string]$value) {
  $line = "$key=$value"
  $content = Get-Content $envLocal
  $re = "^\s*$key="
  $out = @()
  $done = $false
  foreach ($l in $content) {
    if ($l -match $re) {
      if (-not $done) { $out += $line; $done = $true }
      continue
    }
    $out += $l
  }
  if (-not $done) { $out += ""; $out += $line }
  Set-Content -Path $envLocal -Value $out
}

function Is-ValidPk([string]$pk) {
  return $pk -match "^0x[0-9a-fA-F]{64}$"
}

function Normalize-Pk([string]$pk) {
  $pk = Trim-Quotes $pk
  if (-not $pk) { return "" }
  if ($pk -notmatch "^0x") { $pk = "0x$pk" }
  return $pk
}

function Word-Count([string]$v) {
  if (-not $v) { return 0 }
  return ($v -split "\s+" | Where-Object { $_ -ne "" }).Count
}

function Is-Valid-Mnemonic([string]$v) {
  return (Word-Count $v) -eq 24
}

function Run-WalletTool([string]$pk, [string]$mnemonic) {
  $script = @'
set -e
npm init -y >/dev/null 2>&1
npm install ethers@6.11.1 --no-audit --no-fund >/dev/null 2>&1
node --input-type=module -e "import { Wallet, Mnemonic } from 'ethers'; import { randomBytes } from 'crypto'; const pk = process.env.PK || ''; const mnemonic = process.env.MNEMONIC || ''; const wallet = pk ? new Wallet(pk) : Wallet.createRandom(); const phrase = mnemonic && mnemonic.trim().length ? mnemonic : Mnemonic.entropyToPhrase(randomBytes(32)); console.log('PK=' + wallet.privateKey); console.log('ADDR=' + wallet.address); console.log('MNEMONIC=' + phrase);"
'@
  $args = @(
    "run","--rm",
    "-e","PK=$pk",
    "-e","MNEMONIC=$mnemonic",
    "node:20-alpine",
    "sh","-lc",$script
  )
  return & docker @args
}

$pk = Normalize-Pk (Get-EnvLocal "FAUCET_PRIVATE_KEY")
$mnemonic = Get-Export "EL_AND_CL_MNEMONIC"
$premineAddrs = Get-Export "EL_PREMINE_ADDRS"

if ($pk -eq "0xYOUR_FAUCET_WALLET_PRIVATE_KEY" -or $pk -eq "YOUR_FAUCET_WALLET_PRIVATE_KEY") {
  $pk = ""
}

$needsPk = (-not $pk) -or (-not (Is-ValidPk $pk))
$needsMnemonic = (-not $mnemonic) -or (-not (Is-Valid-Mnemonic $mnemonic))
$needsPremine = (-not $premineAddrs)

if ($needsPk -or $needsMnemonic -or $needsPremine) {
  $output = Run-WalletTool $pk $mnemonic
  if (-not $output) {
    throw "Failed to generate secrets. Check Docker access and placeholder values in .env.local.example."
  }
  $newPk = ($output | Where-Object { $_ -like "PK=*" } | Select-Object -First 1) -replace "^PK=", ""
  $newAddr = ($output | Where-Object { $_ -like "ADDR=*" } | Select-Object -First 1) -replace "^ADDR=", ""
  $newMnemonic = ($output | Where-Object { $_ -like "MNEMONIC=*" } | Select-Object -First 1) -replace "^MNEMONIC=", ""

  if ($needsPk) {
    $pk = $newPk
    Set-EnvLocal "FAUCET_PRIVATE_KEY" $pk
  }

  if ($needsMnemonic) {
    $mnemonic = $newMnemonic
    Set-Export "EL_AND_CL_MNEMONIC" $mnemonic "double"
  }

  if ($newAddr -and ($needsPremine -or $needsPk)) {
    Set-Export "EL_PREMINE_COUNT" "0" "none"
    Set-Export "EL_PREMINE_ADDRS" ("{`"$newAddr`":{`"balance`":`"1000000000ETH`"}}") "single"
  }
}

if (-not (Get-EnvLocal "FAUCET_PRIVATE_KEY")) {
  throw "FAUCET_PRIVATE_KEY is still empty. Fill it in $envLocal"
}
