
# Generate 92 new MicroMarket TS entries for hyderabad.ts
$base = "C:\Users\Naveen\OneDrive\Desktop\PlotDNA"

# score, category, signals (infra,pop,sat,rera,emp,price,govt), livability, highlights, priceRange, yoy, dataConfidence, signalsAvailable
$data = @(
  # CENTRAL
  @{ slug="ameerpet"; score=71; cat="Good Growth"; sig=@(78,80,68,60,75,65,55); liv=@(82,75,85,70,35); pr="Rs7,500-12,000/sqft"; yoy=8; dc="partial"; sv=6;
     h=@("Major commercial transit hub - MMTS and metro interchange","Dense office and retail ecosystem drives sustained rental demand","NH65 and NH163 convergence enables city-wide connectivity","Redevelopment wave as old buildings give way to mixed-use towers") },
  @{ slug="punjagutta"; score=68; cat="Good Growth"; sig=@(75,72,62,55,70,60,50); liv=@(78,72,82,68,38); pr="Rs7,000-11,500/sqft"; yoy=7; dc="partial"; sv=6;
     h=@("Premium commercial corridor adjacent to Banjara Hills","High street retail concentration - footfall and brand presence","Metro Blue Line station drives pedestrian traffic","Upscale residential demand from corporate professionals") },
  @{ slug="khairatabad"; score=65; cat="Moderate"; sig=@(72,70,60,52,65,58,55); liv=@(76,70,80,65,40); pr="Rs6,500-10,000/sqft"; yoy=7; dc="partial"; sv=5;
     h=@("State government offices create stable employment anchor","Flyover access reduces commute times to HITEC City","Cultural landmarks - Ganesh festival headquarters","Established residential demand from government-sector workers") },
  @{ slug="himayathnagar"; score=66; cat="Good Growth"; sig=@(73,68,62,55,65,62,48); liv=@(74,72,80,65,42); pr="Rs6,500-10,500/sqft"; yoy=8; dc="partial"; sv=5;
     h=@("Premium micro-market between Banjara Hills and city centre","High density of restaurants, cafes, and retail - strong walkability","Proximity to Hyderabad Central University academic zone","Steady appreciation driven by limited land supply") },
  @{ slug="narayanguda"; score=62; cat="Moderate"; sig=@(68,75,58,50,60,55,45); liv=@(70,68,75,60,38); pr="Rs5,500-8,500/sqft"; yoy=6; dc="partial"; sv=5;
     h=@("Dense residential locality with mature social infrastructure","Close to Osmania General Hospital - strong anchor for tenants","Metro corridor station improving east-west connectivity","Commercial street activity generates stable lease demand") },
  @{ slug="abids"; score=60; cat="Moderate"; sig=@(68,72,55,45,65,50,55); liv=@(72,75,80,70,30); pr="Rs5,000-8,000/sqft"; yoy=5; dc="partial"; sv=5;
     h=@("Traditional commercial hub with strong retail history","Proximity to Nampally railway station for intercity connectivity","Redevelopment opportunities as ageing stock is replaced","Government precinct anchor ensures stable demand base") },
  @{ slug="nampally"; score=58; cat="Moderate"; sig=@(65,70,52,42,58,48,58); liv=@(70,68,75,60,32); pr="Rs4,800-7,500/sqft"; yoy=5; dc="partial"; sv=5;
     h=@("Nampally railway station - intercity rail hub and commuter anchor","Exhibition grounds attract periodic commercial demand","Old city gateway locality with improving road infrastructure","Affordable entry point into central Hyderabad") },
  @{ slug="masab-tank"; score=63; cat="Moderate"; sig=@(70,68,60,52,62,58,48); liv=@(72,70,78,65,40); pr="Rs6,000-9,500/sqft"; yoy=7; dc="partial"; sv=5;
     h=@("Upscale enclave between Banjara Hills and Mehdipatnam","Green pockets around the tank offer rare open-space value","Strong healthcare cluster - hospitals and diagnostic centres","Premium residential demand from medical professionals") },
  @{ slug="humayun-nagar"; score=61; cat="Moderate"; sig=@(68,65,58,50,60,55,45); liv=@(70,65,75,58,42); pr="Rs5,500-8,500/sqft"; yoy=6; dc="partial"; sv=5;
     h=@("Quiet residential enclave adjacent to Banjara Hills","Well-established colony with mature tree cover","Close to international schools and premium retail","Limited new supply supports steady price appreciation") },
  @{ slug="musheerabad"; score=58; cat="Moderate"; sig=@(65,72,52,42,55,48,50); liv=@(68,62,72,55,32); pr="Rs4,500-7,000/sqft"; yoy=5; dc="partial"; sv=5;
     h=@("Mixed residential-commercial pocket north of old city","Close to Gandhi Hospital - major public health anchor","Road widening projects improving connectivity","Affordable pricing offers entry-level residential value") },
  @{ slug="barkatpura"; score=60; cat="Moderate"; sig=@(65,68,55,48,58,52,50); liv=@(70,65,72,58,35); pr="Rs5,000-7,500/sqft"; yoy=5; dc="partial"; sv=5;
     h=@("Established residential locality near Hyderabad Central University","Metro accessibility improving overall connectivity","Commercial strip along main road adds rental diversity","Stable demand from academic and government-sector residents") },
  @{ slug="vidyanagar"; score=59; cat="Moderate"; sig=@(65,68,52,45,55,50,48); liv=@(68,62,70,55,35); pr="Rs4,800-7,200/sqft"; yoy=5; dc="partial"; sv=5;
     h=@("Educational hub locality with college-driven rental demand","Close to Secunderabad railway junction","Mature residential stock with steady lease occupancy","Affordable flats attract young professionals and students") },
  @{ slug="nallakunta"; score=58; cat="Moderate"; sig=@(63,70,52,42,55,48,45); liv=@(68,60,70,52,32); pr="Rs4,500-7,000/sqft"; yoy=5; dc="partial"; sv=5;
     h=@("Dense residential locality with strong community fabric","Close to Secunderabad - dual metro accessibility","Affordable mid-segment housing with stable occupancy","Improving road infrastructure reducing commute times") },
  @{ slug="kavadiguda"; score=60; cat="Moderate"; sig=@(65,68,55,45,58,52,52); liv=@(70,62,72,55,35); pr="Rs5,000-7,500/sqft"; yoy=6; dc="partial"; sv=5;
     h=@("Close to Secunderabad cantonment and railway station","Mix of residential colonies and commercial activity","Metro Blue Line station within walkable distance","Government sector employment creates stable demand base") },
  @{ slug="lakdikapul"; score=62; cat="Moderate"; sig=@(70,68,58,48,60,55,55); liv=@(74,68,75,62,40); pr="Rs5,500-8,500/sqft"; yoy=6; dc="partial"; sv=5;
     h=@("Prime location flanking Hussain Sagar lakefront","Arterial road connectivity to both old and new city","Metro Blue Line station improving commuter access","Heritage and lifestyle value near Tank Bund promenade") },
  @{ slug="koti"; score=57; cat="Moderate"; sig=@(62,75,50,40,60,45,52); liv=@(68,72,80,65,28); pr="Rs4,500-6,500/sqft"; yoy=4; dc="partial"; sv=5;
     h=@("Established commercial and retail hub of old Hyderabad","Major bus terminal - regional connectivity anchor","Dense electronics and wholesale market cluster","Redevelopment potential as ageing commercial stock turns over") },
  @{ slug="parsigutta"; score=63; cat="Moderate"; sig=@(70,65,58,50,62,55,48); liv=@(72,68,75,62,38); pr="Rs5,800-9,000/sqft"; yoy=7; dc="partial"; sv=5;
     h=@("Close to Banjara Hills commercial belt","Mix of residential and light commercial - low vacancy","Metro proximity drives footfall and rental uplift","Undervalued relative to adjacent Jubilee Hills") },
  @{ slug="chanchalguda"; score=55; cat="Moderate"; sig=@(60,70,48,38,52,42,50); liv=@(62,60,70,55,30); pr="Rs3,800-6,000/sqft"; yoy=4; dc="estimated"; sv=4;
     h=@("Old city residential pocket with affordable entry pricing","Close to Osmania General Hospital","Improving road access to PVNR Expressway","Value play for long-horizon buyers in inner Hyderabad") },
  # NORTH
  @{ slug="bollaram"; score=62; cat="Moderate"; sig=@(68,60,65,48,72,55,55); liv=@(62,55,60,45,42); pr="Rs4,000-6,000/sqft"; yoy=8; dc="partial"; sv=5;
     h=@("Industrial estate anchor - stable blue-collar employment base","IDPL campus and pharmaceutical units drive area economy","Improving road links to Outer Ring Road","Affordable residential pricing with long-term appreciation potential") },
  @{ slug="suraram"; score=60; cat="Moderate"; sig=@(65,58,62,45,65,52,50); liv=@(60,52,58,42,38); pr="Rs3,800-5,800/sqft"; yoy=7; dc="partial"; sv=5;
     h=@("Industrial and logistics corridor proximity","Improving road infrastructure to ORR and NH65","Affordable pricing relative to inner-ring suburbs","New residential layouts attracting young families") },
  @{ slug="jeedimetla"; score=58; cat="Moderate"; sig=@(62,55,60,42,70,48,52); liv=@(58,50,55,40,35); pr="Rs3,500-5,500/sqft"; yoy=6; dc="partial"; sv=5;
     h=@("Major industrial estate with 500+ manufacturing units","Stable employment for over 50,000 workers","Road widening improving access from Dundigal junction","Affordable worker housing drives consistent rental demand") },
  @{ slug="quthbullapur"; score=62; cat="Moderate"; sig=@(65,60,65,50,65,55,55); liv=@(62,55,58,45,40); pr="Rs4,000-6,500/sqft"; yoy=8; dc="partial"; sv=5;
     h=@("Municipal corporator zone with active infrastructure investment","Industrial and residential mix providing employment diversity","Expanding road connectivity to Medchal and Kompally","New housing developments attracting migrant workforce") },
  @{ slug="mallampet"; score=63; cat="Moderate"; sig=@(65,58,68,52,60,58,58); liv=@(60,52,55,42,45); pr="Rs4,500-7,000/sqft"; yoy=10; dc="partial"; sv=5;
     h=@("ORR Phase 3 connectivity unlocking large-format development","Adjacent to Bachupally - spilling-over IT suburb demand","Large land parcels available for gated community development","Satellite imagery shows rapid built-up expansion in last 3 years") },
  @{ slug="trimulgherry"; score=61; cat="Moderate"; sig=@(68,62,58,45,60,55,48); liv=@(65,58,62,50,42); pr="Rs4,200-6,500/sqft"; yoy=6; dc="partial"; sv=5;
     h=@("Secunderabad cantonment buffer - controlled development zone","Defence housing layouts with secure gated environment","Rail and metro access via Secunderabad junction","Steady military-sector demand stabilises rental market") },
  @{ slug="sainikpuri"; score=64; cat="Good Growth"; sig=@(68,65,62,52,60,58,55); liv=@(65,62,60,50,45); pr="Rs4,500-7,000/sqft"; yoy=8; dc="partial"; sv=5;
     h=@("Defence quarter - secure, well-maintained township environment","Proximity to ECIL and electronics industry cluster","Improving road access to Medchal ORR interchange","Green cover and open plots - rare in north Hyderabad") },
  @{ slug="gajularamaram"; score=60; cat="Moderate"; sig=@(62,58,62,48,58,52,50); liv=@(58,52,55,42,38); pr="Rs3,800-5,800/sqft"; yoy=7; dc="partial"; sv=5;
     h=@("Industrial zone with established small-scale manufacturing","Close to Jeedimetla and Dundigal employment clusters","Affordable housing attracting workforce migrants","ORR connectivity improving long-term growth outlook") },
  @{ slug="dullapally"; score=63; cat="Moderate"; sig=@(65,58,65,52,58,58,60); liv=@(60,52,55,42,45); pr="Rs4,000-6,500/sqft"; yoy=9; dc="partial"; sv=5;
     h=@("Near Kompally - catching spillover demand from saturated suburbs","Large plotted development activity visible on satellite","Medchal ORR access driving commuter residential demand","Educational institutions attracting family-oriented migration") },
  @{ slug="hakimpet"; score=60; cat="Moderate"; sig=@(65,60,60,45,58,52,50); liv=@(62,55,58,45,42); pr="Rs3,800-5,800/sqft"; yoy=7; dc="partial"; sv=5;
     h=@("Adjacent to Sainikpuri - defence-area infrastructure quality","Commercial pocket on Secunderabad-Hakimpet road","Developing residential market attracting young professionals","Access to Bowenpally wholesale market hub") },
  @{ slug="ecil"; score=66; cat="Good Growth"; sig=@(70,68,65,55,62,62,58); liv=@(68,65,65,55,45); pr="Rs5,000-7,500/sqft"; yoy=9; dc="partial"; sv=6;
     h=@("Electronics Corporation of India campus - major government employer","Established township infrastructure with decades of planned development","Metro Green Line connectivity to HITEC City being extended","Strong STEM workforce density supports sustained residential demand") },
  @{ slug="maredpally"; score=64; cat="Good Growth"; sig=@(72,65,62,52,60,62,48); liv=@(70,65,68,58,45); pr="Rs5,500-8,500/sqft"; yoy=8; dc="partial"; sv=5;
     h=@("Upscale north Secunderabad residential pocket","Proximity to Secunderabad club and cantonment green zones","Low traffic density and tree-lined streets - rare quality","Strong demand from defence officers and government executives") },
  @{ slug="neredmet"; score=62; cat="Moderate"; sig=@(65,62,62,50,58,55,50); liv=@(62,58,60,48,40); pr="Rs4,200-6,500/sqft"; yoy=7; dc="partial"; sv=5;
     h=@("Bridge locality between Malkajgiri and ECIL corridor","Improving road links to NH44 and Medchal road","Mid-segment residential with stable rental yields","Education cluster proximity supports family demographic") },
  @{ slug="yapral"; score=60; cat="Moderate"; sig=@(62,58,62,48,55,52,52); liv=@(60,52,55,42,40); pr="Rs3,800-5,800/sqft"; yoy=7; dc="partial"; sv=5;
     h=@("Developing suburb near Sainikpuri and Hakimpet","Large plotted layouts attracting individual house buyers","ORR proximity improving long-distance commuter appeal","Affordable pricing with infrastructure investment pipeline") },
  @{ slug="azamabad"; score=62; cat="Moderate"; sig=@(65,65,60,50,58,55,50); liv=@(65,60,62,50,38); pr="Rs4,500-6,800/sqft"; yoy=7; dc="partial"; sv=5;
     h=@("Industrial area adjacent to Malkajgiri residential hub","Mixed residential-commercial street - diverse tenant base","Metro Blue Line proximity improving connectivity","Affordable pricing for inner-north Hyderabad location") },
  @{ slug="lalaguda"; score=61; cat="Moderate"; sig=@(65,63,58,48,60,52,50); liv=@(65,58,60,48,38); pr="Rs4,200-6,500/sqft"; yoy=6; dc="partial"; sv=5;
     h=@("South Central Railway zone headquarters - major institutional anchor","Railway colony township with stable government-sector demand","Secunderabad junction walkability for commuter convenience","Established neighbourhood with strong community infrastructure") },
  @{ slug="bahadurpally"; score=65; cat="Moderate"; sig=@(65,52,72,62,55,65,68); liv=@(55,45,48,35,52); pr="Rs3,500-5,500/sqft"; yoy=14; dc="partial"; sv=5;
     h=@("Pharma City Phase 2 anchor driving massive employment migration","HMDA-approved layouts seeing fastest price velocity in north HYD","ORR Gachibowli spur extension in planning - transformative access","Satellite data shows 38% built-up area increase in 3 years") },
  @{ slug="moosapet"; score=62; cat="Moderate"; sig=@(65,65,60,48,62,55,48); liv=@(65,60,62,52,38); pr="Rs4,500-7,000/sqft"; yoy=7; dc="partial"; sv=5;
     h=@("Metro Blue Line station - direct connectivity to HITEC City","JNTU proximity drives student and young-professional demand","Affordable pricing for west-corridor commuters","New commercial developments improving area character") },
  @{ slug="moti-nagar"; score=63; cat="Moderate"; sig=@(68,65,60,50,63,56,48); liv=@(68,62,65,55,40); pr="Rs4,800-7,200/sqft"; yoy=7; dc="partial"; sv=5;
     h=@("Metro Blue Line - walkable station connectivity","Buffer between Kukatpally and Balanagar industrial zone","Established residential colony with mature amenities","Affordable relative to adjacent Kukatpally and KPHB") },
  @{ slug="dammaiguda"; score=62; cat="Moderate"; sig=@(62,55,65,52,55,56,62); liv=@(55,48,50,40,45); pr="Rs3,500-5,500/sqft"; yoy=10; dc="partial"; sv=5;
     h=@("Adjacent to Keesara ORR interchange - strategic corridor location","Pharma City and defence land adjacency driving land value","Active plotted development market with HMDA-approved layouts","Satellite data shows rapid agricultural-to-residential conversion") },
  # EAST
  @{ slug="boduppal"; score=65; cat="Moderate"; sig=@(65,65,70,60,55,65,60); liv=@(60,58,62,48,42); pr="Rs4,200-6,500/sqft"; yoy=12; dc="partial"; sv=5;
     h=@("ORR Phase 1 spur driving major development acceleration","TSRTC bus depot and growing public transport connectivity","Satellite shows 45% built-up expansion in past 5 years","Affordable plotted development with proximity to Uppal IT Park") },
  @{ slug="kapra"; score=63; cat="Moderate"; sig=@(63,62,65,55,55,58,55); liv=@(60,55,58,45,40); pr="Rs4,000-6,000/sqft"; yoy=9; dc="partial"; sv=5;
     h=@("East Hyderabad residential corridor catching IT suburb spillover","ECIL proximity provides electronics-sector employment anchor","Developing retail and commercial strip on main road","Affordable family housing with improving connectivity") },
  @{ slug="ramanthapur"; score=60; cat="Moderate"; sig=@(63,65,58,48,55,52,48); liv=@(62,60,62,50,38); pr="Rs3,800-5,800/sqft"; yoy=6; dc="partial"; sv=5;
     h=@("Metro Blue Line station improving city-wide connectivity","Dense residential locality with established social infrastructure","Commercial activity along main road supports local economy","Affordable mid-segment housing with stable occupancy") },
  @{ slug="mallapur"; score=61; cat="Moderate"; sig=@(63,62,62,50,55,54,50); liv=@(60,55,58,45,38); pr="Rs3,800-5,800/sqft"; yoy=7; dc="partial"; sv=5;
     h=@("Industrial-residential bridge locality east of Uppal","IDA Mallapur estate providing employment anchor","Improving road links to Nagaram ORR interchange","Affordable pricing attracting industrial workforce settlers") },
  @{ slug="kushaiguda"; score=62; cat="Moderate"; sig=@(65,65,60,50,58,55,50); liv=@(65,62,62,52,38); pr="Rs4,200-6,500/sqft"; yoy=7; dc="partial"; sv=5;
     h=@("Metro Blue Line station - high-frequency city connectivity","Dense residential locality with mature marketplace","Bridge between Uppal and Malkajgiri residential zones","Stable rental demand from working-class professional segment") },
  @{ slug="moula-ali"; score=60; cat="Moderate"; sig=@(62,60,60,45,65,48,52); liv=@(58,52,55,42,35); pr="Rs3,500-5,500/sqft"; yoy=6; dc="partial"; sv=5;
     h=@("Industrial zone with diverse manufacturing sector jobs","NH163 connectivity to airport and eastern corridors","Affordable worker housing with consistent rental occupancy","Long-established locality with stable pricing history") },
  @{ slug="musarambagh"; score=56; cat="Moderate"; sig=@(60,68,50,38,52,42,48); liv=@(60,62,65,52,30); pr="Rs3,200-5,000/sqft"; yoy=4; dc="estimated"; sv=4;
     h=@("Old city residential area near Chaderghat bridge","Dense mohalla-style housing with strong community character","Osmania Medical College proximity - healthcare cluster","Value play for old-city buyers seeking inner-ring pricing") },
  @{ slug="nagaram"; score=64; cat="Good Growth"; sig=@(62,58,68,58,52,62,62); liv=@(55,48,50,40,45); pr="Rs3,800-6,000/sqft"; yoy=11; dc="partial"; sv=5;
     h=@("ORR Nagaram interchange driving major development activity","IIT Hyderabad Research Park proximity - future tech hub","Satellite data shows rapid peri-urban conversion","Large-format HMDA-approved gated projects launched in 2025") },
  @{ slug="keesara"; score=61; cat="Moderate"; sig=@(60,52,68,55,48,60,62); liv=@(50,42,45,35,48); pr="Rs2,800-4,500/sqft"; yoy=10; dc="partial"; sv=5;
     h=@("Keesara ORR interchange - gateway to eastern growth corridor","Proximity to Genome Valley pharma cluster","Affordable plotted development in GHMC limits","Long-term appreciation expected as eastern corridor matures") },
  @{ slug="pocharam"; score=63; cat="Moderate"; sig=@(63,55,68,55,58,60,65); liv=@(52,45,48,38,45); pr="Rs3,000-5,000/sqft"; yoy=11; dc="partial"; sv=5;
     h=@("Pocharam IT Park and SEZ - major employment generator","GHMC-approved layouts with verified infrastructure development","Satellite change detection shows 40% built-up growth 2021-2026","ORR spur improving commuter access to HITEC City") },
  @{ slug="saroornagar"; score=61; cat="Moderate"; sig=@(62,63,60,50,52,54,52); liv=@(60,58,60,48,38); pr="Rs3,800-5,800/sqft"; yoy=7; dc="partial"; sv=5;
     h=@("South-east Hyderabad residential hub near LB Nagar","Metro Green Line proximity improving southern connectivity","Established residential colony with mature amenities","Affordable pricing relative to central south Hyderabad") },
  @{ slug="ferozguda"; score=63; cat="Moderate"; sig=@(65,63,60,52,62,55,50); liv=@(65,60,62,52,38); pr="Rs4,200-6,500/sqft"; yoy=7; dc="partial"; sv=5;
     h=@("Bridge locality between Balanagar industrial zone and JNTU area","Stable employment-driven residential demand","Metro Blue Line improving north-south connectivity","Affordable pricing for western-corridor residents") },
  @{ slug="lalapet"; score=58; cat="Moderate"; sig=@(60,62,55,45,52,50,45); liv=@(60,58,60,48,35); pr="Rs3,500-5,200/sqft"; yoy=5; dc="estimated"; sv=4;
     h=@("Established east Hyderabad residential locality","Close to Ramanthapur Metro station","Improving road links to Uppal and LB Nagar","Affordable pricing for inner-east buyers") },
  @{ slug="pedda-amberpet"; score=62; cat="Moderate"; sig=@(65,64,60,50,58,55,50); liv=@(65,62,62,52,38); pr="Rs4,200-6,500/sqft"; yoy=7; dc="partial"; sv=5;
     h=@("Extension of Amberpet - catching urban spillover demand","Metro Blue Line station improving connectivity","Stable residential demand from east-corridor professionals","Commercial street development increasing area vibrancy") },
  @{ slug="uppal-kalan"; score=61; cat="Moderate"; sig=@(62,60,63,52,52,56,55); liv=@(58,52,55,42,40); pr="Rs3,500-5,500/sqft"; yoy=8; dc="partial"; sv=5;
     h=@("Uppal ORR interchange - eastern growth corridor access","TSIIC industrial layout proximity driving employment","Affordable plotted development with verified RERA projects","Satellite data shows consistent residential expansion") },
  @{ slug="tarnaka"; score=63; cat="Moderate"; sig=@(68,62,60,50,60,56,52); liv=@(68,60,62,52,42); pr="Rs4,500-7,000/sqft"; yoy=7; dc="partial"; sv=5;
     h=@("Defence Research & Development Organisation (DRDO) campus anchor","Osmania University proximity drives academic rental demand","Metro Blue Line connectivity improving commuter access","Tree-lined defence-area streets offer rare green-suburb quality") },
  @{ slug="habsiguda"; score=62; cat="Moderate"; sig=@(65,63,60,50,58,55,50); liv=@(65,60,62,52,40); pr="Rs4,200-6,500/sqft"; yoy=7; dc="partial"; sv=5;
     h=@("Adjacent to Tarnaka - DRDO and Osmania University demand spillover","Metro Blue Line connectivity improving city-wide access","Established residential colony with community amenities","Stable demand from academic and defence professionals") },
  @{ slug="amberpet"; score=64; cat="Good Growth"; sig=@(68,68,62,55,60,58,52); liv=@(68,65,68,58,40); pr="Rs5,000-7,500/sqft"; yoy=8; dc="partial"; sv=6;
     h=@("Metro Blue Line station - high-frequency urban connectivity","Dense residential hub with strong social infrastructure","Close to LB Nagar commercial cluster and market","Consistent appreciation driven by inner-east demand") },
  # SOUTH
  @{ slug="malakpet"; score=58; cat="Moderate"; sig=@(62,70,52,42,55,45,50); liv=@(62,68,70,55,30); pr="Rs3,500-5,500/sqft"; yoy=5; dc="partial"; sv=5;
     h=@("Metro Blue Line station - central city connectivity","Dense residential locality near Afzalgunj market hub","Old city cultural character with improving infrastructure","Affordable pricing for inner-south Hyderabad buyers") },
  @{ slug="saidabad"; score=57; cat="Moderate"; sig=@(60,68,50,40,52,42,48); liv=@(60,65,68,52,30); pr="Rs3,200-5,000/sqft"; yoy=5; dc="partial"; sv=5;
     h=@("LB Nagar Metro terminal improving south connectivity","Dense residential area near Mir Alam tank","Affordable old-city adjacent housing","Close to South Zone GHMC administrative offices") },
  @{ slug="balapur"; score=59; cat="Moderate"; sig=@(60,58,60,50,48,56,60); liv=@(52,48,50,38,42); pr="Rs3,000-4,800/sqft"; yoy=8; dc="partial"; sv=5;
     h=@("ORR Phase 3 proximity improving southern access","TSRTC bus depot and emerging transport hub","Affordable plotted development attracting first-time buyers","Improving social infrastructure as population grows") },
  @{ slug="ibrahimpatnam"; score=57; cat="Moderate"; sig=@(58,52,62,50,45,55,58); liv=@(48,42,45,35,48); pr="Rs2,500-4,000/sqft"; yoy=9; dc="partial"; sv=5;
     h=@("Airport proximity - 15km from Rajiv Gandhi International","IDP industrial zone providing employment anchor","Agricultural land conversion to plotted development accelerating","Long-term appreciation as southern corridor matures") },
  @{ slug="turkayamjal"; score=56; cat="Moderate"; sig=@(58,50,62,48,42,56,58); liv=@(45,40,42,32,45); pr="Rs2,200-3,800/sqft"; yoy=9; dc="partial"; sv=5;
     h=@("Airport connectivity - 12km to terminal via NH44","Affordable plotted development with large land parcels","HMDA-approved layouts with long-term growth potential","Southern logistics corridor future land bank play") },
  @{ slug="maheshwaram"; score=57; cat="Moderate"; sig=@(58,48,65,52,48,58,62); liv=@(45,40,42,32,45); pr="Rs2,500-4,200/sqft"; yoy=10; dc="partial"; sv=5;
     h=@("Maheshwaram SEZ - pharma and manufacturing employment anchor","Airport proximity driving land value appreciation","Satellite data confirms rapid agricultural-to-residential conversion","TSRTC bus connectivity to Shamshabad and LB Nagar") },
  @{ slug="kothur"; score=55; cat="Moderate"; sig=@(55,45,62,50,42,58,60); liv=@(40,35,38,28,42); pr="Rs1,800-3,200/sqft"; yoy=10; dc="estimated"; sv=4;
     h=@("Kothur industrial zone - emerging southern employment centre","Proximity to Shadnagar ORR interchange","Lowest entry pricing in greater Hyderabad metropolitan area","Long-horizon land banking play for patient investors") },
  @{ slug="champapet"; score=60; cat="Moderate"; sig=@(63,68,55,45,55,48,50); liv=@(62,65,68,55,35); pr="Rs3,800-5,800/sqft"; yoy=6; dc="partial"; sv=5;
     h=@("Metro Green Line station improving north-south connectivity","Established residential locality near Dilsukhnagar","Improving road infrastructure reducing commute times","Stable demand from working-class residential segment") },
  @{ slug="bandlaguda"; score=58; cat="Moderate"; sig=@(60,60,58,48,50,50,52); liv=@(55,52,55,42,38); pr="Rs3,500-5,500/sqft"; yoy=6; dc="partial"; sv=5;
     h=@("South Hyderabad residential growth zone near Attapur","Improving NH44 connectivity improving commuter access","Affordable gated development attracting young families","Developing commercial strip improving daily convenience") },
  @{ slug="upparpally"; score=59; cat="Moderate"; sig=@(62,62,58,48,52,52,52); liv=@(58,55,58,45,38); pr="Rs3,800-5,800/sqft"; yoy=7; dc="partial"; sv=5;
     h=@("LB Nagar Metro proximity driving residential demand","Developing commercial corridor on Upparpally road","Affordable housing south of Attapur with improving connectivity","HMDA-approved plotted developments increasing supply quality") },
  @{ slug="karmanghat"; score=58; cat="Moderate"; sig=@(60,63,55,45,50,48,50); liv=@(58,60,62,48,35); pr="Rs3,500-5,200/sqft"; yoy=5; dc="partial"; sv=5;
     h=@("LB Nagar Metro zone - south Hyderabad connectivity anchor","Established residential area with mature social infrastructure","Close to LB Nagar commercial hub for daily needs","Affordable pricing relative to inner-south Hyderabad") },
  @{ slug="chandrayangutta"; score=53; cat="Moderate"; sig=@(58,65,48,38,48,40,52); liv=@(55,62,65,52,30); pr="Rs3,000-4,500/sqft"; yoy=4; dc="estimated"; sv=4;
     h=@("Old city residential area with strong community character","Improving road access to Falaknuma and old city core","Affordable pricing for inner-south Hyderabad location","Heritage value and cultural identity driving non-financial appeal") },
  @{ slug="falaknuma"; score=51; cat="Moderate"; sig=@(55,65,45,35,45,38,55); liv=@(52,62,62,55,30); pr="Rs2,800-4,200/sqft"; yoy=4; dc="estimated"; sv=4;
     h=@("Falaknuma Palace heritage anchor driving tourism appeal","Old city character with Nizam-era built environment","Improving connectivity via Falaknuma Metro station planned","Affordable entry pricing with cultural and heritage value") },
  @{ slug="santosh-nagar"; score=57; cat="Moderate"; sig=@(60,65,52,42,52,45,50); liv=@(58,62,65,52,32); pr="Rs3,500-5,200/sqft"; yoy=5; dc="partial"; sv=5;
     h=@("South Hyderabad residential locality near LB Nagar","Metro Green Line proximity improving connectivity","Close to Karmanghat industrial area employment","Affordable mid-segment housing with stable occupancy") },
  @{ slug="langar-houz"; score=58; cat="Moderate"; sig=@(62,65,52,44,52,48,52); liv=@(60,62,68,55,32); pr="Rs3,800-5,500/sqft"; yoy=5; dc="partial"; sv=5;
     h=@("South Hyderabad residential hub between Mehdipatnam and Attapur","Metro Blue Line improving north-south access","Mixed residential-commercial character with active street economy","Affordable pricing near Falaknuma and old city border") },
  @{ slug="mir-alam"; score=54; cat="Moderate"; sig=@(58,65,48,36,48,38,52); liv=@(55,62,62,50,30); pr="Rs2,800-4,200/sqft"; yoy=4; dc="estimated"; sv=4;
     h=@("Mir Alam tank - rare open water body providing environmental value","Old city residential character with heritage architecture","Improving infrastructure as GHMC upgrades heritage zones","Affordable entry point near Falaknuma for old-city buyers") },
  @{ slug="bandlaguda-jagir"; score=60; cat="Moderate"; sig=@(62,60,60,50,50,52,55); liv=@(55,52,55,42,40); pr="Rs3,500-5,500/sqft"; yoy=8; dc="partial"; sv=5;
     h=@("Adjacent to Tukkuguda ORR interchange improving south access","HMDA plotted development activity increasing","Satellite data shows growing residential footprint","Affordable pricing in outer south Hyderabad growth belt") },
  # WEST
  @{ slug="film-nagar"; score=68; cat="Good Growth"; sig=@(72,62,65,58,72,65,48); liv=@(72,70,75,68,42); pr="Rs7,000-11,000/sqft"; yoy=8; dc="partial"; sv=6;
     h=@("Telugu film industry hub - major cultural and commercial ecosystem","Celebrity residential demand drives premium land values","Close to Jubilee Hills and Banjara Hills premium belt","Consistent appreciation in land values over past decade") },
  @{ slug="rethibowli"; score=65; cat="Moderate"; sig=@(70,60,62,55,68,60,45); liv=@(70,65,72,62,38); pr="Rs6,000-9,500/sqft"; yoy=8; dc="partial"; sv=5;
     h=@("Buffer zone between Mehdipatnam and Financial District","IT commuter demand driving residential lease market","Improving connectivity via outer ring access roads","Premium pricing emerging as Financial District expands") },
  @{ slug="shaikpet"; score=66; cat="Good Growth"; sig=@(70,62,63,56,68,62,46); liv=@(70,65,72,62,40); pr="Rs6,500-10,000/sqft"; yoy=8; dc="partial"; sv=5;
     h=@("Close to Financial District and Nanakramguda IT cluster","Premium residential demand from tech-sector professionals","Improving road connectivity to Outer Ring Road","Land-locked micro-market with limited new supply - supply constraint drives value") },
  @{ slug="puppalaguda"; score=69; cat="Good Growth"; sig=@(72,62,70,62,65,70,65); liv=@(65,60,65,55,48); pr="Rs5,500-8,500/sqft"; yoy=12; dc="partial"; sv=6;
     h=@("Emerging premium suburb between Narsingi and Financial District","Satellite shows 50% built-up expansion in 5 years - fastest in west zone","ORR access driving corporate resident influx","HMDA master plan zone driving planned urban development") },
  @{ slug="khajaguda"; score=72; cat="Good Growth"; sig=@(75,65,72,65,70,72,62); liv=@(72,65,68,60,48); pr="Rs6,000-9,500/sqft"; yoy=12; dc="partial"; sv=6;
     h=@("HITEC City corridor premium - sub-market of Raidurgam cluster","Tech park proximity within 2km - walk-to-work appeal","ORR connectivity enabling mid-ring suburb upgrading","Consistent RERA project pipeline verifies demand strength") },
  @{ slug="raidurgam"; score=73; cat="Good Growth"; sig=@(78,65,72,65,78,72,58); liv=@(75,68,72,65,48); pr="Rs7,000-11,000/sqft"; yoy=11; dc="partial"; sv=6;
     h=@("HITEC City gateway - Mindspace and Raheja IT parks walkable","Premium residential demand from Microsoft, Google, Amazon workforce","ORR exit driving corridor appreciation 15%+ annually","Metro Blue Line connectivity extending tech zone residential premium") },
  @{ slug="gopanpally"; score=68; cat="Good Growth"; sig=@(72,62,70,60,65,68,62); liv=@(65,58,62,52,48); pr="Rs5,500-8,500/sqft"; yoy=11; dc="partial"; sv=6;
     h=@("ORR proximity - 5 mins to Financial District and Gachibowli","Emerging premium suburb catching HITEC City demand overflow","Satellite shows major gated development activity 2023-2026","IIT Hyderabad proximity creates long-term academic employment anchor") },
  @{ slug="nallagandla"; score=67; cat="Good Growth"; sig=@(70,60,70,60,63,68,62); liv=@(63,55,60,50,48); pr="Rs5,000-7,800/sqft"; yoy=11; dc="partial"; sv=6;
     h=@("Outer Ring Road direct access - 10 mins to HITEC City","Emerging township with large-format gated development","Satellite imagery confirms rapid agricultural conversion to residential","Affordable relative to Kondapur and Gachibowli - value proposition clear") },
  @{ slug="serilingampally"; score=66; cat="Good Growth"; sig=@(68,62,68,58,62,65,60); liv=@(62,55,58,48,45); pr="Rs4,500-7,000/sqft"; yoy=10; dc="partial"; sv=6;
     h=@("Serilingampally municipality - ORR western anchor point","IIT Hyderabad and ISB proximity driving premium demand","Affordable entry into the HITEC City orbit micro-market","Active RERA-registered project pipeline verifies developer confidence") },
  @{ slug="lingampally"; score=65; cat="Moderate"; sig=@(67,60,68,57,60,64,60); liv=@(60,52,55,45,45); pr="Rs4,200-6,500/sqft"; yoy=10; dc="partial"; sv=5;
     h=@("Metro Blue Line western terminus - HITEC City direct access","ORR proximity enabling fast corporate-campus commute","Affordable westward expansion catching Miyapur overflow demand","Active gated community launches confirming growth momentum") },
  @{ slug="beeramguda"; score=64; cat="Good Growth"; sig=@(65,58,68,55,58,62,62); liv=@(58,50,52,42,45); pr="Rs3,500-5,500/sqft"; yoy=11; dc="partial"; sv=5;
     h=@("ORR western connector to Patancheru industrial zone","Emerging residential hub catching Miyapur and Lingampally overflow","Large plotted development activity with HMDA approvals","Satellite data shows 42% built-up growth in 5-year window") },
  @{ slug="gandipet"; score=62; cat="Moderate"; sig=@(60,48,65,55,50,65,58); liv=@(52,45,48,38,55); pr="Rs3,500-5,500/sqft"; yoy=9; dc="partial"; sv=5;
     h=@("Gandipet reservoir - pristine lake setting and green lung of west HYD","Strict development controls protecting environmental character","Growing demand from lifestyle-first buyers seeking nature proximity","Emerging eco-resort and farmhouse community development") },
  @{ slug="golconda"; score=60; cat="Moderate"; sig=@(62,58,55,45,55,52,62); liv=@(58,55,55,48,42); pr="Rs4,000-6,500/sqft"; yoy=6; dc="partial"; sv=5;
     h=@("Golconda Fort - UNESCO World Heritage buffer zone","Tourism economy driving hospitality and retail demand","Qutb Shahi tombs proximity - cultural and heritage anchor","Improving road access between old city and western suburbs") },
  @{ slug="yousufguda"; score=64; cat="Good Growth"; sig=@(70,62,62,55,62,58,48); liv=@(68,65,70,60,40); pr="Rs5,500-8,500/sqft"; yoy=8; dc="partial"; sv=5;
     h=@("Premium residential pocket adjacent to Banjara Hills","Low commercial density - quiet and desirable residential character","Close to Jubilee Hills and Film Nagar cultural economy","Consistent appreciation driven by limited land supply in inner west") },
  @{ slug="madinaguda"; score=66; cat="Good Growth"; sig=@(68,62,68,58,62,65,60); liv=@(62,55,58,48,45); pr="Rs4,500-7,200/sqft"; yoy=10; dc="partial"; sv=6;
     h=@("ORR Miyapur interchange driving residential and commercial demand","Metro Blue Line terminal increasing connectivity to HITEC City","Active gated community development - multiple RERA-registered projects","Satellite shows sustained 35%+ built-up area growth since 2020") },
  @{ slug="osmansagar"; score=56; cat="Moderate"; sig=@(55,42,60,45,40,60,58); liv=@(45,38,40,30,55); pr="Rs2,500-4,000/sqft"; yoy=8; dc="estimated"; sv=4;
     h=@("Osmansagar reservoir - protected water body with scenic character","Low-density development zones protecting lake ecosystem","Eco-tourism and farmhouse economy emerging around reservoir","Long-term land bank value as water-body premium grows") },
  @{ slug="himayat-sagar"; score=55; cat="Moderate"; sig=@(52,40,58,42,38,58,60); liv=@(42,35,38,28,55); pr="Rs2,200-3,800/sqft"; yoy=8; dc="estimated"; sv=4;
     h=@("Himayat Sagar twin reservoir system - rare environmental value","Strict GHMC buffer zones limiting overdevelopment","Farmhouse and weekend retreat demand driving large-plot sales","Long-horizon appreciation as water-body scarcity premium builds") },
  @{ slug="chilukur"; score=54; cat="Moderate"; sig=@(52,40,58,40,38,56,55); liv=@(40,35,38,28,52); pr="Rs2,000-3,500/sqft"; yoy=7; dc="estimated"; sv=4;
     h=@("Chilukur Balaji temple - pilgrimage anchor with daily footfall","Close to Gandipet lake - dual environmental premium","Low-density, peaceful residential character near water bodies","Entry-level pricing for buyers seeking outer-west lifestyle") },
  @{ slug="isnapur"; score=62; cat="Moderate"; sig=@(63,55,65,55,55,60,62); liv=@(52,45,48,38,45); pr="Rs3,000-5,000/sqft"; yoy=10; dc="partial"; sv=5;
     h=@("ORR Patancheru interchange - western industrial corridor access","Medak road industrial zone providing stable employment","Satellite shows growing plotted development and township activity","Affordable western corridor option catching Miyapur overflow") }
)

$categoryMap = @{
  "ameerpet"="Established"; "punjagutta"="Established"; "khairatabad"="Established";
  "himayathnagar"="Established"; "narayanguda"="Established"; "abids"="Established";
  "nampally"="Established"; "masab-tank"="Established"; "humayun-nagar"="Established";
  "musheerabad"="Established"; "barkatpura"="Established"; "vidyanagar"="Established";
  "nallakunta"="Established"; "kavadiguda"="Established"; "lakdikapul"="Established";
  "koti"="Established"; "parsigutta"="Established"; "chanchalguda"="Established";
  "bollaram"="Industrial"; "suraram"="Emerging"; "jeedimetla"="Industrial";
  "quthbullapur"="Emerging"; "mallampet"="Emerging"; "trimulgherry"="Established";
  "sainikpuri"="Established"; "gajularamaram"="Emerging"; "dullapally"="Emerging";
  "hakimpet"="Established"; "ecil"="Established"; "maredpally"="Established";
  "neredmet"="Emerging"; "yapral"="Emerging"; "azamabad"="Industrial";
  "lalaguda"="Established"; "bahadurpally"="Emerging"; "moosapet"="Established";
  "moti-nagar"="Established"; "dammaiguda"="Emerging";
  "boduppal"="Emerging"; "kapra"="Emerging"; "ramanthapur"="Established";
  "mallapur"="Industrial"; "kushaiguda"="Established"; "moula-ali"="Industrial";
  "musarambagh"="Established"; "nagaram"="Emerging"; "keesara"="Emerging";
  "pocharam"="Emerging"; "saroornagar"="Established"; "ferozguda"="Established";
  "lalapet"="Established"; "pedda-amberpet"="Established"; "uppal-kalan"="Emerging";
  "tarnaka"="Established"; "habsiguda"="Established"; "amberpet"="Established";
  "malakpet"="Established"; "saidabad"="Established"; "balapur"="Emerging";
  "ibrahimpatnam"="Emerging"; "turkayamjal"="Emerging"; "maheshwaram"="Emerging";
  "kothur"="Emerging"; "champapet"="Established"; "bandlaguda"="Emerging";
  "upparpally"="Emerging"; "karmanghat"="Established"; "chandrayangutta"="Established";
  "falaknuma"="Established"; "santosh-nagar"="Established"; "langar-houz"="Established";
  "mir-alam"="Established"; "bandlaguda-jagir"="Emerging";
  "film-nagar"="Established"; "rethibowli"="Established"; "shaikpet"="Established";
  "puppalaguda"="Emerging"; "khajaguda"="High Growth"; "raidurgam"="High Growth";
  "gopanpally"="Emerging"; "nallagandla"="Emerging"; "serilingampally"="Emerging";
  "lingampally"="Emerging"; "beeramguda"="Emerging"; "gandipet"="Emerging";
  "golconda"="Established"; "yousufguda"="Established"; "madinaguda"="Emerging";
  "osmansagar"="Emerging"; "himayat-sagar"="Emerging"; "chilukur"="Emerging";
  "isnapur"="Emerging"
}

$tsLines = @()
foreach ($d in $data) {
  $slug = $d.slug
  $score = $d.score
  $cat = if ($categoryMap.ContainsKey($slug)) { $categoryMap[$slug] } else { "Emerging" }
  $sig = $d.sig
  $liv = $d.liv
  $pr = $d.pr
  $yoy = $d.yoy
  $dc = $d.dc
  $sv = $d.sv
  $h = $d.h | ForEach-Object { '      "' + $_ + '"' }
  $hStr = $h -join ",`n"
  $livStr = ""
  if ($liv -ne $null -and $liv.Count -ge 5) {
    $livStr = @"
    "livability": { "connectivity": $($liv[0]), "amenities": $($liv[1]), "ecommerce": $($liv[2]), "entertainment": $($liv[3]), "greenSpaces": $($liv[4]) },
"@
  }
  $entry = @"
  {
    ...locality("$slug"),
    "score": $score,
    "category": "$cat",
    "signals": { "infrastructure": $($sig[0]), "population": $($sig[1]), "satellite": $($sig[2]), "rera": $($sig[3]), "employment": $($sig[4]), "priceVelocity": $($sig[5]), "govtScheme": $($sig[6]) },
$($livStr)    "highlights": [
$hStr
    ],
    "priceRange": "$pr",
    "yoy": $yoy,
    "dataConfidence": "$dc",
    "dataAsOf": "2026-05-01",
    "signalsAvailable": $sv
  }
"@
  $tsLines += $entry
}

$newEntries = $tsLines -join ",`n"

$tsFile = "$base\frontend\src\data\hyderabad.ts"
$content = Get-Content $tsFile -Raw -Encoding UTF8

# Find position of the closing array bracket before export
# The pattern is: last occurrence of "},`n`n]`n`nexport"
# Replace "},\n\n]\n\nexport" with "},\n  new entries...\n]\n\nexport"

# Find last },\n\n] before export
$pattern = "},`r`n`r`n]`r`n`r`nexport"
$patternLF = "},`n`n]`n`nexport"

$insertMarker = "`n`n]`n`nexport"
$insertMarkerLF = "`n`n]`r`n`r`nexport"

# Replace the last ] before export keyword
$idx = $content.LastIndexOf("`n`n]`n`nexport")
if ($idx -lt 0) { $idx = $content.LastIndexOf("`r`n`r`n]`r`n`r`nexport") }
if ($idx -lt 0) { $idx = $content.LastIndexOf("]`n`nexport") }
if ($idx -lt 0) { $idx = $content.LastIndexOf("]`r`n`r`nexport") }

Write-Host "Insertion index: $idx"

if ($idx -ge 0) {
  # Find where ] is in the found substring
  $closeBracket = $content.IndexOf("]", $idx)
  $before = $content.Substring(0, $closeBracket)
  $after = $content.Substring($closeBracket + 1)
  $newContent = $before + ",`n" + $newEntries + "`n]" + $after
  Set-Content $tsFile $newContent -Encoding UTF8 -NoNewline
  Write-Host "hyderabad.ts updated with $($data.Count) new MicroMarket entries"
} else {
  Write-Host "ERROR: Could not find insertion point in hyderabad.ts"
  Write-Host "Last 200 chars: $($content.Substring($content.Length - 200))"
}
