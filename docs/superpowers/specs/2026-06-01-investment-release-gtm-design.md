# Investment Release GTM Design

## Decision

PlotDNA should launch next as a Hyderabad-first investment screening product, not as a broad Android marketplace app. The public beta can stay open, but the paid release should be framed as a due-diligence and micro-market intelligence workflow for serious buyers before they speak to brokers or commit site-visit time.

The product promise is:

> Screen a land or property location, understand the upside and risks, compare nearby micro-markets, and know exactly what to verify before investing.

The product must not claim to replace legal, title, valuation, or RERA verification. It should help users shortlist and prepare smarter questions.

## Primary Customer

The first release should serve serious buyers with a high-cost decision and low trust in broker-led information.

Primary segment:
- NRI and out-of-city buyers evaluating Hyderabad plots or apartments.
- Buyers comparing 3 to 5 micro-markets before site visits.
- Investors with a 3-year to 7-year horizon who want area-level conviction.

Secondary segment:
- Small brokers and real estate advisors who need clean, shareable reports for client education.
- Developer/channel-partner teams who want area explainers, not listing software.

The first release should not target casual app-store browsers. They have weak intent, low willingness to pay, and no reason to discover the product without existing demand.

## Positioning

PlotDNA should avoid competing directly with listing portals. Magicbricks, 99acres, Housing, and NoBroker already own buyer search intent, listings, and broker supply. PlotDNA's wedge is independent buyer intelligence.

Recommended positioning:

> PlotDNA is the investment due-diligence layer for Indian real estate buyers.

Supporting message:
- Not a listing portal.
- Not a broker.
- Not legal advice.
- A structured screening report for location quality, growth signals, price context, and verification gaps.

## Investment-Grade Requirements

The paid release is investment-grade only when these capabilities are visible to users:

1. Source-backed evidence
   - Each report must show data date, confidence, and source categories.
   - Area highlights should be tied to source links or labeled as model-estimated.
   - OSM, RERA, catalog, news, and manual/estimated signals must be distinguishable.

2. Clear investment verdict
   - Each area or coordinate result should summarize Buy, Wait, Avoid, or Investigate.
   - The verdict must include the best-fit use case: end-use, rental, 3-year investment, 7-year land bank, or speculative.
   - The verdict must include the main upside, main risk, and next verification step.

3. Price intelligence
   - Reports should show quoted price range, realistic entry range, YoY movement, and overpricing risk when data is available.
   - If price truth is estimated or partial, the report must label it explicitly.

4. Legal and approval checklist
   - Reports should list the exact documents and checks a buyer should request:
     RERA applicability, title chain, encumbrance certificate, conversion, zoning, HMDA/DTCP approval, lake/forest/buffer risk, road access, and seller identity.
   - The checklist should be action-oriented, not generic legal text.

5. Comparison workflow
   - The first paid workflow should compare 3 areas or 1 custom coordinate against nearby alternatives.
   - Users are more likely to pay for a decision aid than for a single score.

6. Shareable PDF report
   - The report should be clean enough for WhatsApp sharing with family, advisors, or brokers.
   - It should include the disclaimer and confidence labels on the first page.

## GTM Strategy

Launch city-first, segment-first, and content-first.

### Phase 1: Hyderabad Demand Test

Duration: 30 days.

Goal: validate buyer interest and lead capture before building more paid infrastructure.

Actions:
- Publish Hyderabad-focused landing page: "Hyderabad Land Investment Scanner".
- Produce SEO/content pages for 20 high-intent micro-markets.
- Create comparison content such as "Adibatla vs Tukkuguda", "Kokapet vs Narsingi", and "Mokila vs Shankarpally".
- Offer 10 free custom reports to early users in exchange for feedback.
- Capture email or phone before detailed report download.

Success metrics:
- 500 unique visitors.
- 50 qualified leads.
- 10 custom report requests.
- 5 users who ask for paid/custom help.

### Phase 2: Paid Beta

Duration: 30 to 60 days.

Goal: validate willingness to pay.

Actions:
- Add one-time paid reports before subscriptions.
- Add compare-3-areas workflow.
- Add "request manual verification" CTA.
- Partner with 5 to 10 brokers, real estate YouTubers, or local advisors.

Suggested pricing:
- Free: 3 searches or limited score summary.
- Rs 99 to Rs 199: one detailed area report.
- Rs 499 to Rs 999: compare 3 to 5 areas with PDF.
- Rs 2,999 to Rs 9,999: custom due-diligence pack for a specific property or location.
- Rs 1,999 to Rs 4,999/month: broker/advisor branded report tier after demand is proven.

Success metrics:
- 3 percent or higher lead-to-paid conversion on qualified leads.
- 20 paid reports.
- 3 broker/advisor conversations.
- 5 repeat users or referrals.

### Phase 3: Android Release

Android should follow proven pull from web users. It should not be the first GTM channel.

Android release gate:
- At least 50 to 100 users ask for mobile convenience or repeat access.
- Paid report flow is working on web.
- Reports are being shared.
- Top organic content pages are getting traffic.

Android positioning:
- Saved searches.
- Report access.
- Watchlist alerts.
- Site-visit checklist.

## Revenue Model

The first revenue model should be transactional, not subscription-first.

Recommended order:
1. Paid PDF report.
2. Area comparison report.
3. Custom due-diligence request.
4. Broker/advisor branded reports.
5. Subscription only after repeat usage is proven.

The product should avoid selling leads to brokers in the first phase. Buyer trust is the core differentiator, and lead-selling would weaken the positioning.

## Analytics Requirements

The release must measure:
- Search started.
- Search resolved to supported coverage.
- Report preview viewed.
- Email/phone captured.
- PDF generated.
- Payment started.
- Payment completed.
- Custom report requested.
- Share/download clicked.

Each event should include city, area slug, coverage tier, data confidence, and source of traffic when available.

## Risks

Main risks:
- Trust: users may not believe score outputs without visible evidence.
- Distribution: app-store launch without traffic will not create demand.
- Accuracy: partial or estimated data can create overconfidence if labels are weak.
- Liability: investment language can be misread as financial or legal advice.
- Unit economics: paid acquisition can be expensive before conversion is proven.

Mitigations:
- Keep disclaimers visible and specific.
- Use source-backed reports before charging at scale.
- Start with organic content and partnerships, not ads.
- Treat "investment-grade" as a product standard, not a legal guarantee.
- Measure paid intent before building broad mobile features.

## First Implementation Slice

The next product slice should build the smallest complete paid-intent funnel:

1. Hyderabad investment landing page.
2. Source-backed report sections on area pages.
3. Compare-3-areas workflow.
4. PDF report CTA and lead capture.
5. Analytics events for funnel tracking.

This slice can validate demand without requiring payment integration on day one. Payment can be added after users click the report CTA and request custom reports.

## Non-Goals

- Full India-wide investment claims.
- App-store-first launch.
- Broker lead marketplace.
- Legal/title verification automation.
- Guaranteed valuation or return predictions.
- New data vendors before the report evidence model is proven.

