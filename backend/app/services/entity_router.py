"""
Entity router — matches news article titles/summaries to city and area slugs.

Pattern inspired by WorldMonitor's entity correlation engine.
Uses a synonym map: area/city name variants → canonical slug.
"""
import re
from app.services.news_aggregator import NewsItem

# ── Synonym maps ──────────────────────────────────────────────────────────────

# area display name variants → area slug
AREA_SYNONYMS: dict[str, str] = {
    # Hyderabad
    "financial district":        "financial-district",
    "nanakramguda":              "financial-district",
    "gachibowli financial":      "financial-district",
    "kokapet":                   "kokapet",
    "narsingi":                  "narsingi",
    "adibatla":                  "adibatla",
    "tukkuguda":                 "tukkuguda",
    "shadnagar":                 "shadnagar",
    "mokila":                    "mokila",
    "tellapur":                  "tellapur",
    "shankarpally":              "shankarpally",
    "ghatkesar":                 "ghatkesar",
    "yacharam":                  "yacharam",
    "bibinagar":                 "bibinagar",
    "rajendra nagar":            "rajendra-nagar",
    "kompally":                  "kompally",
    "medchal":                   "medchal",
    "shamshabad":                "shamshabad",
    "patancheru":                "patancheru",
    "peerzadiguda":              "peerzadiguda",
    "ameenpur":                  "ameenpur",
    "lb nagar":                  "lb-nagar",
    "gachibowli":                "gachibowli",
    "hitech city":               "hitech-city",
    "hitec city":                "hitech-city",
    "kondapur":                  "kondapur",
    "manikonda":                 "manikonda",
    "puppalaguda":               "puppalaguda",
    "nallagandla":               "nallagandla",
    "bachupally":                "bachupally",
    "nizampet":                  "nizampet",
    "kukatpally":                "kukatpally",
    "banjara hills":             "banjara-hills",
    "jubilee hills":             "jubilee-hills",
    "madhapur":                  "madhapur",
    "miyapur":                   "miyapur",
    "chandanagar":               "chandanagar",
    "serilingampally":           "serilingampally",
    # Bangalore
    "whitefield":                "whitefield",
    "sarjapur road":             "sarjapur-road",
    "sarjapur":                  "sarjapur-road",
    "electronic city":           "electronic-city",
    "hebbal":                    "hebbal",
    "yelahanka":                 "yelahanka",
    "devanahalli":               "devanahalli",
    "hsr layout":                "hsr-layout",
    "koramangala":               "koramangala",
    "indiranagar":               "indiranagar",
    "marathahalli":              "marathahalli",
    "jp nagar":                  "jp-nagar",
    "bannerghatta":              "bannerghatta-road",
    "kanakapura":                "kanakapura-road",
    "tumkur road":               "tumkur-road",
    "thanisandra":               "thanisandra",
    "kr puram":                  "kr-puram",
    "bagalur":                   "bagalur",
    "hosur road":                "hosur-road",
    # Mumbai
    "bkc":                       "bandra-kurla-complex",
    "bandra kurla complex":      "bandra-kurla-complex",
    "powai":                     "powai",
    "andheri":                   "andheri-west",
    "andheri west":              "andheri-west",
    "thane":                     "thane",
    "navi mumbai":               "navi-mumbai",
    "kharghar":                  "kharghar",
    "panvel":                    "panvel",
    "dombivli":                  "dombivli",
    "kalyan":                    "kalyan",
    "goregaon":                  "goregaon",
    "malad":                     "malad",
    "borivali":                  "borivali",
    "mira road":                 "mira-road",
    "vasai":                     "vasai-virar",
    "virar":                     "vasai-virar",
    "airoli":                    "airoli",
    "ghansoli":                  "ghansoli",
    # Chennai
    "old mahabalipuram road":    "omr",
    "omr":                       "omr",
    "sholinganallur":            "sholinganallur",
    "perungudi":                 "perungudi",
    "siruseri":                  "siruseri",
    "kelambakkam":               "kelambakkam",
    "tambaram":                  "tambaram",
    "pallavaram":                "pallavaram",
    "guduvanchery":              "guduvanchery",
    "poonamallee":               "poonamallee",
    "porur":                     "porur",
    "mogappair":                 "mogappair",
    "ambattur":                  "ambattur",
    "madhavaram":                "madhavaram",
    "perambur":                  "perambur",
    "avadi":                     "avadi",
    "sriperumbudur":             "sriperumbudur",
    # Pune
    "hinjewadi":                 "hinjewadi",
    "wakad":                     "wakad",
    "baner":                     "baner",
    "balewadi":                  "balewadi",
    "kharadi":                   "kharadi",
    "viman nagar":               "viman-nagar",
    "undri":                     "undri",
    "hadapsar":                  "hadapsar",
    "wagholi":                   "wagholi",
    "nibm":                      "nibm",
    "kondhwa":                   "kondhwa",
    "talegaon":                  "talegaon",
    "chakan":                    "chakan",
    "alandi":                    "alandi",
    "khed shivapur":             "khed-shivapur",
    # Delhi NCR
    "dwarka expressway":         "dwarka-expressway",
    "gurgaon":                   "gurugram",
    "gurugram":                  "gurugram",
    "cyber city":                "gurugram",
    "noida":                     "noida-sector-150",
    "noida sector 150":          "noida-sector-150",
    "greater noida":             "greater-noida-west",
    "greater noida west":        "greater-noida-west",
    "yamuna expressway":         "yamuna-expressway",
    "faridabad":                 "faridabad",
    "sohna road":                "sohna-road",
    "golf course extension":     "golf-course-ext-road",
    "new gurgaon":               "new-gurgaon",
    "kundli manesar palwal":     "kundli-manesar-palwal",
}

# city display name variants → city slug
CITY_SYNONYMS: dict[str, str] = {
    "hyderabad":     "hyderabad",
    "telangana":     "hyderabad",
    "hyd":           "hyderabad",
    "tsrera":        "hyderabad",
    "hmda":          "hyderabad",
    "bangalore":     "bangalore",
    "bengaluru":     "bangalore",
    "blr":           "bangalore",
    "karnataka":     "bangalore",
    "k-rera":        "bangalore",
    "mumbai":        "mumbai",
    "bombay":        "mumbai",
    "maharashtra":   "mumbai",
    "maha rera":     "mumbai",
    "mahacera":      "mumbai",
    "chennai":       "chennai",
    "madras":        "chennai",
    "tamil nadu":    "chennai",
    "tnrera":        "chennai",
    "pune":          "pune",
    "pcmc":          "pune",
    "pimpri":        "pune",
    "chinchwad":     "pune",
    "delhi":         "delhi",
    "ncr":           "delhi",
    "noida":         "delhi",
    "gurgaon":       "delhi",
    "gurugram":      "delhi",
    "faridabad":     "delhi",
    "ghaziabad":     "delhi",
    "haryana":       "delhi",
    "hrera":         "delhi",
}

# Pre-compile regex patterns once at import time
_AREA_PATTERNS: list[tuple[re.Pattern, str]] = [
    (re.compile(r"\b" + re.escape(synonym) + r"\b", re.IGNORECASE), slug)
    for synonym, slug in sorted(AREA_SYNONYMS.items(), key=lambda x: -len(x[0]))
]
_CITY_PATTERNS: list[tuple[re.Pattern, str]] = [
    (re.compile(r"\b" + re.escape(synonym) + r"\b", re.IGNORECASE), slug)
    for synonym, slug in sorted(CITY_SYNONYMS.items(), key=lambda x: -len(x[0]))
]


def _extract_from_text(text: str) -> tuple[list[str], list[str]]:
    """Return (area_slugs, city_slugs) found in text."""
    area_slugs: list[str] = []
    city_slugs: list[str] = []

    for pattern, slug in _AREA_PATTERNS:
        if pattern.search(text):
            if slug not in area_slugs:
                area_slugs.append(slug)

    for pattern, slug in _CITY_PATTERNS:
        if pattern.search(text):
            if slug not in city_slugs:
                city_slugs.append(slug)

    return area_slugs, city_slugs


def route_items(items: list[NewsItem]) -> list[NewsItem]:
    """
    In-place: update city_slugs and area_slugs on each item
    by scanning title + summary for known entity names.
    Returns the same list (mutated).
    """
    for item in items:
        search_text = f"{item.title} {item.summary}"
        area_slugs, city_slugs = _extract_from_text(search_text)

        # Merge with any city slugs already set by feed config
        for s in city_slugs:
            if s not in item.city_slugs:
                item.city_slugs.append(s)
        item.area_slugs = area_slugs

    return items
