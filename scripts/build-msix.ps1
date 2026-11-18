param(
  [switch]$SkipWebBuild
)

$ErrorActionPreference = 'Stop'

$Root = Split-Path -Parent $PSScriptRoot
$Pkg = Get-Content (Join-Path $Root 'package.json') -Raw | ConvertFrom-Json
$Version = $Pkg.version
$Code = if ($Pkg.versionCode) { $Pkg.versionCode } else { 1 }
$Tag = "v$Version"

$MakeAppx = Get-ChildItem "C:\Program Files (x86)\Windows Kits\10\bin" -Recurse -Filter "makeappx.exe" -ErrorAction SilentlyContinue |
  Where-Object { $_.FullName -match '\\x64\\' } |
  Select-Object -First 1 -ExpandProperty FullName

if (-not $MakeAppx) {
  throw "makeappx.exe not found under Windows Kits 10 SDK."
}

Push-Location $Root
try {
  if (-not $SkipWebBuild) {
    Write-Host "Building web bundle (npm run build)..."
    npm run build
    if ($LASTEXITCODE -ne 0) {
      throw "npm run build failed with exit code $LASTEXITCODE"
    }
  }

  Write-Host "Packaging Electron app (win-unpacked)..."
  npx electron-builder --win dir
  if ($LASTEXITCODE -ne 0) {
    throw "electron-builder --win dir failed with exit code $LASTEXITCODE"
  }
} finally {
  Pop-Location
}

$ElectronUnpacked = Join-Path $Root 'build\electron\win-unpacked'
if (-not (Test-Path (Join-Path $ElectronUnpacked 'Zorbit.exe'))) {
  throw "Electron executable not found at $ElectronUnpacked\Zorbit.exe"
}

$StageDir = Join-Path $Root 'build\msix'
$AppDest = Join-Path $StageDir 'app'
$AssetsDest = Join-Path $StageDir 'Assets'
if (Test-Path $StageDir) { Remove-Item -Recurse -Force $StageDir }
New-Item -ItemType Directory -Force -Path $AppDest | Out-Null
New-Item -ItemType Directory -Force -Path $AssetsDest | Out-Null

Copy-Item (Join-Path $ElectronUnpacked '*') -Destination $AppDest -Recurse -Force

$ManifestSrc = Join-Path $Root 'windows\AppxManifest.xml'
$Utf8NoBom = New-Object System.Text.UTF8Encoding($false)
$ManifestXml = [System.IO.File]::ReadAllText($ManifestSrc, $Utf8NoBom) -replace '(?<![A-Za-z])Version="\d+\.\d+\.\d+\.\d+"', "Version=`"$Version.0`""
[System.IO.File]::WriteAllText((Join-Path $StageDir 'AppxManifest.xml'), $ManifestXml, $Utf8NoBom)

Copy-Item (Join-Path $Root 'docs\assets\microsoft\*.png') -Destination $AssetsDest

$OutDir = Join-Path $Root "releases\$Tag"
New-Item -ItemType Directory -Force -Path $OutDir | Out-Null
$OutMsix = Join-Path $OutDir "zorbit-$Tag-build$Code.msix"

& $MakeAppx pack /d $StageDir /p $OutMsix /o
if ($LASTEXITCODE -ne 0) {
  throw "makeappx failed with exit code $LASTEXITCODE"
}

Write-Host "MSIX created: $OutMsix"
