# Hyderabad Uncovered Area Backlog

As of 2026-06-05, Hyderabad coverage on PR #47 is targeted at 240 frontend
locality polygons and 240 backend catalog area cards. These are the remaining
practical Hyderabad-region areas worth adding next. This is not a claim that
every listed market is verified or investable; many should stay `estimated`
until project-level evidence improves.

## Deployment Note

Before 2026-06-05, production Vercel reflected `main` through PR #45. PR #46
and PR #47 were preview-only until they were merged into `main`. As of
2026-06-05, both PRs are merged; the public site should update after the latest
Vercel production deployment for `main` completes.

Preview deployments are not production deployments. If a change appears in a PR
preview but not on the public site, check that the PR is merged, the `main`
production deployment finished, and the browser is not serving a cached bundle.

## Highest-Priority Gaps

These are the next areas most likely to reduce visible map holes around the
current Hyderabad satellite view.

### West / Patancheru-Sangareddy Connector

- Kardhanur
- Nallavalli
- Chitkul
- Lakshmi Nagar Patancheru
- Patancheru IDPL
- Ramachandrapuram BHEL
- Tellapur Extension
- Osman Nagar
- Ippatnagar
- Beeramguda Extension

### Northwest / Medak Road

- Kandlakoya
- Gowdavalli
- Ravalkole
- Dommarapochampally
- Maisammaguda
- Yellampet
- Girmapur
- Tupran
- Manoharabad
- Wargal
- Gajwel
- Kowdipally

### West / Vikarabad Belt

- Anantagiri Hills
- Kotepally
- Doma
- Pudur Vikarabad
- Yenkepally
- Navandgi
- Kerelly
- Mominkalan

### Far West / Zaheerabad Belt

- Nyalkal
- Jharasangam
- Mogudampally
- Narayankhed
- Manoor
- Kalgi
- Kohir Road
- Sadasivpet West

## Secondary Expansion Gaps

These should be added after the west and northwest gaps because they expand the
outer search/resolver footprint rather than fixing the most visible current map
holes.

### Southwest / Shadnagar-Kadthal

- Keshampet
- Kondurg
- Chaudergudem
- Kadthal
- Amangal
- Talakondapally
- Elkatta
- Solipur

### South / Airport-Maheshwaram

- Gaganpahad
- Budvel
- Mamidipally
- Srisailam Highway belt
- Lemur
- Mankhal
- Mansanpally
- Pendyal
- Mucharla

### Southeast / Adibatla-Ibrahimpatnam

- Kongara Kalan
- Mangalpally
- Bongloor
- Sheriguda
- Manneguda
- Raipole
- Pocharam Ibrahimpatnam
- Batasingaram

### East / Bhongir-Yadadri-Choutuppal

- Bhongir / Bhuvanagiri
- Yadagirigutta
- Choutuppal
- Valigonda
- Ramannapet
- Aler
- Motakondur
- Dandumalkapur

### Northeast / Ghatkesar-Keesara

- Narapally
- Chengicherla
- Cherlapally
- Kundanpally
- Korremula
- Ankushapur
- Yamnampet
- Prathap Singaram
- Edulabad
- Bogaram

## Municipal Pocket Gaps

These are closer-in locality gaps that matter for search quality and nearby
fallbacks.

- Nadergul
- Badangpet
- Meerpet
- Jillelaguda
- Balapur X Road
- Kuntloor
- Hasthinapuram
- BN Reddy Nagar
- Almasguda

## Next Coverage Target

The next practical milestone is 300-310 Hyderabad areas:

- keep frontend polygons and backend catalog cards one-to-one
- mark low-evidence outskirts as `estimated`
- avoid broad blanket polygons that hide locality-level risk
- add resolver tests for coordinates in each new corridor
