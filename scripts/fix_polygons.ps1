
# Fix all polygon entries that have [, ] (empty) values in localities.json
$file = "C:\Users\Naveen\OneDrive\Desktop\PlotDNA\data\cities\hyderabad\localities.json"

# Delta values by slug (same as what was defined in expand_localities.ps1)
$deltas = @{
  # CENTRAL
  "ameerpet"=@(0.010,0.012); "punjagutta"=@(0.010,0.012); "khairatabad"=@(0.010,0.012);
  "himayathnagar"=@(0.010,0.012); "narayanguda"=@(0.010,0.012); "abids"=@(0.010,0.012);
  "nampally"=@(0.010,0.012); "masab-tank"=@(0.010,0.012); "humayun-nagar"=@(0.010,0.012);
  "musheerabad"=@(0.010,0.012); "barkatpura"=@(0.010,0.012); "vidyanagar"=@(0.010,0.012);
  "nallakunta"=@(0.010,0.012); "kavadiguda"=@(0.010,0.012); "lakdikapul"=@(0.010,0.012);
  "koti"=@(0.010,0.012); "parsigutta"=@(0.010,0.012); "chanchalguda"=@(0.010,0.012);
  # NORTH
  "bollaram"=@(0.015,0.018); "suraram"=@(0.012,0.014); "jeedimetla"=@(0.012,0.014);
  "quthbullapur"=@(0.015,0.018); "mallampet"=@(0.015,0.018); "trimulgherry"=@(0.012,0.014);
  "sainikpuri"=@(0.015,0.018); "gajularamaram"=@(0.015,0.018); "dullapally"=@(0.015,0.018);
  "hakimpet"=@(0.015,0.018); "ecil"=@(0.012,0.014); "maredpally"=@(0.010,0.012);
  "neredmet"=@(0.012,0.014); "yapral"=@(0.015,0.018); "azamabad"=@(0.010,0.012);
  "lalaguda"=@(0.010,0.012); "bahadurpally"=@(0.020,0.025); "moosapet"=@(0.010,0.012);
  "moti-nagar"=@(0.010,0.012); "dammaiguda"=@(0.020,0.025);
  # EAST
  "boduppal"=@(0.020,0.025); "kapra"=@(0.020,0.025); "ramanthapur"=@(0.012,0.014);
  "mallapur"=@(0.012,0.014); "kushaiguda"=@(0.010,0.012); "moula-ali"=@(0.012,0.014);
  "musarambagh"=@(0.010,0.012); "nagaram"=@(0.020,0.025); "keesara"=@(0.025,0.030);
  "pocharam"=@(0.020,0.025); "saroornagar"=@(0.015,0.018); "ferozguda"=@(0.010,0.012);
  "lalapet"=@(0.012,0.014); "pedda-amberpet"=@(0.010,0.012); "uppal-kalan"=@(0.015,0.018);
  "tarnaka"=@(0.010,0.012); "habsiguda"=@(0.010,0.012); "amberpet"=@(0.010,0.012);
  # SOUTH
  "malakpet"=@(0.012,0.014); "saidabad"=@(0.012,0.014); "balapur"=@(0.020,0.025);
  "ibrahimpatnam"=@(0.025,0.030); "turkayamjal"=@(0.025,0.030); "maheshwaram"=@(0.025,0.030);
  "kothur"=@(0.025,0.030); "champapet"=@(0.010,0.012); "bandlaguda"=@(0.012,0.014);
  "upparpally"=@(0.012,0.014); "karmanghat"=@(0.012,0.014); "chandrayangutta"=@(0.010,0.012);
  "falaknuma"=@(0.010,0.012); "santosh-nagar"=@(0.010,0.012); "langar-houz"=@(0.010,0.012);
  "mir-alam"=@(0.010,0.012); "bandlaguda-jagir"=@(0.015,0.018);
  # WEST
  "film-nagar"=@(0.010,0.012); "rethibowli"=@(0.010,0.012); "shaikpet"=@(0.010,0.012);
  "puppalaguda"=@(0.015,0.018); "khajaguda"=@(0.012,0.014); "raidurgam"=@(0.012,0.014);
  "gopanpally"=@(0.015,0.018); "nallagandla"=@(0.015,0.018); "serilingampally"=@(0.015,0.018);
  "lingampally"=@(0.015,0.018); "beeramguda"=@(0.020,0.025); "gandipet"=@(0.025,0.030);
  "golconda"=@(0.012,0.014); "yousufguda"=@(0.010,0.012); "madinaguda"=@(0.015,0.018);
  "osmansagar"=@(0.025,0.030); "himayat-sagar"=@(0.025,0.030); "chilukur"=@(0.025,0.030);
  "isnapur"=@(0.020,0.025)
}

function Make-Poly([double]$lat, [double]$lng, [double]$dLat, [double]$dLng) {
  $R = [math]
  $pts = @(
    ($R::Round($lat+$dLat,3).ToString() + ", " + $R::Round($lng,3).ToString()),
    ($R::Round($lat+$dLat*0.7,3).ToString() + ", " + $R::Round($lng+$dLng*0.7,3).ToString()),
    ($R::Round($lat,3).ToString() + ", " + $R::Round($lng+$dLng,3).ToString()),
    ($R::Round($lat-$dLat*0.7,3).ToString() + ", " + $R::Round($lng+$dLng*0.7,3).ToString()),
    ($R::Round($lat-$dLat,3).ToString() + ", " + $R::Round($lng,3).ToString()),
    ($R::Round($lat-$dLat*0.7,3).ToString() + ", " + $R::Round($lng-$dLng*0.7,3).ToString()),
    ($R::Round($lat,3).ToString() + ", " + $R::Round($lng-$dLng,3).ToString()),
    ($R::Round($lat+$dLat*0.7,3).ToString() + ", " + $R::Round($lng-$dLng*0.7,3).ToString())
  )
  return "[[" + ($pts -join "], [") + "]]"
}

$content = Get-Content $file -Raw -Encoding UTF8
$data = $content | ConvertFrom-Json

$fixed = 0
foreach ($entry in $data) {
  $slug = $entry.slug
  if ($deltas.ContainsKey($slug)) {
    $d = $deltas[$slug]
    $lat = [double]$entry.center[0]
    $lng = [double]$entry.center[1]
    $dLat = [double]$d[0]
    $dLng = [double]$d[1]
    # Check if polygon is bad (has [0,0] or empty points)
    $badPoly = $false
    foreach ($pt in $entry.polygon) {
      if ($pt[0] -eq 0 -and $pt[1] -eq 0) { $badPoly = $true; break }
    }
    if (-not $badPoly -and $entry.polygon.Count -eq 8) { continue }

    # Rebuild polygon
    $R = [math]
    $entry.polygon = @(
      @($R::Round($lat+$dLat,3), $R::Round($lng,3)),
      @($R::Round($lat+$dLat*0.7,3), $R::Round($lng+$dLng*0.7,3)),
      @($R::Round($lat,3), $R::Round($lng+$dLng,3)),
      @($R::Round($lat-$dLat*0.7,3), $R::Round($lng+$dLng*0.7,3)),
      @($R::Round($lat-$dLat,3), $R::Round($lng,3)),
      @($R::Round($lat-$dLat*0.7,3), $R::Round($lng-$dLng*0.7,3)),
      @($R::Round($lat,3), $R::Round($lng-$dLng,3)),
      @($R::Round($lat+$dLat*0.7,3), $R::Round($lng-$dLng*0.7,3))
    )
    $fixed++
  }
}

Write-Host "Fixed $fixed polygons"

# Serialize manually to match expected format
$lines = @("[")
foreach ($entry in $data) {
  $centerStr = "[$($entry.center[0]), $($entry.center[1])]"
  $polyPts = $entry.polygon | ForEach-Object { "[$($_[0]), $($_[1])]" }
  $polyStr = "[" + ($polyPts -join ", ") + "]"
  $lines += "  {"
  $lines += "    `"slug`": `"$($entry.slug)`","
  $lines += "    `"name`": `"$($entry.name)`","
  $lines += "    `"center`": $centerStr,"
  $lines += "    `"polygon`": $polyStr"
  $lines += "  },"
}
# Remove trailing comma from last entry
$lastIdx = $lines.Count - 1
$lines[$lastIdx-1] = $lines[$lastIdx-1].TrimEnd(',')
$lines += "]"

$newContent = $lines -join "`n"
Set-Content $file $newContent -Encoding UTF8 -NoNewline
Write-Host "Written $($data.Count) entries to localities.json"
