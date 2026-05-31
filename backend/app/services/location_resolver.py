"""
Location Resolver Service:
Migrates coordinate containment and priority tier resolution logic to the FastAPI backend.
Handles exact matches, nearby micro-markets, city zone clusters, and regional Telangana/India fallbacks.
"""
import json
import math
import os
import re
from typing import TypedDict, List, Dict, Tuple, Optional


def load_json_file(path: str):
    with open(path, "r", encoding="utf-8-sig") as f:
        return json.load(f)

# ── Haversine Distance Helper ──────────────────────────────────────────────────
def dist_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    r = 6371.0
    to_rad = lambda d: d * math.pi / 180.0
    d_lat = to_rad(lat2 - lat1)
    d_lng = to_rad(lng2 - lng1)
    a = (math.sin(d_lat / 2.0) ** 2 +
         math.cos(to_rad(lat1)) * math.cos(to_rad(lat2)) * math.sin(d_lng / 2.0) ** 2)
    return r * 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))

# ── Text Normalization Helper ─────────────────────────────────────────────────
def normalize_place_name(value: str) -> str:
    if not value:
        return ""
    val = value.lower()
    val = val.replace("&", " and ")
    val = re.sub(r"\([^)]*\)", " ", val)
    val = re.sub(r"[^a-z0-9]+", " ", val)
    val = re.sub(r"\s+", " ", val)
    return val.strip()

# ── Ray-Casting Containment Check (Cartesian Lat, Lng Order) ──────────────────
def point_in_polygon(lat: float, lng: float, polygon: List[Tuple[float, float]]) -> bool:
    """
    Ray-casting containment check using exactly the same logic as the frontend.
    Handles Cartesian [lat, lng] array structure.
    """
    inside = False
    n = len(polygon)
    if n < 3:
        return False
    
    j = n - 1
    for i in range(n):
        lat_i, lng_i = polygon[i]
        lat_j, lng_j = polygon[j]
        
        # Ray casting
        intersects = ((lng_i > lng) != (lng_j > lng)) and \
                     (lat < ((lat_j - lat_i) * (lng - lng_i)) / ((lng_j - lng_i) or 1e-9) + lat_i)
        if intersects:
            inside = not inside
        j = i
    return inside

# ── Data Types for Resolver ──────────────────────────────────────────────────
class LocalityResolution(TypedDict):
    tier: str
    citySlug: Optional[str]
    localitySlug: Optional[str]
    localityName: Optional[str]
    clusterId: Optional[str]
    districtSlug: Optional[str]
    districtName: Optional[str]
    stateSlug: Optional[str]
    distanceKm: Optional[float]
    matchedBy: str
    reason: str

# ── Resolver Store ───────────────────────────────────────────────────────────
class LocationResolverStore:
    def __init__(self):
        self.data_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "data"))
        self.telangana_bounds = {"latMin": 15.8, "latMax": 19.95, "lngMin": 77.0, "lngMax": 81.4}
        
        # Load datasets
        self.districts: List[dict] = []
        self.regions: List[dict] = []
        self.cities: Dict[str, dict] = {}
        
        self.load_districts_and_regions()
        self.load_cities_data()

    def load_districts_and_regions(self):
        districts_path = os.path.join(self.data_dir, "telangana", "districts.json")
        if os.path.exists(districts_path):
            self.districts = load_json_file(districts_path)
                
        regions_path = os.path.join(self.data_dir, "india", "regions.json")
        if os.path.exists(regions_path):
            self.regions = load_json_file(regions_path)

    def load_cities_data(self):
        cities_dir = os.path.join(self.data_dir, "cities")
        if not os.path.exists(cities_dir):
            return
        
        for slug in os.listdir(cities_dir):
            city_path = os.path.join(cities_dir, slug)
            if not os.path.isdir(city_path):
                continue
                
            city_config_path = os.path.join(city_path, "city.json")
            localities_path = os.path.join(city_path, "localities.json")
            aliases_path = os.path.join(city_path, "aliases.json")
            clusters_path = os.path.join(city_path, "clusters.json")
            
            if os.path.exists(city_config_path) and os.path.exists(localities_path):
                city_meta = load_json_file(city_config_path)
                localities = load_json_file(localities_path)
                
                aliases = {}
                if os.path.exists(aliases_path):
                    aliases = load_json_file(aliases_path)
                
                clusters = []
                if os.path.exists(clusters_path):
                    clusters = load_json_file(clusters_path)
                        
                self.cities[slug] = {
                    "meta": city_meta,
                    "localities": localities,
                    "aliases": aliases,
                    "clusters": clusters
                }

    def zone_for_point(self, city_center: List[float], lat: float, lng: float, central_radius_km: float) -> str:
        dist = dist_km(lat, lng, city_center[0], city_center[1])
        if dist <= central_radius_km:
            return "Central"
            
        lat_delta = lat - city_center[0]
        lng_delta = lng - city_center[1]
        
        if abs(lat_delta) >= abs(lng_delta):
            return "North" if lat_delta >= 0 else "South"
        else:
            return "East" if lng_delta >= 0 else "West"

    def resolve(self, lat: float, lng: float, locality_hint: Optional[str] = None, city_hint: Optional[str] = None) -> LocalityResolution:
        normalized_locality = normalize_place_name(locality_hint or "")
        normalized_city = normalize_place_name(city_hint or "")
        
        # 1. EXACT match check
        if normalized_locality:
            best_exact = None
            best_exact_dist = float("inf")
            best_matched_by = "alias"
            
            for city_slug, city_data in self.cities.items():
                # Filter by city hint if provided
                if normalized_city and normalize_place_name(city_data["meta"]["name"]) != normalized_city:
                    continue
                    
                aliases = city_data["aliases"]
                localities = city_data["localities"]
                buffer_km = city_data["meta"].get("exactLocalityBufferKm", 6.0)
                
                for loc in localities:
                    loc_slug = loc["slug"]
                    loc_aliases = aliases.get(loc_slug, [])
                    loc_aliases_norm = [normalize_place_name(a) for a in loc_aliases]
                    
                    # Also include locality name/slug as default aliases
                    loc_aliases_norm.append(normalize_place_name(loc["name"]))
                    loc_aliases_norm.append(normalize_place_name(loc_slug.replace("-", " ")))
                    
                    if normalized_locality in loc_aliases_norm:
                        # Check distance
                        distance = dist_km(lat, lng, loc["center"][0], loc["center"][1])
                        inside = point_in_polygon(lat, lng, loc["polygon"])
                        
                        matched_by = "polygon" if inside else "alias"
                        
                        if inside or distance <= buffer_km:
                            if distance < best_exact_dist:
                                best_exact_dist = distance
                                best_exact = (city_slug, loc)
                                best_matched_by = matched_by
            
            if best_exact:
                city_slug, loc = best_exact
                return {
                    "tier": "exact",
                    "citySlug": city_slug,
                    "localitySlug": loc["slug"],
                    "localityName": loc["name"],
                    "clusterId": None,
                    "districtSlug": None,
                    "districtName": None,
                    "stateSlug": None,
                    "distanceKm": round(best_exact_dist, 1),
                    "matchedBy": best_matched_by,
                    "reason": "Coordinate falls inside a supported locality polygon." if best_matched_by == "polygon" else "Resolved locality alias is close enough to a supported locality centroid."
                }

        # 2. NEARBY match check (closest locality within safety radius)
        best_nearby = None
        best_nearby_dist = float("inf")
        best_nearby_city = None
        
        for city_slug, city_data in self.cities.items():
            localities = city_data["localities"]
            nearby_radius_km = city_data["meta"].get("nearbyMicroMarketRadiusKm", 5.0)
            
            for loc in localities:
                distance = dist_km(lat, lng, loc["center"][0], loc["center"][1])
                if distance <= nearby_radius_km and distance < best_nearby_dist:
                    best_nearby_dist = distance
                    best_nearby = loc
                    best_nearby_city = city_slug
                    
        if best_nearby:
            return {
                "tier": "nearby",
                "citySlug": best_nearby_city,
                "localitySlug": best_nearby["slug"],
                "localityName": best_nearby["name"],
                "clusterId": None,
                "districtSlug": None,
                "districtName": None,
                "stateSlug": None,
                "distanceKm": round(best_nearby_dist, 1),
                "matchedBy": "radius",
                "reason": "Coordinate is within the safe nearby radius of a supported micro-market."
            }

        # 3. CLUSTER match check (broad city catchment)
        best_city = None
        best_city_dist = float("inf")
        
        # Filter by city hint if valid and in catchment
        for city_slug, city_data in self.cities.items():
            meta = city_data["meta"]
            coverage_radius = meta.get("coverageRadiusKm", 50.0)
            distance = dist_km(lat, lng, meta["center"][0], meta["center"][1])
            
            if distance <= coverage_radius and distance < best_city_dist:
                best_city_dist = distance
                best_city = (city_slug, city_data)
                
        if best_city:
            city_slug, city_data = best_city
            meta = city_data["meta"]
            zone = self.zone_for_point(meta["center"], lat, lng, meta.get("centralRadiusKm", 8.0))
            
            # Find cluster label matching zone
            cluster_id = f"{city_slug}:{zone.lower()}"
            for cluster in city_data["clusters"]:
                if cluster["zone"].lower() == zone.lower():
                    cluster_id = cluster["id"]
                    break
                    
            return {
                "tier": "cluster",
                "citySlug": city_slug,
                "localitySlug": None,
                "localityName": None,
                "clusterId": cluster_id,
                "districtSlug": None,
                "districtName": None,
                "stateSlug": None,
                "distanceKm": round(best_city_dist, 1),
                "matchedBy": "cluster",
                "reason": "Coordinate is inside a supported city catchment, but only broad cluster context is available."
            }

        # 4. REGIONAL match check
        in_telangana = (
            lat >= self.telangana_bounds["latMin"] and lat <= self.telangana_bounds["latMax"] and
            lng >= self.telangana_bounds["lngMin"] and lng <= self.telangana_bounds["lngMax"]
        )
        
        if in_telangana and self.districts:
            best_district = None
            best_dist_dist = float("inf")
            
            for dist in self.districts:
                inside = point_in_polygon(lat, lng, dist["polygon"])
                if inside:
                    best_district = dist
                    best_dist_dist = dist_km(lat, lng, dist["center"][0], dist["center"][1])
                    break
                
                # Check center distance fallback
                dist_center = dist_km(lat, lng, dist["center"][0], dist["center"][1])
                if dist_center < best_dist_dist:
                    best_dist_dist = dist_center
                    best_district = dist
                    
            if best_district:
                return {
                    "tier": "regional",
                    "citySlug": None,
                    "localitySlug": None,
                    "localityName": None,
                    "clusterId": None,
                    "districtSlug": best_district["slug"],
                    "districtName": best_district["name"],
                    "stateSlug": best_district["state"],
                    "distanceKm": round(best_dist_dist, 1),
                    "matchedBy": "district",
                    "reason": f"Coordinate is inside {best_district['name']} regional coverage — no micro-market data yet for this area."
                }

        # Check Pan India Regions fallback
        if self.regions:
            best_region = None
            best_region_dist = float("inf")
            
            for region in self.regions:
                inside = point_in_polygon(lat, lng, region["polygon"])
                if inside:
                    dist_val = dist_km(lat, lng, region["center"][0], region["center"][1])
                    if dist_val < best_region_dist:
                        best_region_dist = dist_val
                        best_region = region
                        
            if best_region:
                return {
                    "tier": "regional",
                    "citySlug": None,
                    "localitySlug": None,
                    "localityName": None,
                    "clusterId": None,
                    "districtSlug": best_region["slug"],
                    "districtName": best_region["name"],
                    "stateSlug": best_region["state"],
                    "distanceKm": round(best_region_dist, 1),
                    "matchedBy": "district",
                    "reason": f"Coordinate is inside {best_region['name']} regional coverage — no micro-market data yet for this area."
                }

        # 5. UNCOVERED fallback
        return {
            "tier": "uncovered",
            "citySlug": None,
            "localitySlug": None,
            "localityName": None,
            "clusterId": None,
            "districtSlug": None,
            "districtName": None,
            "stateSlug": None,
            "distanceKm": None,
            "matchedBy": "none",
            "reason": "Coordinate does not map to a supported locality or regional coverage area."
        }

# Global singleton instance
resolver = LocationResolverStore()
