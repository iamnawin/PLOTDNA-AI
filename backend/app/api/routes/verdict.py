from fastapi import APIRouter, HTTPException
from app.services.verdict_service import get_verdict
from app.services.news_aggregator import fetch_news_for_area
from app.services.entity_router import route_items

# Static area data — maps slug → (name, city_name, signals, score, price_range, yoy)
# In Phase 2 this moves to a database; for now we embed it here.
AREA_DATA: dict[str, dict] = {
    # ── Hyderabad ──────────────────────────────────────────────────────────────
    "financial-district": {"name":"Financial District","city":"hyderabad","city_name":"Hyderabad","score":78,"price_range":"₹7,500–11,000/sqft","yoy":14.2,"signals":{"infrastructure":85,"population":70,"satellite":78,"rera":72,"employment":92,"priceVelocity":68,"govtScheme":65}},
    "kokapet":            {"name":"Kokapet",           "city":"hyderabad","city_name":"Hyderabad","score":82,"price_range":"₹6,500–9,500/sqft", "yoy":18.5,"signals":{"infrastructure":88,"population":75,"satellite":82,"rera":78,"employment":85,"priceVelocity":80,"govtScheme":72}},
    "narsingi":           {"name":"Narsingi",          "city":"hyderabad","city_name":"Hyderabad","score":76,"price_range":"₹5,500–8,000/sqft", "yoy":15.3,"signals":{"infrastructure":78,"population":72,"satellite":76,"rera":70,"employment":75,"priceVelocity":72,"govtScheme":68}},
    "adibatla":           {"name":"Adibatla",          "city":"hyderabad","city_name":"Hyderabad","score":88,"price_range":"₹3,800–5,500/sqft", "yoy":22.1,"signals":{"infrastructure":90,"population":80,"satellite":88,"rera":82,"employment":88,"priceVelocity":85,"govtScheme":90}},
    "tukkuguda":          {"name":"Tukkuguda",         "city":"hyderabad","city_name":"Hyderabad","score":84,"price_range":"₹3,200–4,800/sqft", "yoy":20.8,"signals":{"infrastructure":85,"population":78,"satellite":84,"rera":80,"employment":82,"priceVelocity":82,"govtScheme":85}},
    "shadnagar":          {"name":"Shadnagar",         "city":"hyderabad","city_name":"Hyderabad","score":79,"price_range":"₹2,800–4,200/sqft", "yoy":17.6,"signals":{"infrastructure":80,"population":75,"satellite":79,"rera":75,"employment":75,"priceVelocity":75,"govtScheme":80}},
    "mokila":             {"name":"Mokila",            "city":"hyderabad","city_name":"Hyderabad","score":74,"price_range":"₹3,500–5,000/sqft", "yoy":14.0,"signals":{"infrastructure":75,"population":70,"satellite":74,"rera":68,"employment":70,"priceVelocity":70,"govtScheme":72}},
    "tellapur":           {"name":"Tellapur",          "city":"hyderabad","city_name":"Hyderabad","score":72,"price_range":"₹4,200–6,500/sqft", "yoy":13.5,"signals":{"infrastructure":74,"population":68,"satellite":72,"rera":68,"employment":72,"priceVelocity":68,"govtScheme":68}},
    "shankarpally":       {"name":"Shankarpally",      "city":"hyderabad","city_name":"Hyderabad","score":78,"price_range":"₹3,200–4,800/sqft", "yoy":16.9,"signals":{"infrastructure":78,"population":72,"satellite":78,"rera":72,"employment":72,"priceVelocity":72,"govtScheme":78}},
    "ghatkesar":          {"name":"Ghatkesar",         "city":"hyderabad","city_name":"Hyderabad","score":71,"price_range":"₹3,000–4,500/sqft", "yoy":13.2,"signals":{"infrastructure":72,"population":68,"satellite":71,"rera":65,"employment":68,"priceVelocity":65,"govtScheme":68}},
    "kompally":           {"name":"Kompally",          "city":"hyderabad","city_name":"Hyderabad","score":68,"price_range":"₹3,800–5,500/sqft", "yoy":11.5,"signals":{"infrastructure":70,"population":65,"satellite":68,"rera":62,"employment":65,"priceVelocity":62,"govtScheme":65}},
    "medchal":            {"name":"Medchal",           "city":"hyderabad","city_name":"Hyderabad","score":68,"price_range":"₹3,200–5,000/sqft", "yoy":12.8,"signals":{"infrastructure":70,"population":65,"satellite":68,"rera":65,"employment":65,"priceVelocity":65,"govtScheme":70}},
    "shamshabad":         {"name":"Shamshabad",        "city":"hyderabad","city_name":"Hyderabad","score":66,"price_range":"₹2,800–4,200/sqft", "yoy":12.0,"signals":{"infrastructure":68,"population":62,"satellite":66,"rera":62,"employment":65,"priceVelocity":62,"govtScheme":65}},
    "ameenpur":           {"name":"Ameenpur",          "city":"hyderabad","city_name":"Hyderabad","score":75,"price_range":"₹3,500–5,200/sqft", "yoy":15.8,"signals":{"infrastructure":76,"population":72,"satellite":75,"rera":70,"employment":72,"priceVelocity":72,"govtScheme":75}},
    # ── Bangalore ─────────────────────────────────────────────────────────────
    "whitefield":         {"name":"Whitefield",        "city":"bangalore","city_name":"Bangalore","score":82,"price_range":"₹7,000–11,000/sqft","yoy":16.5,"signals":{"infrastructure":85,"population":78,"satellite":82,"rera":80,"employment":90,"priceVelocity":78,"govtScheme":68}},
    "sarjapur-road":      {"name":"Sarjapur Road",     "city":"bangalore","city_name":"Bangalore","score":79,"price_range":"₹6,500–10,000/sqft","yoy":15.2,"signals":{"infrastructure":80,"population":75,"satellite":79,"rera":76,"employment":85,"priceVelocity":76,"govtScheme":65}},
    "electronic-city":    {"name":"Electronic City",   "city":"bangalore","city_name":"Bangalore","score":75,"price_range":"₹5,500–8,500/sqft", "yoy":13.8,"signals":{"infrastructure":76,"population":72,"satellite":75,"rera":72,"employment":88,"priceVelocity":68,"govtScheme":62}},
    "devanahalli":        {"name":"Devanahalli",       "city":"bangalore","city_name":"Bangalore","score":86,"price_range":"₹4,500–7,000/sqft", "yoy":21.5,"signals":{"infrastructure":88,"population":78,"satellite":86,"rera":82,"employment":80,"priceVelocity":85,"govtScheme":90}},
    # ── Mumbai ────────────────────────────────────────────────────────────────
    "bandra-kurla-complex":{"name":"Bandra Kurla Complex","city":"mumbai","city_name":"Mumbai","score":85,"price_range":"₹25,000–45,000/sqft","yoy":12.5,"signals":{"infrastructure":92,"population":75,"satellite":85,"rera":88,"employment":95,"priceVelocity":75,"govtScheme":70}},
    "powai":              {"name":"Powai",              "city":"mumbai","city_name":"Mumbai","score":80,"price_range":"₹18,000–28,000/sqft","yoy":11.8,"signals":{"infrastructure":85,"population":72,"satellite":80,"rera":82,"employment":88,"priceVelocity":72,"govtScheme":65}},
    "navi-mumbai":        {"name":"Navi Mumbai",        "city":"mumbai","city_name":"Mumbai","score":78,"price_range":"₹8,500–14,000/sqft","yoy":14.5,"signals":{"infrastructure":80,"population":76,"satellite":78,"rera":78,"employment":75,"priceVelocity":78,"govtScheme":80}},
    "thane":              {"name":"Thane",              "city":"mumbai","city_name":"Mumbai","score":76,"price_range":"₹9,000–15,000/sqft","yoy":13.2,"signals":{"infrastructure":78,"population":74,"satellite":76,"rera":75,"employment":72,"priceVelocity":74,"govtScheme":76}},
    # ── Chennai ───────────────────────────────────────────────────────────────
    "omr":                {"name":"OMR (Old Mahabalipuram Road)","city":"chennai","city_name":"Chennai","score":80,"price_range":"₹5,500–9,000/sqft","yoy":14.8,"signals":{"infrastructure":82,"population":75,"satellite":80,"rera":78,"employment":88,"priceVelocity":75,"govtScheme":70}},
    "sriperumbudur":      {"name":"Sriperumbudur",     "city":"chennai","city_name":"Chennai","score":84,"price_range":"₹2,800–4,500/sqft","yoy":19.5,"signals":{"infrastructure":85,"population":78,"satellite":84,"rera":80,"employment":88,"priceVelocity":82,"govtScheme":88}},
    # ── Pune ──────────────────────────────────────────────────────────────────
    "hinjewadi":          {"name":"Hinjewadi",         "city":"pune","city_name":"Pune","score":83,"price_range":"₹6,500–10,500/sqft","yoy":17.2,"signals":{"infrastructure":85,"population":76,"satellite":83,"rera":80,"employment":92,"priceVelocity":80,"govtScheme":72}},
    "kharadi":            {"name":"Kharadi",           "city":"pune","city_name":"Pune","score":79,"price_range":"₹7,000–11,000/sqft","yoy":15.5,"signals":{"infrastructure":80,"population":74,"satellite":79,"rera":76,"employment":85,"priceVelocity":76,"govtScheme":68}},
    # ── Delhi NCR ─────────────────────────────────────────────────────────────
    "dwarka-expressway":  {"name":"Dwarka Expressway", "city":"delhi","city_name":"Delhi NCR","score":84,"price_range":"₹6,500–10,000/sqft","yoy":19.8,"signals":{"infrastructure":88,"population":78,"satellite":84,"rera":80,"employment":78,"priceVelocity":85,"govtScheme":85}},
    "noida-sector-150":   {"name":"Noida Sector 150",  "city":"delhi","city_name":"Delhi NCR","score":82,"price_range":"₹5,800–9,000/sqft","yoy":17.5,"signals":{"infrastructure":85,"population":76,"satellite":82,"rera":80,"employment":78,"priceVelocity":80,"govtScheme":82}},
    "greater-noida-west": {"name":"Greater Noida West","city":"delhi","city_name":"Delhi NCR","score":78,"price_range":"₹4,500–7,000/sqft","yoy":15.8,"signals":{"infrastructure":80,"population":74,"satellite":78,"rera":76,"employment":72,"priceVelocity":76,"govtScheme":80}},
    "gurugram":           {"name":"Gurugram",          "city":"delhi","city_name":"Delhi NCR","score":80,"price_range":"₹8,500–14,000/sqft","yoy":14.2,"signals":{"infrastructure":85,"population":72,"satellite":80,"rera":78,"employment":90,"priceVelocity":72,"govtScheme":68}},
}

router = APIRouter()


@router.get("/{city_slug}/{area_slug}")
async def get_verdict(city_slug: str, area_slug: str):
    """AI-generated investment verdict for an area."""
    area = AREA_DATA.get(area_slug)
    if not area:
        raise HTTPException(status_code=404, detail=f"Area '{area_slug}' not found")
    if area["city"] != city_slug:
        raise HTTPException(status_code=404, detail=f"Area '{area_slug}' not in city '{city_slug}'")

    # Fetch recent news titles to ground the verdict
    news_items = await fetch_news_for_area(city_slug, area_slug)
    recent_news = [i.title for i in news_items[:5]]

    from app.services import verdict_service
    verdict = await verdict_service.get_verdict(
        city_slug=city_slug,
        area_slug=area_slug,
        area_name=area["name"],
        city_name=area["city_name"],
        signals=area["signals"],
        score=area["score"],
        price_range=area["price_range"],
        yoy=area["yoy"],
        recent_news=recent_news,
    )

    return {
        "city":         city_slug,
        "area":         area_slug,
        "area_name":    area["name"],
        "verdict":      verdict.verdict,
        "confidence":   verdict.confidence,
        "summary":      verdict.summary,
        "reasons":      verdict.reasons,
        "risks":        verdict.risks,
        "suitable_for": verdict.suitable_for,
        "last_updated": verdict.last_updated,
        "source":       verdict.source,
    }
