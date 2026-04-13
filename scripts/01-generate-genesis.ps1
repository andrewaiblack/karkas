$ErrorActionPreference = "Stop"

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$configDir = Join-Path $root "config"
$outDir = Join-Path $root "artifacts"

function To-DockerPath([string]$path) {
  $full = (Resolve-Path $path).Path
  $drive = $full.Substring(0,1).ToLower()
  $rest = $full.Substring(2).Replace([char]92,'/')
  return "/$drive$rest"
}

if (Test-Path $outDir) {
  Remove-Item -Recurse -Force (Join-Path $outDir "*")
}
New-Item -ItemType Directory -Force -Path $outDir | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $outDir "metadata"), (Join-Path $outDir "jwt"), (Join-Path $outDir "parsed") | Out-Null

$genesisTimestamp = [int]([DateTimeOffset]::UtcNow.ToUnixTimeSeconds() + 120)

Write-Host "Generating genesis (GENESIS_TIMESTAMP=$genesisTimestamp)..."

$outDirDocker = To-DockerPath $outDir
$configDirDocker = To-DockerPath $configDir

$args = @(
  "run","--rm",
  "-v","${outDirDocker}:/data",
  "-v","${configDirDocker}:/config",
  "-e","GENESIS_TIMESTAMP=$genesisTimestamp",
  "ethpandaops/ethereum-genesis-generator:master",
  "all"
)

& docker @args
