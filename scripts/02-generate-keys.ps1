$ErrorActionPreference = "Stop"

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$valuesPath = Join-Path $root "config\\values.env"
$outDir = Join-Path $root "validator-keys"

function To-DockerPath([string]$path) {
  $full = (Resolve-Path $path).Path
  $drive = $full.Substring(0,1).ToLower()
  $rest = $full.Substring(2).Replace([char]92,'/')
  return "/$drive$rest"
}

if (!(Test-Path $valuesPath)) {
  throw "Missing $valuesPath"
}

function Get-EnvValue([string]$key) {
  $line = Get-Content $valuesPath | Where-Object { $_ -match ("^\s*export\s+$key=") } | Select-Object -Last 1
  if (-not $line) { return $null }
  $value = $line -replace "^\s*export\s+$key=", ""
  $value = $value.Trim()
  if ($value.StartsWith('"') -and $value.EndsWith('"')) {
    $value = $value.Substring(1, $value.Length - 2)
  }
  return $value
}

$mnemonic = Get-EnvValue "EL_AND_CL_MNEMONIC"
$count = Get-EnvValue "NUMBER_OF_VALIDATORS"

if (-not $mnemonic) { throw "EL_AND_CL_MNEMONIC not found in values.env" }
if (-not $count) { throw "NUMBER_OF_VALIDATORS not found in values.env" }

if (Test-Path $outDir) {
  Remove-Item -Recurse -Force $outDir
}
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

$outDirDocker = To-DockerPath $outDir

$args = @(
  "run","--rm",
  "-v","${outDirDocker}:/out",
  "--entrypoint","/usr/local/bin/eth2-val-tools",
  "ethpandaops/ethereum-genesis-generator:master",
  "keystores",
  "--source-mnemonic=$mnemonic",
  "--source-min=0",
  "--source-max=$count",
  "--out-loc","/out/assigned_data",
  "--insecure"
)

Write-Host "Generating $count validator keystores..."
& docker @args
