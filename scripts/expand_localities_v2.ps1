
# Expand Hyderabad localities: 52 -> 144
# Generates correct polygons using [math]::Round directly (no wrapper fn)
$base = "C:\Users\Naveen\OneDrive\Desktop\PlotDNA"

$newLocalities = @(
  @{ slug="ameerpet";         name="Ameerpet";          zone="central"; lat=17.437; lng=78.449; dLat=0.010; dLng=0.012 },
  @{ slug="punjagutta";       name="Punjagutta";         zone="central"; lat=17.428; lng=78.451; dLat=0.010; dLng=0.012 },
  @{ slug="khairatabad";      name="Khairatabad";        zone="central"; lat=17.420; lng=78.456; dLat=0.010; dLng=0.012 },
  @{ slug="himayathnagar";    name="Himayathnagar";      zone="central"; lat=17.400; lng=78.476; dLat=0.010; dLng=0.012 },
  @{ slug="narayanguda";      name="Narayanguda";        zone="central"; lat=17.403; lng=78.488; dLat=0.010; dLng=0.012 },
  @{ slug="abids";            name="Abids";              zone="central"; lat=17.390; lng=78.480; dLat=0.010; dLng=0.012 },
  @{ slug="nampally";         name="Nampally";           zone="central"; lat=17.382; lng=78.470; dLat=0.010; dLng=0.012 },
  @{ slug="masab-tank";       name="Masab Tank";         zone="central"; lat=17.413; lng=78.459; dLat=0.010; dLng=0.012 },
  @{ slug="humayun-nagar";    name="Humayun Nagar";      zone="central"; lat=17.408; lng=78.443; dLat=0.010; dLng=0.012 },
  @{ slug="musheerabad";      name="Musheerabad";        zone="central"; lat=17.413; lng=78.490; dLat=0.010; dLng=0.012 },
  @{ slug="barkatpura";       name="Barkatpura";         zone="central"; lat=17.407; lng=78.494; dLat=0.010; dLng=0.012 },
  @{ slug="vidyanagar";       name="Vidyanagar";         zone="central"; lat=17.430; lng=78.498; dLat=0.010; dLng=0.012 },
  @{ slug="nallakunta";       name="Nallakunta";         zone="central"; lat=17.430; lng=78.494; dLat=0.010; dLng=0.012 },
  @{ slug="kavadiguda";       name="Kavadiguda";         zone="central"; lat=17.445; lng=78.480; dLat=0.010; dLng=0.012 },
  @{ slug="lakdikapul";       name="Lakdikapul";         zone="central"; lat=17.405; lng=78.468; dLat=0.010; dLng=0.012 },
  @{ slug="koti";             name="Koti";               zone="central"; lat=17.383; lng=78.480; dLat=0.010; dLng=0.012 },
  @{ slug="parsigutta";       name="Parsigutta";         zone="central"; lat=17.420; lng=78.460; dLat=0.010; dLng=0.012 },
  @{ slug="chanchalguda";     name="Chanchalguda";       zone="central"; lat=17.381; lng=78.479; dLat=0.010; dLng=0.012 },
  @{ slug="bollaram";         name="Bollaram";           zone="north"; lat=17.523; lng=78.428; dLat=0.015; dLng=0.018 },
  @{ slug="suraram";          name="Suraram";            zone="north"; lat=17.530; lng=78.440; dLat=0.012; dLng=0.014 },
  @{ slug="jeedimetla";       name="Jeedimetla";         zone="north"; lat=17.513; lng=78.453; dLat=0.012; dLng=0.014 },
  @{ slug="quthbullapur";     name="Quthbullapur";       zone="north"; lat=17.537; lng=78.463; dLat=0.015; dLng=0.018 },
  @{ slug="mallampet";        name="Mallampet";          zone="north"; lat=17.568; lng=78.388; dLat=0.015; dLng=0.018 },
  @{ slug="trimulgherry";     name="Trimulgherry";       zone="north"; lat=17.470; lng=78.548; dLat=0.012; dLng=0.014 },
  @{ slug="sainikpuri";       name="Sainikpuri";         zone="north"; lat=17.488; lng=78.565; dLat=0.015; dLng=0.018 },
  @{ slug="gajularamaram";    name="Gajularamaram";      zone="north"; lat=17.552; lng=78.468; dLat=0.015; dLng=0.018 },
  @{ slug="dullapally";       name="Dullapally";         zone="north"; lat=17.574; lng=78.445; dLat=0.015; dLng=0.018 },
  @{ slug="hakimpet";         name="Hakimpet";           zone="north"; lat=17.512; lng=78.543; dLat=0.015; dLng=0.018 },
  @{ slug="ecil";             name="ECIL";               zone="north"; lat=17.462; lng=78.554; dLat=0.012; dLng=0.014 },
  @{ slug="maredpally";       name="Maredpally";         zone="north"; lat=17.453; lng=78.494; dLat=0.010; dLng=0.012 },
  @{ slug="neredmet";         name="Neredmet";           zone="north"; lat=17.455; lng=78.530; dLat=0.012; dLng=0.014 },
  @{ slug="yapral";           name="Yapral";             zone="north"; lat=17.475; lng=78.548; dLat=0.015; dLng=0.018 },
  @{ slug="azamabad";         name="Azamabad";           zone="north"; lat=17.445; lng=78.510; dLat=0.010; dLng=0.012 },
  @{ slug="lalaguda";         name="Lalaguda";           zone="north"; lat=17.468; lng=78.518; dLat=0.010; dLng=0.012 },
  @{ slug="bahadurpally";     name="Bahadurpally";       zone="north"; lat=17.610; lng=78.430; dLat=0.020; dLng=0.025 },
  @{ slug="moosapet";         name="Moosapet";           zone="north"; lat=17.470; lng=78.437; dLat=0.010; dLng=0.012 },
  @{ slug="moti-nagar";       name="Moti Nagar";         zone="north"; lat=17.455; lng=78.445; dLat=0.010; dLng=0.012 },
  @{ slug="dammaiguda";       name="Dammaiguda";         zone="north"; lat=17.545; lng=78.578; dLat=0.020; dLng=0.025 },
  @{ slug="boduppal";         name="Boduppal";           zone="east"; lat=17.407; lng=78.577; dLat=0.020; dLng=0.025 },
  @{ slug="kapra";            name="Kapra";              zone="east"; lat=17.473; lng=78.566; dLat=0.020; dLng=0.025 },
  @{ slug="ramanthapur";      name="Ramanthapur";        zone="east"; lat=17.385; lng=78.560; dLat=0.012; dLng=0.014 },
  @{ slug="mallapur";         name="Mallapur";           zone="east"; lat=17.403; lng=78.548; dLat=0.012; dLng=0.014 },
  @{ slug="kushaiguda";       name="Kushaiguda";         zone="east"; lat=17.417; lng=78.543; dLat=0.010; dLng=0.012 },
  @{ slug="moula-ali";        name="Moula Ali";          zone="east"; lat=17.433; lng=78.548; dLat=0.012; dLng=0.014 },
  @{ slug="musarambagh";      name="Musarambagh";        zone="east"; lat=17.377; lng=78.508; dLat=0.010; dLng=0.012 },
  @{ slug="nagaram";          name="Nagaram";            zone="east"; lat=17.405; lng=78.620; dLat=0.020; dLng=0.025 },
  @{ slug="keesara";          name="Keesara";            zone="east"; lat=17.527; lng=78.618; dLat=0.025; dLng=0.030 },
  @{ slug="pocharam";         name="Pocharam";           zone="east"; lat=17.502; lng=78.600; dLat=0.020; dLng=0.025 },
  @{ slug="saroornagar";      name="Saroornagar";        zone="east"; lat=17.328; lng=78.540; dLat=0.015; dLng=0.018 },
  @{ slug="ferozguda";        name="Ferozguda";          zone="east"; lat=17.458; lng=78.490; dLat=0.010; dLng=0.012 },
  @{ slug="lalapet";          name="Lalapet";            zone="east"; lat=17.378; lng=78.555; dLat=0.012; dLng=0.014 },
  @{ slug="pedda-amberpet";   name="Pedda Amberpet";     zone="east"; lat=17.413; lng=78.527; dLat=0.010; dLng=0.012 },
  @{ slug="uppal-kalan";      name="Uppal Kalan";        zone="east"; lat=17.397; lng=78.603; dLat=0.015; dLng=0.018 },
  @{ slug="tarnaka";          name="Tarnaka";            zone="east"; lat=17.422; lng=78.540; dLat=0.010; dLng=0.012 },
  @{ slug="habsiguda";        name="Habsiguda";          zone="east"; lat=17.413; lng=78.528; dLat=0.010; dLng=0.012 },
  @{ slug="amberpet";         name="Amberpet";           zone="east"; lat=17.400; lng=78.510; dLat=0.010; dLng=0.012 },
  @{ slug="malakpet";         name="Malakpet";           zone="south"; lat=17.365; lng=78.490; dLat=0.012; dLng=0.014 },
  @{ slug="saidabad";         name="Saidabad";           zone="south"; lat=17.348; lng=78.500; dLat=0.012; dLng=0.014 },
  @{ slug="balapur";          name="Balapur";            zone="south"; lat=17.288; lng=78.555; dLat=0.020; dLng=0.025 },
  @{ slug="ibrahimpatnam";    name="Ibrahimpatnam";      zone="south"; lat=17.233; lng=78.620; dLat=0.025; dLng=0.030 },
  @{ slug="turkayamjal";      name="Turkayamjal";        zone="south"; lat=17.300; lng=78.600; dLat=0.025; dLng=0.030 },
  @{ slug="maheshwaram";      name="Maheshwaram";        zone="south"; lat=17.235; lng=78.540; dLat=0.025; dLng=0.030 },
  @{ slug="kothur";           name="Kothur";             zone="south"; lat=17.167; lng=78.487; dLat=0.025; dLng=0.030 },
  @{ slug="champapet";        name="Champapet";          zone="south"; lat=17.355; lng=78.490; dLat=0.010; dLng=0.012 },
  @{ slug="bandlaguda";       name="Bandlaguda";         zone="south"; lat=17.327; lng=78.433; dLat=0.012; dLng=0.014 },
  @{ slug="upparpally";       name="Upparpally";         zone="south"; lat=17.340; lng=78.430; dLat=0.012; dLng=0.014 },
  @{ slug="karmanghat";       name="Karmanghat";         zone="south"; lat=17.338; lng=78.510; dLat=0.012; dLng=0.014 },
  @{ slug="chandrayangutta";  name="Chandrayangutta";    zone="south"; lat=17.346; lng=78.477; dLat=0.010; dLng=0.012 },
  @{ slug="falaknuma";        name="Falaknuma";          zone="south"; lat=17.327; lng=78.469; dLat=0.010; dLng=0.012 },
  @{ slug="santosh-nagar";    name="Santosh Nagar";      zone="south"; lat=17.352; lng=78.468; dLat=0.010; dLng=0.012 },
  @{ slug="langar-houz";      name="Langar Houz";        zone="south"; lat=17.370; lng=78.463; dLat=0.010; dLng=0.012 },
  @{ slug="mir-alam";         name="Mir Alam";           zone="south"; lat=17.360; lng=78.462; dLat=0.010; dLng=0.012 },
  @{ slug="bandlaguda-jagir"; name="Bandlaguda Jagir";   zone="south"; lat=17.304; lng=78.527; dLat=0.015; dLng=0.018 },
  @{ slug="film-nagar";       name="Film Nagar";         zone="west"; lat=17.416; lng=78.416; dLat=0.010; dLng=0.012 },
  @{ slug="rethibowli";       name="Rethibowli";         zone="west"; lat=17.393; lng=78.418; dLat=0.010; dLng=0.012 },
  @{ slug="shaikpet";         name="Shaikpet";           zone="west"; lat=17.402; lng=78.427; dLat=0.010; dLng=0.012 },
  @{ slug="puppalaguda";      name="Puppalaguda";        zone="west"; lat=17.374; lng=78.370; dLat=0.015; dLng=0.018 },
  @{ slug="khajaguda";        name="Khajaguda";          zone="west"; lat=17.413; lng=78.388; dLat=0.012; dLng=0.014 },
  @{ slug="raidurgam";        name="Raidurgam";          zone="west"; lat=17.421; lng=78.390; dLat=0.012; dLng=0.014 },
  @{ slug="gopanpally";       name="Gopanpally";         zone="west"; lat=17.432; lng=78.352; dLat=0.015; dLng=0.018 },
  @{ slug="nallagandla";      name="Nallagandla";        zone="west"; lat=17.423; lng=78.338; dLat=0.015; dLng=0.018 },
  @{ slug="serilingampally";  name="Serilingampally";    zone="west"; lat=17.490; lng=78.312; dLat=0.015; dLng=0.018 },
  @{ slug="lingampally";      name="Lingampally";        zone="west"; lat=17.488; lng=78.303; dLat=0.015; dLng=0.018 },
  @{ slug="beeramguda";       name="Beeramguda";         zone="west"; lat=17.504; lng=78.283; dLat=0.020; dLng=0.025 },
  @{ slug="gandipet";         name="Gandipet";           zone="west"; lat=17.343; lng=78.296; dLat=0.025; dLng=0.030 },
  @{ slug="golconda";         name="Golconda";           zone="west"; lat=17.382; lng=78.397; dLat=0.012; dLng=0.014 },
  @{ slug="yousufguda";       name="Yousufguda";         zone="west"; lat=17.432; lng=78.427; dLat=0.010; dLng=0.012 },
  @{ slug="madinaguda";       name="Madinaguda";         zone="west"; lat=17.488; lng=78.332; dLat=0.015; dLng=0.018 },
  @{ slug="osmansagar";       name="Osmansagar";         zone="west"; lat=17.390; lng=78.218; dLat=0.025; dLng=0.030 },
  @{ slug="himayat-sagar";    name="Himayat Sagar";      zone="west"; lat=17.330; lng=78.290; dLat=0.025; dLng=0.030 },
  @{ slug="chilukur";         name="Chilukur";           zone="west"; lat=17.310; lng=78.310; dLat=0.025; dLng=0.030 },
  @{ slug="isnapur";          name="Isnapur";            zone="west"; lat=17.524; lng=78.268; dLat=0.020; dLng=0.025 }
)

# Build polygon for a locality (pure math, no wrapper functions)
# Returns JSON array string
function Build-PolyJson([double]$lat, [double]$lng, [double]$dLat, [double]$dLng) {
  $M = [math]
  $p1lat = $M::Round($lat + $dLat, 3);       $p1lng = $M::Round($lng, 3)
  $p2lat = $M::Round($lat + $dLat*0.7, 3);   $p2lng = $M::Round($lng + $dLng*0.7, 3)
  $p3lat = $M::Round($lat, 3);                $p3lng = $M::Round($lng + $dLng, 3)
  $p4lat = $M::Round($lat - $dLat*0.7, 3);   $p4lng = $M::Round($lng + $dLng*0.7, 3)
  $p5lat = $M::Round($lat - $dLat, 3);        $p5lng = $M::Round($lng, 3)
  $p6lat = $M::Round($lat - $dLat*0.7, 3);   $p6lng = $M::Round($lng - $dLng*0.7, 3)
  $p7lat = $M::Round($lat, 3);                $p7lng = $M::Round($lng - $dLng, 3)
  $p8lat = $M::Round($lat + $dLat*0.7, 3);   $p8lng = $M::Round($lng - $dLng*0.7, 3)
  return "[[$p1lat, $p1lng], [$p2lat, $p2lng], [$p3lat, $p3lng], [$p4lat, $p4lng], [$p5lat, $p5lng], [$p6lat, $p6lng], [$p7lat, $p7lng], [$p8lat, $p8lng]]"
}

# Build new locality JSON entries
$newLocEntries = foreach ($loc in $newLocalities) {
  $lat = [double]$loc.lat; $lng = [double]$loc.lng
  $dLat = [double]$loc.dLat; $dLng = [double]$loc.dLng
  $polyJson = Build-PolyJson $lat $lng $dLat $dLng
  "  {`n    `"slug`": `"$($loc.slug)`",`n    `"name`": `"$($loc.name)`",`n    `"center`": [$($lat), $($lng)],`n    `"polygon`": $polyJson`n  }"
}

# Verify polygon looks valid
$sample = Build-PolyJson 17.437 78.449 0.010 0.012
Write-Host "Sample polygon (ameerpet): $sample"

# --- Update localities.json ---
$locFile = "$base\data\cities\hyderabad\localities.json"
$content = Get-Content $locFile -Raw -Encoding UTF8
$trimmed = $content.TrimEnd()
if ($trimmed[-1] -eq ']') { $trimmed = $trimmed.Substring(0, $trimmed.Length-1).TrimEnd() }
$newContent = $trimmed + ",`n" + ($newLocEntries -join ",`n") + "`n]"
Set-Content $locFile $newContent -Encoding UTF8 -NoNewline
$slugCount = ([regex]::Matches($newContent, '"slug"')).Count
Write-Host "localities.json: $slugCount total entries"

# --- Update clusters.json ---
$clustersFile = "$base\data\cities\hyderabad\clusters.json"
$clustersJson = Get-Content $clustersFile -Raw -Encoding UTF8

# Reset to original 52 clusters then add new ones
$originalClusters = @(
  @{ id="hyderabad:central"; label="Hyderabad Central Zone"; zone="Central";
     slugs=@("lb-nagar","banjara-hills","somajiguda","begumpet","secunderabad","bowenpally","balanagar") },
  @{ id="hyderabad:north"; label="Hyderabad North Zone"; zone="North";
     slugs=@("medchal","kompally","kukatpally","bachupally","nizampet","dundigal","alwal") },
  @{ id="hyderabad:east"; label="Hyderabad East Zone"; zone="East";
     slugs=@("bibinagar","ghatkesar","peerzadiguda","uppal","dilsukhnagar","kothapet","vanasthalipuram","nacharam","malkajgiri","hayathnagar") },
  @{ id="hyderabad:south"; label="Hyderabad South Zone"; zone="South";
     slugs=@("adibatla","tukkuguda","yacharam","shamshabad","shadnagar","attapur") },
  @{ id="hyderabad:west"; label="Hyderabad West Zone"; zone="West";
     slugs=@("kokapet","shankarpally","narsingi","ameenpur","mokila","tellapur","financial-district","patancheru","rajendra-nagar","gachibowli","madhapur","kondapur","miyapur","jubilee-hills","manikonda","hitec-city","chandanagar","hafeezpet","nanakramguda","tolichowki","mehdipatnam","jntu-kphb") }
)

# Add new slugs by zone
foreach ($cluster in $originalClusters) {
  $zone = $cluster.zone.ToLower()
  $newSlugs = $newLocalities | Where-Object { $_.zone -eq $zone } | ForEach-Object { $_.slug }
  $cluster.slugs = $cluster.slugs + $newSlugs
}

# Write clusters.json
$clusterLines = @("[")
foreach ($c in $originalClusters) {
  $slugsStr = ($c.slugs | ForEach-Object { "`"$_`"" }) -join ", "
  $clusterLines += "  {"
  $clusterLines += "    `"id`": `"$($c.id)`","
  $clusterLines += "    `"label`": `"$($c.label)`","
  $clusterLines += "    `"zone`": `"$($c.zone)`","
  $clusterLines += "    `"localitySlugs`": [$slugsStr]"
  $clusterLines += "  },"
}
$lastCI = $clusterLines.Count - 1
$clusterLines[$lastCI] = $clusterLines[$lastCI].TrimEnd(',')
$clusterLines += "]"
Set-Content $clustersFile ($clusterLines -join "`n") -Encoding UTF8 -NoNewline
Write-Host "clusters.json updated"

# --- Update aliases.json ---
$aliasFile = "$base\data\cities\hyderabad\aliases.json"
$aliasContent = Get-Content $aliasFile -Raw -Encoding UTF8

# Restore original aliases (remove any previously added ones, re-read from temp clone)
$origAliasContent = Get-Content "C:\plotdna-work\PLOTDNA-AI\data\cities\hyderabad\aliases.json" -Raw -Encoding UTF8
$trimmedAlias = $origAliasContent.TrimEnd()
if ($trimmedAlias[-1] -eq '}') { $trimmedAlias = $trimmedAlias.Substring(0, $trimmedAlias.Length-1).TrimEnd() }

$aliasEntries = foreach ($loc in $newLocalities) {
  $slug = $loc.slug
  $noHyphen = $slug -replace '-', ' '
  $name = $loc.name.ToLower()
  $aliases = @("`"$noHyphen`"")
  if ($name -ne $noHyphen) { $aliases += "`"$name`"" }
  "  `"$slug`": [" + ($aliases -join ", ") + "]"
}

$newAliasContent = $trimmedAlias + ",`n" + ($aliasEntries -join ",`n") + "`n}"
Set-Content $aliasFile $newAliasContent -Encoding UTF8 -NoNewline
Write-Host "aliases.json updated"

Write-Host "`nAll data files updated successfully."
Write-Host "Next: run gen_micromarkets.ps1 to update hyderabad.ts"
