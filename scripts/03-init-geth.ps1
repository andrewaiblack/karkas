$ErrorActionPreference = "Stop"

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$genesis = Join-Path $root "artifacts\\metadata\\genesis.json"
$datadir = Join-Path $root "data\\el"

function To-DockerPath([string]$path) {
  $full = (Resolve-Path $path).Path
  $drive = $full.Substring(0,1).ToLower()
  $rest = $full.Substring(2).Replace([char]92,'/')
  return "/$drive$rest"
}

if (!(Test-Path $genesis)) {
  throw "Missing $genesis. Run scripts/01-generate-genesis.ps1 first."
}

New-Item -ItemType Directory -Force -Path $datadir | Out-Null

$datadirDocker = To-DockerPath $datadir
$genesisDocker = To-DockerPath $genesis

$args = @(
  "run","--rm",
  "-v","${datadirDocker}:/data",
  "-v","${genesisDocker}:/genesis.json",
  "ethereum/client-go",
  "init",
  "--datadir","/data",
  "/genesis.json"
)

Write-Host "Initializing geth datadir..."
& docker @args
