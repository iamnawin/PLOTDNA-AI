from fastapi import APIRouter, HTTPException, Query

from app.services.news_aggregator import fetch_news_for_area
from app.services.verdict_service import FallbackContext, get_verdict


AREA_DATA: dict[str, dict] = {
    "financial-district": {"name": "Financial District", "city": "hyderabad", "city_name": "Hyderabad", "score": 78, "price_range": "Rs7,500-11,000/sqft", "yoy": 14.2, "signals": {"infrastructure": 85, "population": 70, "satellite": 78, "rera": 72, "employment": 92, "priceVelocity": 68, "govtScheme": 65}},
    "kokapet": {"name": "Kokapet", "city": "hyderabad", "city_name": "Hyderabad", "score": 82, "price_range": "Rs6,500-9,500/sqft", "yoy": 18.5, "signals": {"infrastructure": 88, "population": 75, "satellite": 82, "rera": 78, "employment": 85, "priceVelocity": 80, "govtScheme": 72}},
    "narsingi": {"name": "Narsingi", "city": "hyderabad", "city_name": "Hyderabad", "score": 76, "price_range": "Rs5,500-8,000/sqft", "yoy": 15.3, "signals": {"infrastructure": 78, "population": 72, "satellite": 76, "rera": 70, "employment": 75, "priceVelocity": 72, "govtScheme": 68}},
    "adibatla": {"name": "Adibatla", "city": "hyderabad", "city_name": "Hyderabad", "score": 88, "price_range": "Rs3,800-5,500/sqft", "yoy": 22.1, "signals": {"infrastructure": 90, "population": 80, "satellite": 88, "rera": 82, "employment": 88, "priceVelocity": 85, "govtScheme": 90}},
    "tukkuguda": {"name": "Tukkuguda", "city": "hyderabad", "city_name": "Hyderabad", "score": 84, "price_range": "Rs3,200-4,800/sqft", "yoy": 20.8, "signals": {"infrastructure": 85, "population": 78, "satellite": 84, "rera": 80, "employment": 82, "priceVelocity": 82, "govtScheme": 85}},
    "shadnagar": {"name": "Shadnagar", "city": "hyderabad", "city_name": "Hyderabad", "score": 79, "price_range": "Rs2,800-4,200/sqft", "yoy": 17.6, "signals": {"infrastructure": 80, "population": 75, "satellite": 79, "rera": 75, "employment": 75, "priceVelocity": 75, "govtScheme": 80}},
    "mokila": {"name": "Mokila", "city": "hyderabad", "city_name": "Hyderabad", "score": 74, "price_range": "Rs3,500-5,000/sqft", "yoy": 14.0, "signals": {"infrastructure": 75, "population": 70, "satellite": 74, "rera": 68, "employment": 70, "priceVelocity": 70, "govtScheme": 72}},
    "tellapur": {"name": "Tellapur", "city": "hyderabad", "city_name": "Hyderabad", "score": 72, "price_range": "Rs4,200-6,500/sqft", "yoy": 13.5, "signals": {"infrastructure": 74, "population": 68, "satellite": 72, "rera": 68, "employment": 72, "priceVelocity": 68, "govtScheme": 68}},
    "shankarpally": {"name": "Shankarpally", "city": "hyderabad", "city_name": "Hyderabad", "score": 78, "price_range": "Rs3,200-4,800/sqft", "yoy": 16.9, "signals": {"infrastructure": 78, "population": 72, "satellite": 78, "rera": 72, "employment": 72, "priceVelocity": 72, "govtScheme": 78}},
    "ghatkesar": {"name": "Ghatkesar", "city": "hyderabad", "city_name": "Hyderabad", "score": 71, "price_range": "Rs3,000-4,500/sqft", "yoy": 13.2, "signals": {"infrastructure": 72, "population": 68, "satellite": 71, "rera": 65, "employment": 68, "priceVelocity": 65, "govtScheme": 68}},
    "kompally": {"name": "Kompally", "city": "hyderabad", "city_name": "Hyderabad", "score": 68, "price_range": "Rs3,800-5,500/sqft", "yoy": 11.5, "signals": {"infrastructure": 70, "population": 65, "satellite": 68, "rera": 62, "employment": 65, "priceVelocity": 62, "govtScheme": 65}},
    "medchal": {"name": "Medchal", "city": "hyderabad", "city_name": "Hyderabad", "score": 68, "price_range": "Rs3,200-5,000/sqft", "yoy": 12.8, "signals": {"infrastructure": 70, "population": 65, "satellite": 68, "rera": 65, "employment": 65, "priceVelocity": 65, "govtScheme": 70}},
    "shamshabad": {"name": "Shamshabad", "city": "hyderabad", "city_name": "Hyderabad", "score": 66, "price_range": "Rs2,800-4,200/sqft", "yoy": 12.0, "signals": {"infrastructure": 68, "population": 62, "satellite": 66, "rera": 62, "employment": 65, "priceVelocity": 62, "govtScheme": 65}},
    "ameenpur": {"name": "Ameenpur", "city": "hyderabad", "city_name": "Hyderabad", "score": 75, "price_range": "Rs3,500-5,200/sqft", "yoy": 15.8, "signals": {"infrastructure": 76, "population": 72, "satellite": 75, "rera": 70, "employment": 72, "priceVelocity": 72, "govtScheme": 75}},
    "whitefield": {"name": "Whitefield", "city": "bangalore", "city_name": "Bangalore", "score": 82, "price_range": "Rs7,000-11,000/sqft", "yoy": 16.5, "signals": {"infrastructure": 85, "population": 78, "satellite": 82, "rera": 80, "employment": 90, "priceVelocity": 78, "govtScheme": 68}},
    "sarjapur-road": {"name": "Sarjapur Road", "city": "bangalore", "city_name": "Bangalore", "score": 79, "price_range": "Rs6,500-10,000/sqft", "yoy": 15.2, "signals": {"infrastructure": 80, "population": 75, "satellite": 79, "rera": 76, "employment": 85, "priceVelocity": 76, "govtScheme": 65}},
    "electronic-city": {"name": "Electronic City", "city": "bangalore", "city_name": "Bangalore", "score": 75, "price_range": "Rs5,500-8,500/sqft", "yoy": 13.8, "signals": {"infrastructure": 76, "population": 72, "satellite": 75, "rera": 72, "employment": 88, "priceVelocity": 68, "govtScheme": 62}},
    "devanahalli": {"name": "Devanahalli", "city": "bangalore", "city_name": "Bangalore", "score": 86, "price_range": "Rs4,500-7,000/sqft", "yoy": 21.5, "signals": {"infrastructure": 88, "population": 78, "satellite": 86, "rera": 82, "employment": 80, "priceVelocity": 85, "govtScheme": 90}},
    "bandra-kurla-complex": {"name": "Bandra Kurla Complex", "city": "mumbai", "city_name": "Mumbai", "score": 85, "price_range": "Rs25,000-45,000/sqft", "yoy": 12.5, "signals": {"infrastructure": 92, "population": 75, "satellite": 85, "rera": 88, "employment": 95, "priceVelocity": 75, "govtScheme": 70}},
    "powai": {"name": "Powai", "city": "mumbai", "city_name": "Mumbai", "score": 80, "price_range": "Rs18,000-28,000/sqft", "yoy": 11.8, "signals": {"infrastructure": 85, "population": 72, "satellite": 80, "rera": 82, "employment": 88, "priceVelocity": 72, "govtScheme": 65}},
    "navi-mumbai": {"name": "Navi Mumbai", "city": "mumbai", "city_name": "Mumbai", "score": 78, "price_range": "Rs8,500-14,000/sqft", "yoy": 14.5, "signals": {"infrastructure": 80, "population": 76, "satellite": 78, "rera": 78, "employment": 75, "priceVelocity": 78, "govtScheme": 80}},
    "thane": {"name": "Thane", "city": "mumbai", "city_name": "Mumbai", "score": 76, "price_range": "Rs9,000-15,000/sqft", "yoy": 13.2, "signals": {"infrastructure": 78, "population": 74, "satellite": 76, "rera": 75, "employment": 72, "priceVelocity": 74, "govtScheme": 76}},
    "omr": {"name": "OMR (Old Mahabalipuram Road)", "city": "chennai", "city_name": "Chennai", "score": 80, "price_range": "Rs5,500-9,000/sqft", "yoy": 14.8, "signals": {"infrastructure": 82, "population": 75, "satellite": 80, "rera": 78, "employment": 88, "priceVelocity": 75, "govtScheme": 70}},
    "sriperumbudur": {"name": "Sriperumbudur", "city": "chennai", "city_name": "Chennai", "score": 84, "price_range": "Rs2,800-4,500/sqft", "yoy": 19.5, "signals": {"infrastructure": 85, "population": 78, "satellite": 84, "rera": 80, "employment": 88, "priceVelocity": 82, "govtScheme": 88}},
    "hinjewadi": {"name": "Hinjewadi", "city": "pune", "city_name": "Pune", "score": 83, "price_range": "Rs6,500-10,500/sqft", "yoy": 17.2, "signals": {"infrastructure": 85, "population": 76, "satellite": 83, "rera": 80, "employment": 92, "priceVelocity": 80, "govtScheme": 72}},
    "kharadi": {"name": "Kharadi", "city": "pune", "city_name": "Pune", "score": 79, "price_range": "Rs7,000-11,000/sqft", "yoy": 15.5, "signals": {"infrastructure": 80, "population": 74, "satellite": 79, "rera": 76, "employment": 85, "priceVelocity": 76, "govtScheme": 68}},
    "dwarka-expressway": {"name": "Dwarka Expressway", "city": "delhi", "city_name": "Delhi NCR", "score": 84, "price_range": "Rs6,500-10,000/sqft", "yoy": 19.8, "signals": {"infrastructure": 88, "population": 78, "satellite": 84, "rera": 80, "employment": 78, "priceVelocity": 85, "govtScheme": 85}},
    "noida-sector-150": {"name": "Noida Sector 150", "city": "delhi", "city_name": "Delhi NCR", "score": 82, "price_range": "Rs5,800-9,000/sqft", "yoy": 17.5, "signals": {"infrastructure": 85, "population": 76, "satellite": 82, "rera": 80, "employment": 78, "priceVelocity": 80, "govtScheme": 82}},
    "greater-noida-west": {"name": "Greater Noida West", "city": "delhi", "city_name": "Delhi NCR", "score": 78, "price_range": "Rs4,500-7,000/sqft", "yoy": 15.8, "signals": {"infrastructure": 80, "population": 74, "satellite": 78, "rera": 76, "employment": 72, "priceVelocity": 76, "govtScheme": 80}},
    "gurugram": {"name": "Gurugram", "city": "delhi", "city_name": "Delhi NCR", "score": 80, "price_range": "Rs8,500-14,000/sqft", "yoy": 14.2, "signals": {"infrastructure": 85, "population": 72, "satellite": 80, "rera": 78, "employment": 90, "priceVelocity": 72, "govtScheme": 68}},
}

HYDERABAD_AREA_OVERRIDES: dict[str, dict] = {
    "financial-district": {"name": "Financial District", "city": "hyderabad", "city_name": "Hyderabad", "score": 62, "price_range": "Rs8,500-12,000/sqft", "yoy": 8.0, "signals": {"infrastructure": 65, "population": 55, "satellite": 60, "rera": 70, "employment": 85, "priceVelocity": 55, "govtScheme": 45}},
    "kokapet": {"name": "Kokapet", "city": "hyderabad", "city_name": "Hyderabad", "score": 81, "price_range": "Rs6,000-9,500/sqft", "yoy": 22.0, "signals": {"infrastructure": 88, "population": 82, "satellite": 85, "rera": 78, "employment": 80, "priceVelocity": 70, "govtScheme": 68}},
    "narsingi": {"name": "Narsingi", "city": "hyderabad", "city_name": "Hyderabad", "score": 76, "price_range": "Rs5,200-7,800/sqft", "yoy": 18.0, "signals": {"infrastructure": 80, "population": 75, "satellite": 78, "rera": 72, "employment": 75, "priceVelocity": 68, "govtScheme": 62}},
    "adibatla": {"name": "Adibatla", "city": "hyderabad", "city_name": "Hyderabad", "score": 88, "price_range": "Rs3,500-5,200/sqft", "yoy": 35.0, "signals": {"infrastructure": 92, "population": 85, "satellite": 90, "rera": 82, "employment": 95, "priceVelocity": 88, "govtScheme": 95}},
    "tukkuguda": {"name": "Tukkuguda", "city": "hyderabad", "city_name": "Hyderabad", "score": 84, "price_range": "Rs3,200-4,800/sqft", "yoy": 30.0, "signals": {"infrastructure": 88, "population": 82, "satellite": 86, "rera": 80, "employment": 85, "priceVelocity": 80, "govtScheme": 88}},
    "shadnagar": {"name": "Shadnagar", "city": "hyderabad", "city_name": "Hyderabad", "score": 79, "price_range": "Rs2,800-4,200/sqft", "yoy": 25.0, "signals": {"infrastructure": 82, "population": 75, "satellite": 80, "rera": 75, "employment": 78, "priceVelocity": 72, "govtScheme": 82}},
    "mokila": {"name": "Mokila", "city": "hyderabad", "city_name": "Hyderabad", "score": 74, "price_range": "Rs3,800-5,500/sqft", "yoy": 20.0, "signals": {"infrastructure": 80, "population": 72, "satellite": 76, "rera": 70, "employment": 74, "priceVelocity": 67, "govtScheme": 62}},
    "tellapur": {"name": "Tellapur", "city": "hyderabad", "city_name": "Hyderabad", "score": 72, "price_range": "Rs4,200-6,500/sqft", "yoy": 19.0, "signals": {"infrastructure": 76, "population": 70, "satellite": 72, "rera": 68, "employment": 72, "priceVelocity": 65, "govtScheme": 58}},
    "shankarpally": {"name": "Shankarpally", "city": "hyderabad", "city_name": "Hyderabad", "score": 78, "price_range": "Rs3,200-5,000/sqft", "yoy": 22.0, "signals": {"infrastructure": 82, "population": 75, "satellite": 80, "rera": 72, "employment": 76, "priceVelocity": 70, "govtScheme": 80}},
    "ghatkesar": {"name": "Ghatkesar", "city": "hyderabad", "city_name": "Hyderabad", "score": 71, "price_range": "Rs2,600-3,800/sqft", "yoy": 17.0, "signals": {"infrastructure": 74, "population": 68, "satellite": 72, "rera": 68, "employment": 70, "priceVelocity": 62, "govtScheme": 65}},
    "kompally": {"name": "Kompally", "city": "hyderabad", "city_name": "Hyderabad", "score": 55, "price_range": "Rs4,500-7,000/sqft", "yoy": 8.0, "signals": {"infrastructure": 58, "population": 52, "satellite": 55, "rera": 58, "employment": 55, "priceVelocity": 48, "govtScheme": 42}},
    "medchal": {"name": "Medchal", "city": "hyderabad", "city_name": "Hyderabad", "score": 68, "price_range": "Rs3,800-5,500/sqft", "yoy": 15.0, "signals": {"infrastructure": 72, "population": 65, "satellite": 70, "rera": 65, "employment": 65, "priceVelocity": 60, "govtScheme": 65}},
    "shamshabad": {"name": "Shamshabad", "city": "hyderabad", "city_name": "Hyderabad", "score": 66, "price_range": "Rs3,500-5,200/sqft", "yoy": 14.0, "signals": {"infrastructure": 70, "population": 62, "satellite": 68, "rera": 62, "employment": 65, "priceVelocity": 58, "govtScheme": 62}},
    "ameenpur": {"name": "Ameenpur", "city": "hyderabad", "city_name": "Hyderabad", "score": 75, "price_range": "Rs3,600-5,500/sqft", "yoy": 20.0, "signals": {"infrastructure": 78, "population": 72, "satellite": 76, "rera": 72, "employment": 74, "priceVelocity": 68, "govtScheme": 72}},
    "bibinagar": {"name": "Bibinagar", "city": "hyderabad", "city_name": "Hyderabad", "score": 73, "price_range": "Rs2,400-3,800/sqft", "yoy": 18.0, "signals": {"infrastructure": 76, "population": 70, "satellite": 74, "rera": 70, "employment": 72, "priceVelocity": 65, "govtScheme": 72}},
    "yacharam": {"name": "Yacharam", "city": "hyderabad", "city_name": "Hyderabad", "score": 69, "price_range": "Rs2,200-3,500/sqft", "yoy": 15.0, "signals": {"infrastructure": 72, "population": 65, "satellite": 70, "rera": 65, "employment": 68, "priceVelocity": 60, "govtScheme": 68}},
    "patancheru": {"name": "Patancheru", "city": "hyderabad", "city_name": "Hyderabad", "score": 61, "price_range": "Rs2,800-4,200/sqft", "yoy": 9.0, "signals": {"infrastructure": 62, "population": 58, "satellite": 62, "rera": 62, "employment": 72, "priceVelocity": 52, "govtScheme": 55}},
    "peerzadiguda": {"name": "Peerzadiguda", "city": "hyderabad", "city_name": "Hyderabad", "score": 70, "price_range": "Rs2,800-4,500/sqft", "yoy": 16.0, "signals": {"infrastructure": 74, "population": 68, "satellite": 71, "rera": 66, "employment": 70, "priceVelocity": 62, "govtScheme": 65}},
    "rajendra-nagar": {"name": "Rajendra Nagar", "city": "hyderabad", "city_name": "Hyderabad", "score": 58, "price_range": "Rs5,500-8,000/sqft", "yoy": 10.0, "signals": {"infrastructure": 60, "population": 55, "satellite": 58, "rera": 60, "employment": 62, "priceVelocity": 52, "govtScheme": 45}},
    "lb-nagar": {"name": "LB Nagar", "city": "hyderabad", "city_name": "Hyderabad", "score": 54, "price_range": "Rs5,000-7,500/sqft", "yoy": 7.0, "signals": {"infrastructure": 56, "population": 52, "satellite": 54, "rera": 56, "employment": 55, "priceVelocity": 48, "govtScheme": 40}},
    "gachibowli": {"name": "Gachibowli", "city": "hyderabad", "city_name": "Hyderabad", "score": 82, "price_range": "Rs7,500-12,000/sqft", "yoy": 14.0, "signals": {"infrastructure": 88, "population": 84, "satellite": 86, "rera": 78, "employment": 95, "priceVelocity": 72, "govtScheme": 70}},
    "madhapur": {"name": "Madhapur", "city": "hyderabad", "city_name": "Hyderabad", "score": 80, "price_range": "Rs7,000-11,500/sqft", "yoy": 12.0, "signals": {"infrastructure": 86, "population": 82, "satellite": 84, "rera": 76, "employment": 92, "priceVelocity": 70, "govtScheme": 68}},
    "kondapur": {"name": "Kondapur", "city": "hyderabad", "city_name": "Hyderabad", "score": 78, "price_range": "Rs6,500-10,000/sqft", "yoy": 11.0, "signals": {"infrastructure": 82, "population": 80, "satellite": 80, "rera": 74, "employment": 85, "priceVelocity": 68, "govtScheme": 62}},
    "kukatpally": {"name": "Kukatpally", "city": "hyderabad", "city_name": "Hyderabad", "score": 75, "price_range": "Rs5,500-8,500/sqft", "yoy": 10.0, "signals": {"infrastructure": 80, "population": 88, "satellite": 76, "rera": 72, "employment": 78, "priceVelocity": 65, "govtScheme": 60}},
    "miyapur": {"name": "Miyapur", "city": "hyderabad", "city_name": "Hyderabad", "score": 70, "price_range": "Rs4,500-7,000/sqft", "yoy": 10.0, "signals": {"infrastructure": 75, "population": 82, "satellite": 72, "rera": 66, "employment": 72, "priceVelocity": 60, "govtScheme": 58}},
    "banjara-hills": {"name": "Banjara Hills", "city": "hyderabad", "city_name": "Hyderabad", "score": 72, "price_range": "Rs8,000-14,000/sqft", "yoy": 8.0, "signals": {"infrastructure": 88, "population": 70, "satellite": 76, "rera": 60, "employment": 72, "priceVelocity": 58, "govtScheme": 50}},
    "jubilee-hills": {"name": "Jubilee Hills", "city": "hyderabad", "city_name": "Hyderabad", "score": 70, "price_range": "Rs10,000-18,000/sqft", "yoy": 7.0, "signals": {"infrastructure": 85, "population": 65, "satellite": 72, "rera": 56, "employment": 68, "priceVelocity": 55, "govtScheme": 48}},
    "manikonda": {"name": "Manikonda", "city": "hyderabad", "city_name": "Hyderabad", "score": 74, "price_range": "Rs5,000-8,000/sqft", "yoy": 12.0, "signals": {"infrastructure": 78, "population": 80, "satellite": 76, "rera": 72, "employment": 80, "priceVelocity": 65, "govtScheme": 58}},
    "somajiguda": {"name": "Somajiguda", "city": "hyderabad", "city_name": "Hyderabad", "score": 58, "price_range": "Rs7,000-11,000/sqft", "yoy": 6.0, "signals": {"infrastructure": 75, "population": 72, "satellite": 60, "rera": 44, "employment": 68, "priceVelocity": 40, "govtScheme": 38}},
    "begumpet": {"name": "Begumpet", "city": "hyderabad", "city_name": "Hyderabad", "score": 55, "price_range": "Rs6,500-10,000/sqft", "yoy": 5.0, "signals": {"infrastructure": 72, "population": 68, "satellite": 58, "rera": 40, "employment": 65, "priceVelocity": 36, "govtScheme": 35}},
    "secunderabad": {"name": "Secunderabad", "city": "hyderabad", "city_name": "Hyderabad", "score": 62, "price_range": "Rs5,000-8,000/sqft", "yoy": 7.0, "signals": {"infrastructure": 76, "population": 74, "satellite": 62, "rera": 52, "employment": 70, "priceVelocity": 44, "govtScheme": 55}},
    "uppal": {"name": "Uppal", "city": "hyderabad", "city_name": "Hyderabad", "score": 68, "price_range": "Rs4,000-6,500/sqft", "yoy": 10.0, "signals": {"infrastructure": 72, "population": 78, "satellite": 68, "rera": 65, "employment": 65, "priceVelocity": 60, "govtScheme": 62}},
}

BANGALORE_AREA_OVERRIDES: dict[str, dict] = {
    "devanahalli": {"name": "Devanahalli", "city": "bangalore", "city_name": "Bangalore", "score": 87, "price_range": "Rs4,500-7,500/sqft", "yoy": 28.0, "signals": {"infrastructure": 88, "population": 65, "satellite": 88, "rera": 80, "employment": 82, "priceVelocity": 90, "govtScheme": 92}},
    "sarjapur-road": {"name": "Sarjapur Road", "city": "bangalore", "city_name": "Bangalore", "score": 84, "price_range": "Rs7,000-10,000/sqft", "yoy": 22.0, "signals": {"infrastructure": 85, "population": 82, "satellite": 78, "rera": 85, "employment": 88, "priceVelocity": 85, "govtScheme": 82}},
    "whitefield": {"name": "Whitefield", "city": "bangalore", "city_name": "Bangalore", "score": 79, "price_range": "Rs7,500-10,500/sqft", "yoy": 18.0, "signals": {"infrastructure": 82, "population": 75, "satellite": 70, "rera": 78, "employment": 92, "priceVelocity": 72, "govtScheme": 68}},
    "electronic-city": {"name": "Electronic City", "city": "bangalore", "city_name": "Bangalore", "score": 76, "price_range": "Rs6,500-9,000/sqft", "yoy": 15.0, "signals": {"infrastructure": 78, "population": 72, "satellite": 68, "rera": 75, "employment": 90, "priceVelocity": 70, "govtScheme": 65}},
    "hebbal": {"name": "Hebbal", "city": "bangalore", "city_name": "Bangalore", "score": 75, "price_range": "Rs8,000-12,000/sqft", "yoy": 16.0, "signals": {"infrastructure": 80, "population": 75, "satellite": 72, "rera": 76, "employment": 80, "priceVelocity": 74, "govtScheme": 72}},
    "hsr-layout": {"name": "HSR Layout", "city": "bangalore", "city_name": "Bangalore", "score": 74, "price_range": "Rs10,000-15,000/sqft", "yoy": 14.0, "signals": {"infrastructure": 78, "population": 72, "satellite": 62, "rera": 75, "employment": 80, "priceVelocity": 70, "govtScheme": 65}},
    "koramangala": {"name": "Koramangala", "city": "bangalore", "city_name": "Bangalore", "score": 72, "price_range": "Rs12,000-18,000/sqft", "yoy": 12.0, "signals": {"infrastructure": 80, "population": 70, "satellite": 60, "rera": 72, "employment": 85, "priceVelocity": 68, "govtScheme": 62}},
    "yelahanka": {"name": "Yelahanka", "city": "bangalore", "city_name": "Bangalore", "score": 71, "price_range": "Rs6,000-9,000/sqft", "yoy": 20.0, "signals": {"infrastructure": 72, "population": 68, "satellite": 75, "rera": 68, "employment": 70, "priceVelocity": 72, "govtScheme": 75}},
}

AREA_DATA.update(HYDERABAD_AREA_OVERRIDES)
AREA_DATA.update(BANGALORE_AREA_OVERRIDES)

router = APIRouter()

VALID_RESOLUTION_TIERS = {
    "exact_locality",
    "nearby_micro_market",
    "city_zone_cluster",
    "uncovered",
}


def _build_fallback_context(
    area_name: str,
    resolution_tier: str | None,
    resolution_label: str | None,
) -> FallbackContext:
    tier = resolution_tier or "exact_locality"
    if tier not in VALID_RESOLUTION_TIERS:
        raise HTTPException(status_code=400, detail=f"Unsupported resolution_tier '{tier}'")

    label = (resolution_label or area_name).strip() or area_name
    return FallbackContext(tier=tier, label=label)


@router.get("/{city_slug}/{area_slug}")
async def get_area_verdict(
    city_slug: str,
    area_slug: str,
    resolution_tier: str | None = Query(default=None),
    resolution_label: str | None = Query(default=None),
):
    """AI-generated investment verdict for a supported area."""
    area = AREA_DATA.get(area_slug)
    if not area:
        raise HTTPException(status_code=404, detail=f"Area '{area_slug}' not found")
    if area["city"] != city_slug:
        raise HTTPException(status_code=404, detail=f"Area '{area_slug}' not in city '{city_slug}'")

    fallback_context = _build_fallback_context(
        area_name=area["name"],
        resolution_tier=resolution_tier,
        resolution_label=resolution_label,
    )

    news_items = await fetch_news_for_area(city_slug, area_slug)
    recent_news = [item.title for item in news_items[:5]]

    verdict = await get_verdict(
        city_slug=city_slug,
        area_slug=area_slug,
        area_name=area["name"],
        city_name=area["city_name"],
        signals=area["signals"],
        score=area["score"],
        price_range=area["price_range"],
        yoy=area["yoy"],
        recent_news=recent_news,
        fallback_context=fallback_context,
    )

    return {
        "city": city_slug,
        "area": area_slug,
        "area_name": area["name"],
        "verdict": verdict.verdict,
        "confidence": verdict.confidence,
        "summary": verdict.summary,
        "reasons": verdict.reasons,
        "risks": verdict.risks,
        "suitable_for": verdict.suitable_for,
        "last_updated": verdict.last_updated,
        "source": verdict.source,
        "resolution_tier": verdict.resolution_tier,
        "resolution_label": verdict.resolution_label,
    }
