# FlatDNA Phase 0C — Hyderabad evidence-review checkpoint

**Status:** EVIDENCE REVIEW ONLY — NO UUIDS, FIXTURE, SEED, OR DATABASE ROWS
**Reviewed:** 2026-08-09
**Input:** the 21-candidate discovery slate in `planning-0c.md`

## Decision

The provisional 21-project target is not defensible as an all-supported launch
registry. The reviewed result is:

- **14 INCLUDE** — eligible for the initial supported registry;
- **5 INCLUDE AS DRAFT** — real projects, but one or more launch identity gates are
  unresolved;
- **2 EXCLUDE** — the proposed canonical record would incorrectly collapse a larger
  marketed development onto a narrower phase/block RERA identity.

Do not replace failed candidates merely to preserve the number 21. If this checkpoint
is approved, Batch 0C should freeze the 14 included identities and revise the fixed
count/allocation assertions in `planning-0c.md` before UUID generation.

## Evidence method

Primary identity evidence was taken from official developer/project pages and the
Telangana RERA search endpoint. Public map sources were used only for project points,
as allowed by the approved evidence hierarchy. Telangana RERA searches were executed
directly by registration number on 2026-08-09; a result is called verified below only
when the official response returned the named project and promoter.

Coordinate precision proposed here is either `ENTRANCE` for an official project-page
map pin or `PROJECT_CENTROID` for a reviewed public-map project feature. A marketing
locality alone was never treated as coordinate evidence.

All locality slugs below already exist in PlotDNA's Hyderabad catalog. No new slug or
locality alias is proposed.

## Candidate reviews

### 1. Prestige High Fields — EXCLUDE

- **Developer:** Prestige Group / Prestige Estates Projects Limited
- **PlotDNA locality slug:** `financial-district`
- **Coordinates/source:** 17.4152802, 78.3404983; reviewed OpenStreetMap project
  feature: <https://www.openstreetmap.org/?mlat=17.4152802&mlon=78.3404983#map=18/17.4152802/78.3404983>
- **RERA:** P02400002893, verified by Telangana RERA as **PRESTIGE HIGH FIELDS PH II**,
  not the entire marketed Prestige High Fields development:
  <https://rerait.telangana.gov.in/searchlist/search?CertficateNo=P02400002893>
- **Official developer/project source:** Prestige Group investor material identifies
  Prestige High Fields and separately describes Phase I/Phase II:
  <https://d1t2fddy6amcvs.cloudfront.net/investors/financial-performance/fy-2017-2018/q1-investor-presentation.pdf>
- **Aliases worth storing:** none until phase identity is modelled; do not attach
  `Prestige High Fields Phase II` as an alias of an unphased canonical record.
- **Evidence quality:** high for the real development and Phase II registration; low
  for the proposed one-project-to-one-RERA identity.
- **Unresolved issue:** the candidate collapses multiple phases into one canonical
  project while the reviewed RERA record is phase-specific.
- **Recommendation:** **EXCLUDE** from the initial registry. Reconsider only after a
  phase policy is approved.

### 2. Myscape Isle of Sky — INCLUDE

- **Developer:** Myscape Properties Private Limited
- **PlotDNA locality slug:** `financial-district`
- **Coordinates/source:** 17.4136763, 78.3349034; curated public coordinate for the
  Myscape Courtyard Road address, checked against OpenStreetMap:
  <https://skyscraperpage.com/forum/showthread.php?p=10585226> and
  <https://www.openstreetmap.org/?mlat=17.4136763&mlon=78.3349034#map=19/17.4136763/78.3349034>
- **RERA:** P02400000466, verified by Telangana RERA as **MYSCAPE-ISLE OF SKY** with
  promoter Myscape Properties Private Limited:
  <https://rerait.telangana.gov.in/searchlist/search?CertficateNo=P02400000466>
- **Official developer/project source:** official Myscape brochure:
  <https://myscape.in/wp-content/uploads/2024/10/isle-of-sky.pdf>
- **Aliases worth storing:** `Isle of Sky` (official brochure short form) and the
  regulator's punctuation variant `MYSCAPE-ISLE OF SKY`.
- **Evidence quality:** medium-high; identity and RERA are primary, point is a curated
  public-map reference rather than an official embedded pin.
- **Unresolved issue:** none blocking; retain the exact source and review timestamp for
  the public-map point.
- **Recommendation:** **INCLUDE**.

### 3. Myscape Songs of the Sun — INCLUDE AS DRAFT

- **Developer:** Myscape Properties Private Limited
- **PlotDNA locality slug:** unresolved between `puppalaguda` and
  `financial-district`; the legal/site address says Puppalaguda while marketing also
  says Financial District.
- **Coordinates/source:** no reviewed entrance or centroid point was exposed by the
  official page during this checkpoint.
- **RERA:** P02400008721, verified by Telangana RERA as **MYSCAPE SONGS OF THE SUN**:
  <https://rerait.telangana.gov.in/searchlist/search?CertficateNo=P02400008721>
- **Official developer/project source:** <https://myscape.in/songsofthesun/>
- **Aliases worth storing:** `Songs of the Sun`, once the alias claim is tied to the
  official project page.
- **Evidence quality:** high for name/developer/RERA; insufficient for the launch
  locality and coordinate claims.
- **Unresolved issue:** a precise point is required to settle the Puppalaguda versus
  Financial District mapping without relying on marketing language.
- **Recommendation:** **INCLUDE AS DRAFT**.

### 4. My Home Nishada — INCLUDE

- **Developer:** My Home Constructions (RERA promoter: Aqua Space Developers Private
  Limited)
- **PlotDNA locality slug:** `kokapet`
- **Coordinates/source:** 17.405700, 78.308357; official project-page Google Maps pin:
  <https://www.myhomenishada.co.in/>
- **RERA:** P02400004696, verified by Telangana RERA as **NISHADA**:
  <https://rerait.telangana.gov.in/searchlist/search?CertficateNo=P02400004696>
- **Official developer/project source:** <https://www.myhomenishada.co.in/> and the My
  Home portfolio: <https://www.myhomeconstructions.com/ongoing-projects/>
- **Aliases worth storing:** `Nishada`; do not store spacing/case-only variations.
- **Evidence quality:** high.
- **Unresolved issue:** the brand developer and legal RERA promoter differ; preserve
  the promoter in evidence rather than replacing the public developer identity.
- **Recommendation:** **INCLUDE**.

### 5. Prestige Beverly Hills — INCLUDE

- **Developer:** Prestige Group (RERA promoter: Prestige Garden Estates Pvt Ltd)
- **PlotDNA locality slug:** `kokapet`
- **Coordinates/source:** 17.4019084, 78.3375648; reviewed OpenStreetMap project
  feature: <https://www.openstreetmap.org/?mlat=17.4019084&mlon=78.3375648#map=18/17.4019084/78.3375648>
- **RERA:** P02400003715, verified by Telangana RERA as **PRESTIGE BEVERLY HILLS**:
  <https://rerait.telangana.gov.in/searchlist/search?CertficateNo=P02400003715>
- **Official developer/project source:** Prestige's residential portfolio:
  <https://www.prestigeconstructions.com/residential-projects>
- **Aliases worth storing:** none at launch; `Prestige Group` belongs to developer
  evidence, not the project alias list.
- **Evidence quality:** high for regulatory identity and point; medium-high for the
  current developer-page chain because the completed project detail page is no longer
  prominent.
- **Unresolved issue:** brand/legal-promoter distinction only; not a project-identity
  blocker.
- **Recommendation:** **INCLUDE**.

### 6. Rajapushpa Pristinia — INCLUDE

- **Developer:** Rajapushpa Properties (RERA promoter: Rajapushpa Infra Private
  Limited)
- **PlotDNA locality slug:** `kokapet`
- **Coordinates/source:** 17.396200, 78.325940; official project-page Google Maps pin:
  <https://rajapushpa.in/projects/residential/pristinia-apartments-kokapet-hyderabad>
- **RERA:** P02400006086, verified by Telangana RERA as **RAJAPUSHPA PRISTINIA**:
  <https://rerait.telangana.gov.in/searchlist/search?CertficateNo=P02400006086>
- **Official developer/project source:** the project page above.
- **Aliases worth storing:** `Pristinia`, because the official page uses the short
  branded name independently.
- **Evidence quality:** high.
- **Unresolved issue:** none blocking.
- **Recommendation:** **INCLUDE**.

### 7. Rajapushpa Provincia — INCLUDE

- **Developer:** Rajapushpa Properties Pvt Ltd
- **PlotDNA locality slug:** `narsingi`
- **Coordinates/source:** 17.395387, 78.355053; official project-page Google Maps pin:
  <https://rajapushpa.in/projects/residential/provincia-apartments-narsingi-hyderabad>
- **RERA:** P02400002487, verified by Telangana RERA as **RAJAPUSHPA PROVINCIA**:
  <https://rerait.telangana.gov.in/searchlist/search?CertficateNo=P02400002487>
- **Official developer/project source:** the project page above and official brochure:
  <https://rajapushpa.in/brochures/Rajapushpa-Provincia-Brochure.pdf>
- **Aliases worth storing:** `Provincia`.
- **Evidence quality:** high.
- **Unresolved issue:** none blocking; marketing references to Financial District are
  proximity language and do not replace the `narsingi` slug.
- **Recommendation:** **INCLUDE**.

### 8. NCC Urban One — EXCLUDE

- **Developer:** marketed by NCC Urban; RERA promoter is Varapradha Real Estates
  Private Limited.
- **PlotDNA locality slug:** proposed `narsingi`, but official sources also use
  Kokapet/Manchirevula.
- **Coordinates/source:** official project page contains a Google Map but did not
  expose a stable coordinate in the retrieved HTML; a public photograph point is not a
  project entrance/centroid.
- **RERA:** P02400000379, verified as **NCC URBAN ONE - BLOCK 6, BLOCK 12, BLOCK 8**:
  <https://rerait.telangana.gov.in/searchlist/search?CertficateNo=P02400000379>
- **Official developer/project source:** <https://www.nccurban.com/ongoing-projects/ncc-urban-one-flats-for-sale-in-hyderabad>
- **Aliases worth storing:** none. `Urban One` must not be attached until the whole
  development versus registered-block relationship is defined.
- **Evidence quality:** high for the block-level RERA record; insufficient for the
  proposed whole-township canonical identity.
- **Unresolved issue:** the official project page describes 12 towers, while the RERA
  record is explicitly limited to three blocks. The brand developer and legal promoter
  also differ.
- **Recommendation:** **EXCLUDE** from the initial registry, not merely mark the whole
  project supported with a partial RERA record.

### 9. Aparna Zenon — INCLUDE AS DRAFT

- **Developer:** Aparna Constructions and Estates Pvt Ltd
- **PlotDNA locality slug:** `puppalaguda`
- **Coordinates/source:** official interactive location map exists, but this review did
  not obtain an accepted entrance or whole-project centroid from it:
  <https://aparna-zenon.clove.build/zenon-3d-experience/map>
- **RERA:** P02400003722, verified by Telangana RERA as **APARNA ZENON**:
  <https://rerait.telangana.gov.in/searchlist/search?CertficateNo=P02400003722>
- **Official developer/project source:** <https://www.aparnaconstructions.com/project/apartments/aparna-zenon>
- **Aliases worth storing:** none yet; `Zenon` is too weak without a separate alias
  claim.
- **Evidence quality:** high for identity/RERA/locality; incomplete for coordinate
  precision.
- **Unresolved issue:** available public coordinates identify individual towers, not
  an approved project entrance or centroid. Do not infer a centroid by averaging them.
- **Recommendation:** **INCLUDE AS DRAFT**.

### 10. EIPL Cornerstone — INCLUDE

- **Developer:** EIPL Group / EIPL Constructions
- **PlotDNA locality slug:** `puppalaguda`
- **Coordinates/source:** 17.3991337335, 78.3670722750; official project-page pin named
  **EIPL Cornerstone Main Gate**:
  <https://www.eiplgroup.com/projects/cornerstone>
- **RERA:** P02400005057, verified by Telangana RERA as **CORNER STONE**, promoter
  EIPL Constructions:
  <https://rerait.telangana.gov.in/searchlist/search?CertficateNo=P02400005057>
- **Official developer/project source:** the project page above.
- **Aliases worth storing:** `Cornerstone` and regulatory spelling `Corner Stone`.
- **Evidence quality:** high.
- **Unresolved issue:** none blocking; keep the generic short alias parent-scoped
  because it can collide with unrelated projects.
- **Recommendation:** **INCLUDE**.

### 11. My Home Tridasa — INCLUDE

- **Developer:** My Home Constructions (RERA promoter: My Home Infrastructures Pvt Ltd)
- **PlotDNA locality slug:** `tellapur`
- **Coordinates/source:** 17.469476, 78.259668; official project-page Google Maps pin:
  <https://www.myhomeconstructions.com/my-home-tridasa/>
- **RERA:** P01100002276, verified by Telangana RERA as **MY HOME TRIDASA**:
  <https://rerait.telangana.gov.in/searchlist/search?CertficateNo=P01100002276>
- **Official developer/project source:** the project page above.
- **Aliases worth storing:** `Tridasa` only if the short form is captured from the
  official page content; no typo aliases.
- **Evidence quality:** high.
- **Unresolved issue:** brand/legal-promoter distinction only.
- **Recommendation:** **INCLUDE**.

### 12. Aparna Newlands — INCLUDE

- **Developer:** Aparna Constructions and Estates Pvt Ltd
- **PlotDNA locality slug:** `tellapur`
- **Coordinates/source:** 17.4557443, 78.2896784; reviewed OpenStreetMap project
  feature: <https://www.openstreetmap.org/?mlat=17.4557443&mlon=78.2896784#map=18/17.4557443/78.2896784>
- **RERA:** P01100007480, verified by Telangana RERA as **APARNA NEWLANDS**. The
  developer page visually renders the first digit as `O` in places, while its official
  brochure and the regulator return zero:
  <https://rerait.telangana.gov.in/searchlist/search?CertficateNo=P01100007480>
- **Official developer/project source:** <https://www.aparnaconstructions.com/project/apartments/aparna-newlands>
- **Aliases worth storing:** none; the `O`/`0` discrepancy is a displayed RERA typo,
  not a project alias.
- **Evidence quality:** high.
- **Unresolved issue:** none blocking after normalizing the registration to the
  regulator-confirmed value.
- **Recommendation:** **INCLUDE**.

### 13. Rajapushpa Imperia — INCLUDE

- **Developer:** Rajapushpa Properties Pvt Ltd
- **PlotDNA locality slug:** `tellapur`
- **Coordinates/source:** 17.452700, 78.274218; official project-page Google Maps pin:
  <https://rajapushpa.in/projects/residential/imperia-apartments-tellapur-hyderabad>
- **RERA:** P01100003723, verified by Telangana RERA as **RAJAPUSHPA IMPERIA**:
  <https://rerait.telangana.gov.in/searchlist/search?CertficateNo=P01100003723>
- **Official developer/project source:** the project page above.
- **Aliases worth storing:** `Imperia`.
- **Evidence quality:** high.
- **Unresolved issue:** none blocking.
- **Recommendation:** **INCLUDE**.

### 14. Aparna Sarovar Zenith — INCLUDE

- **Developer:** Aparna Constructions (RERA promoter: Aparna Infrahousing Private
  Limited)
- **PlotDNA locality slug:** `nallagandla`
- **Coordinates/source:** 17.4673650, 78.3120470; reviewed OpenStreetMap project
  feature: <https://www.openstreetmap.org/?mlat=17.4673650&mlon=78.3120470#map=18/17.4673650/78.3120470>
- **RERA:** P02400000022, verified by Telangana RERA as **APARNA SAROVAR ZENITH**:
  <https://rerait.telangana.gov.in/searchlist/search?CertficateNo=P02400000022>
- **Official developer/project source:** <https://www.aparnaconstructions.com/project/apartments/aparna-sarovar-zenith>
- **Aliases worth storing:** none at launch; do not add `Sarovar Zenith` without a
  reviewed independent official use.
- **Evidence quality:** high.
- **Unresolved issue:** brand/legal-promoter distinction only.
- **Recommendation:** **INCLUDE**.

### 15. Aparna Sarovar Zicon — INCLUDE

- **Developer:** Aparna Constructions (RERA promoter: Aparna Infrahousing Private
  Limited)
- **PlotDNA locality slug:** `nallagandla`
- **Coordinates/source:** 17.4641144, 78.3137278; reviewed OpenStreetMap project
  feature: <https://www.openstreetmap.org/?mlat=17.4641144&mlon=78.3137278#map=18/17.4641144/78.3137278>
- **RERA:** P02400002673, verified by Telangana RERA as **APARNA SAROVAR ZICON**:
  <https://rerait.telangana.gov.in/searchlist/search?CertficateNo=P02400002673>
- **Official developer/project source:** <https://www.aparnaconstructions.com/project/apartments/aparna-sarovar-zicon>
- **Aliases worth storing:** none. Do not store the common misspelling `Zircon`.
- **Evidence quality:** high.
- **Unresolved issue:** none blocking.
- **Recommendation:** **INCLUDE**.

### 16. My Home Vihanga — INCLUDE AS DRAFT

- **Developer:** My Home Constructions Pvt Ltd
- **PlotDNA locality slug:** `gachibowli`
- **Coordinates/source:** 17.4338275, 78.3322576; reviewed OpenStreetMap project
  feature: <https://www.openstreetmap.org/?mlat=17.4338275&mlon=78.3322576#map=18/17.4338275/78.3322576>
- **RERA:** none found. The official My Home journal places its launch in 2013, before
  the Real Estate (Regulation and Development) Act, 2016:
  <https://www.myhomeconstructions.com/wp-content/uploads/2020/09/Expressions_April-2013.pdf>
- **Official developer/project source:** <https://www.myhomeconstructions.com/my-home-vihanga/>
- **Aliases worth storing:** none.
- **Evidence quality:** high for identity/location; unresolved for the current launch
  profile, which requires a RERA reference for every supported record.
- **Unresolved issue:** the schema can omit a RERA record, but the planned 0C launch
  validator has no reviewed `PRE_RERA/NOT_APPLICABLE` mechanism. Do not silently waive
  that gate for one project.
- **Recommendation:** **INCLUDE AS DRAFT** until the product owner either approves a
  documented pre-RERA exception policy or replaces it.

### 17. Prestige Ivy League — INCLUDE AS DRAFT

- **Developer:** Prestige Group / Prestige Estates Projects Limited
- **PlotDNA locality slug:** `kondapur`, not the provisional Gachibowli grouping; the
  official regulator detail places it at Kothaguda Junction, Kondapur Village.
- **Coordinates/source:** 17.4594718, 78.3694865; reviewed OpenStreetMap project
  feature: <https://www.openstreetmap.org/?mlat=17.4594718&mlon=78.3694865#map=18/17.4594718/78.3694865>
- **RERA:** unresolved. Public pages claim P02400005677, but the direct Telangana RERA
  search returns **Prestige Clairemont**, not Prestige Ivy League:
  <https://rerait.telangana.gov.in/searchlist/search?CertficateNo=P02400005677>
- **Official/regulatory source:** Telangana RERA project detail identifies Prestige Ivy
  League and its Kothaguda/Kondapur address, but the reviewed response did not expose a
  safe registration number:
  <https://rerait.telangana.gov.in/PrintPreview/PrintPreview?q=hYNV8thAtesLnZCFM50YuBUIcNEm%2F3phQIpdZFVOJCVsAqFVC%2FY7VhRwOPY4GkCwK2XVnivXxZXyFnx%2BkSP0ZaC1%2FqH3Lpu72qn82t52t89k0Jr%2F5EmW8wGxEJD0uxxJPOKwy6OzceB59TgTy4tyza7PJmOow0CIvctEwkgU9GRlh%2BV4W02IQA%3D%3D>
- **Official developer/project source:** Prestige Group investor material identifies
  Prestige Ivy League as a Hyderabad residential project:
  <https://d1t2fddy6amcvs.cloudfront.net/investors/financial-performance/fy-2017-2018/q1-investor-presentation.pdf>
- **Aliases worth storing:** none until the registration identity is resolved.
- **Evidence quality:** high for project existence/location; failed for the proposed
  RERA reference.
- **Unresolved issue:** incorrect public RERA association plus original locality
  misclassification.
- **Recommendation:** **INCLUDE AS DRAFT**.

### 18. Aparna Luxor Park — INCLUDE

- **Developer:** Aparna Constructions and Estates Pvt Ltd
- **PlotDNA locality slug:** `kondapur`
- **Coordinates/source:** 17.4658619, 78.3359911; reviewed OpenStreetMap project
  feature: <https://www.openstreetmap.org/?mlat=17.4658619&mlon=78.3359911#map=18/17.4658619/78.3359911>
- **RERA:** P02400001260, verified by Telangana RERA as **APARNA LUXOR PARK**:
  <https://rerait.telangana.gov.in/searchlist/search?CertficateNo=P02400001260>
- **Official developer/project source:** <https://www.aparnaconstructions.com/project/apartments/aparna-luxor-park>
- **Aliases worth storing:** none.
- **Evidence quality:** high.
- **Unresolved issue:** none blocking.
- **Recommendation:** **INCLUDE**.

### 19. Codename Sky Habitat — INCLUDE AS DRAFT

- **Developer:** Urbanrise (RERA promoter: Alliance Inn India Private Limited)
- **PlotDNA locality slug:** unresolved. Marketing uses `miyapur`, while the official
  project site gives an Ameenpur site address.
- **Coordinates/source:** official project location-map source exists, but no reviewed
  entrance/centroid was extracted for this checkpoint:
  <https://codenameskyhabitat.com/>
- **RERA:** the marketed number P01100006655 is valid, but Telangana RERA returns the
  canonical regulatory name **THE WORLD OF JOY**, not Codename Sky Habitat:
  <https://rerait.telangana.gov.in/searchlist/search?CertficateNo=P01100006655>
- **Official developer/project source:** Urbanrise portfolio:
  <https://www.urbanrise.in/projects>
- **Aliases worth storing:** none until evidence establishes whether `Codename Sky
  Habitat`, `Sky Habitat`, and `The World of Joy` are a rename of one project or
  distinct marketed/regulatory scopes.
- **Evidence quality:** high for the RERA record and marketed project existence;
  insufficient for canonical-name and locality equivalence.
- **Unresolved issue:** canonical-name mismatch, legal-promoter/brand difference,
  Miyapur/Ameenpur locality conflict, and missing accepted point.
- **Recommendation:** **INCLUDE AS DRAFT**.

### 20. On Cloud 33 — INCLUDE

- **Developer:** Urbanrise / Urbanrise Lifestyles Private Limited
- **PlotDNA locality slug:** `bachupally`
- **Coordinates/source:** 17.5392733, 78.3559675; manually reviewed public project map:
  <https://www.homes247.in/property/hyderabad/bachupally/urbanrise-on-cloud-33-99009>
- **RERA:** P02200003724, verified by Telangana RERA as **ON CLOUD 33**, promoter
  Urbanrise Lifestyles Private Limited:
  <https://rerait.telangana.gov.in/searchlist/search?CertficateNo=P02200003724>
- **Official developer/project source:** <https://www.urbanrise.in/projects> and the
  official project site <https://www.urbanriseoncloud33.com/>.
- **Aliases worth storing:** `Urbanrise On Cloud 33` and official spacing variant
  `On Cloud33`.
- **Evidence quality:** medium-high; primary identity/RERA, curated public point.
- **Unresolved issue:** none blocking; coordinate claim should cite the public map, not
  imply it came from the regulator.
- **Recommendation:** **INCLUDE**.

### 21. Ramky One Harmony — INCLUDE

- **Developer:** Ramky Estates (RERA promoter: Ramky Srisairam Properties Private
  Limited)
- **PlotDNA locality slug:** `bachupally`; the official project markets Pragathi Nagar,
  while the RERA certificate and Telangana Pollution Control Board locate the site in
  Bachupally village.
- **Coordinates/source:** 17.5307113, 78.3899865; reviewed OpenStreetMap project
  feature: <https://www.openstreetmap.org/?mlat=17.5307113&mlon=78.3899865#map=18/17.5307113/78.3899865>
- **RERA:** P02200002611, verified by Telangana RERA as **RAMKY ONE HARMONY**:
  <https://rerait.telangana.gov.in/searchlist/search?CertficateNo=P02200002611>
- **Official developer/project source:** <https://www.ramkyestates.com/projects/ramky-one-harmony/>
- **Official corroboration:** Telangana Pollution Control Board consent identifies
  Survey No. 159(P), Bachupally village:
  <https://ocmms.nic.in/OCMMS_NEW/download.action?applicationId=4863937&industryFor=ANW&industryState=Telangana&industryType=CTE>
- **Aliases worth storing:** none at launch; Pragathi Nagar is display/source fidelity,
  not a project alias.
- **Evidence quality:** high.
- **Unresolved issue:** brand/legal-promoter distinction only; the regulatory village
  resolves the locality mapping.
- **Recommendation:** **INCLUDE**.

## Final supported registry proposal

### Included projects (14)

1. Myscape Isle of Sky — `financial-district`
2. My Home Nishada — `kokapet`
3. Prestige Beverly Hills — `kokapet`
4. Rajapushpa Pristinia — `kokapet`
5. Rajapushpa Provincia — `narsingi`
6. EIPL Cornerstone — `puppalaguda`
7. My Home Tridasa — `tellapur`
8. Aparna Newlands — `tellapur`
9. Rajapushpa Imperia — `tellapur`
10. Aparna Sarovar Zenith — `nallagandla`
11. Aparna Sarovar Zicon — `nallagandla`
12. Aparna Luxor Park — `kondapur`
13. On Cloud 33 — `bachupally`
14. Ramky One Harmony — `bachupally`

### Draft projects (5)

| Project | Blocking reason |
| --- | --- |
| Myscape Songs of the Sun | No accepted point; Puppalaguda versus Financial District locality remains unresolved. |
| Aparna Zenon | Identity/RERA/locality pass, but available points are tower-specific rather than an approved entrance/centroid. |
| My Home Vihanga | Pre-RERA project; the planned launch validator has no approved RERA-not-applicable policy. |
| Prestige Ivy League | Publicly repeated RERA number resolves to another project; provisional Gachibowli allocation is also wrong. |
| Codename Sky Habitat | RERA canonical name is The World of Joy; Miyapur/Ameenpur and coordinate identity remain unresolved. |

### Excluded projects (2)

| Project | Exclusion reason |
| --- | --- |
| Prestige High Fields | The available RERA identity is Phase II, not the whole multi-phase development proposed as one canonical project. |
| NCC Urban One | The available RERA identity covers three named blocks, not the whole 12-tower marketed township. |

## Locality distribution

| PlotDNA locality slug | Included | Draft | Excluded |
| --- | ---: | ---: | ---: |
| `financial-district` | 1 | 0 | 1 |
| `kokapet` | 3 | 0 | 0 |
| `narsingi` | 1 | 0 | 1 |
| `puppalaguda` | 1 | 2 | 0 |
| `tellapur` | 3 | 0 | 0 |
| `nallagandla` | 2 | 0 | 0 |
| `gachibowli` | 0 | 1 | 0 |
| `kondapur` | 1 | 1 | 0 |
| `miyapur` | 0 | 1 | 0 |
| `bachupally` | 2 | 0 | 0 |
| **Total** | **14** | **5** | **2** |

The supported set covers eight existing PlotDNA slugs. It intentionally leaves
Gachibowli and Miyapur unsupported until their candidate-specific evidence problems
are resolved.

## Developer distribution for included projects

| Public developer identity | Included projects |
| --- | ---: |
| Aparna Constructions | 4 |
| Rajapushpa Properties | 3 |
| My Home Constructions | 2 |
| Myscape Properties | 1 |
| Prestige Group | 1 |
| EIPL Group | 1 |
| Urbanrise | 1 |
| Ramky Estates | 1 |
| **Total** | **14** |

Legal RERA promoter names must remain in evidence. They are not silently substituted
for the public developer identity used by project search.

## Evidence-source summary

- 18 of 21 candidates have a direct, matching Telangana RERA result under the reviewed
  registration number or an official regulator detail record.
- Prestige Ivy League failed the proposed RERA-number check: P02400005677 belongs to
  Prestige Clairemont.
- My Home Vihanga is demonstrably pre-RERA but the launch policy does not yet encode an
  exemption.
- Every included project has an official developer/project source and a reviewed
  entrance or project-centroid source.
- Included coordinates use six official embedded project pins and eight manually
  reviewed public-map points.
- No scraper output, synthetic record, test fixture, listing-generated identity, or
  LLM-generated fact was accepted as canonical evidence.

## Alias review

Aliases worth storing only after per-alias claims are created:

- Myscape Isle of Sky: `Isle of Sky`, `MYSCAPE-ISLE OF SKY`;
- My Home Nishada: `Nishada`;
- Rajapushpa Pristinia: `Pristinia`;
- Rajapushpa Provincia: `Provincia`;
- EIPL Cornerstone: `Cornerstone`, `Corner Stone`;
- Rajapushpa Imperia: `Imperia`;
- On Cloud 33: `Urbanrise On Cloud 33`, `On Cloud33`.

Do not store typo aliases for Zicon/Zenith, the wrong Ivy League RERA number,
marketing localities, or phase/block names as aliases of broader projects.

## Resolver-test value

The following organic cases are useful for Batch 0D without manufacturing aliases:

- **Aparna Sarovar Zenith vs Aparna Sarovar Zicon** — same developer, locality, and
  shared name prefix;
- **Rajapushpa Pristinia / Provincia / Imperia** — same developer with similar branded
  suffixes across localities;
- **Cornerstone vs Corner Stone** — evidenced spacing/tokenization variant;
- **On Cloud 33 vs On Cloud33** — evidenced spacing variant;
- **Myscape Isle of Sky vs Myscape Songs of the Sun** — same developer and shared
  poetic naming, but only one is supported initially;
- **Prestige High Fields / Phase II** and **NCC Urban One / registered blocks** — useful
  future examples of why a resolver must not collapse phase/block identities.

Draft and excluded records must not be inserted as supported merely to create resolver
tests.

## Readiness decision

**YES — the 14 included projects are strong enough to proceed to one-time UUID
generation and fixture creation, but only after this reduced roster is approved and
the fixed `21` count/allocation gates in `planning-0c.md` are revised to `14` and the
distribution above.**

The five draft and two excluded candidates are not approved for supported fixture
rows. This checkpoint created no UUIDs, `registry.json`, seed data, migrations,
application code, or database rows.
