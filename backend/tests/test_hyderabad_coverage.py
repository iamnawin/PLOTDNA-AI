import json
import math
import subprocess
import sys
import unittest
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[2]
HYDERABAD_DIR = REPO_ROOT / "data" / "cities" / "hyderabad"
CATALOG_PATH = REPO_ROOT / "data" / "catalog" / "hyderabad.json"
VALIDATION_REPORT_PATH = REPO_ROOT / ".omx" / "artifacts" / "hyderabad-coverage-report.json"
MAP_CENTER = (17.385, 78.487)


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8-sig"))


def project(lng: float, lat: float) -> tuple[float, float]:
    lat0 = math.radians(MAP_CENTER[0])
    return (
        (lng - MAP_CENTER[1]) * 111.320 * math.cos(lat0),
        (lat - MAP_CENTER[0]) * 110.574,
    )


def area_km2(ring: list[list[float]]) -> float:
    points = [project(lng, lat) for lng, lat in ring]
    return abs(
        sum(
            points[index][0] * points[(index + 1) % len(points)][1]
            - points[(index + 1) % len(points)][0] * points[index][1]
            for index in range(len(points))
        )
    ) / 2


def contains(ring: list[list[float]], lat: float, lng: float) -> bool:
    inside = False
    previous = len(ring) - 1
    for current in range(len(ring)):
        lng_i, lat_i = ring[current]
        lng_j, lat_j = ring[previous]
        intersects = ((lat_i > lat) != (lat_j > lat)) and (
            lng < (lng_j - lng_i) * (lat - lat_i) / ((lat_j - lat_i) or 1e-12) + lng_i
        )
        if intersects:
            inside = not inside
        previous = current
    return inside


class HyderabadCoverageTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.boundary = load_json(HYDERABAD_DIR / "coverage-boundary.geojson")
        cls.coverage = load_json(HYDERABAD_DIR / "coverage-areas.geojson")
        cls.special_use = load_json(HYDERABAD_DIR / "special-use-areas.geojson")
        cls.localities = load_json(HYDERABAD_DIR / "localities.json")
        cls.aliases = load_json(HYDERABAD_DIR / "aliases.json")
        cls.catalog = load_json(CATALOG_PATH)["areas"]
        cls.pending_sources = load_json(HYDERABAD_DIR / "pending-context-sources.json")
        cls.pending_readiness = load_json(HYDERABAD_DIR / "pending-scoring-readiness.json")
        cls.pending_inventory = load_json(HYDERABAD_DIR / "pending-signal-inventory.json")

    def test_market_boundary_contains_requested_scope_anchors(self):
        ring = self.boundary["features"][0]["geometry"]["coordinates"][0]
        anchors = {
            "sadasivpet": (17.619, 77.952),
            "sangareddy": (17.624, 78.090),
            "isnapur": (17.524, 78.268),
            "rgia": (17.231, 78.432),
            "farooqnagar": (17.077, 78.203),
            "lb-nagar": (17.345, 78.545),
            "vikarabad": (17.338, 77.906),
            "medchal": (17.630, 78.485),
            "munipally": (17.592, 77.887),
        }
        for name, (lat, lng) in anchors.items():
            with self.subTest(anchor=name):
                self.assertTrue(contains(ring, lat, lng))

    def test_selectable_cells_cover_market_boundary_without_area_holes(self):
        boundary_ring = self.boundary["features"][0]["geometry"]["coordinates"][0]
        boundary_area = area_km2(boundary_ring)
        cell_area = sum(
            area_km2(feature["geometry"]["coordinates"][0])
            for feature in self.coverage["features"]
        )
        self.assertGreaterEqual(len(self.coverage["features"]), 220)
        self.assertAlmostEqual(cell_area / boundary_area, 1.0, delta=0.001)

    def test_every_coverage_cell_has_alias_and_catalog_record(self):
        coverage_slugs = {
            feature["properties"]["slug"]
            for feature in self.coverage["features"]
            if not feature["properties"].get("contextOnly")
        }
        catalog_slugs = {area["slug"] for area in self.catalog}
        self.assertEqual(coverage_slugs - set(self.aliases), set())
        self.assertEqual(coverage_slugs - catalog_slugs, set())

    def test_requested_anchor_resolves_to_expected_cell(self):
        fixtures = {
            "sadasivpet": (17.619, 77.952),
            "sangareddy": (17.624, 78.090),
            "isnapur": (17.524, 78.268),
            "shamshabad": (17.240, 78.420),
            "lb-nagar": (17.345, 78.545),
            "vikarabad": (17.338, 77.906),
            "medchal": (17.630, 78.485),
            "munipally": (17.592, 77.887),
        }
        features = self.coverage["features"]
        for expected_slug, (lat, lng) in fixtures.items():
            matches = [
                feature["properties"]["slug"]
                for feature in features
                if contains(feature["geometry"]["coordinates"][0], lat, lng)
            ]
            with self.subTest(expected_slug=expected_slug):
                self.assertEqual(matches, [expected_slug])

    def test_special_use_layer_classifies_rgia(self):
        rgia = next(
            feature
            for feature in self.special_use["features"]
            if feature["properties"]["slug"] == "rajiv-gandhi-international-airport"
        )
        self.assertEqual(rgia["properties"]["marketable"], False)
        self.assertTrue(contains(rgia["geometry"]["coordinates"][0], 17.231, 78.432))

    def test_every_context_cell_has_pending_detail_contract(self):
        context_slugs = {
            feature["properties"]["slug"]
            for feature in self.coverage["features"]
            if feature["properties"].get("contextOnly")
        }
        source_by_slug = {audit["slug"]: audit for audit in self.pending_sources["sourceAudits"]}
        readiness_by_slug = {audit["slug"]: audit for audit in self.pending_readiness["areaAudits"]}
        inventory_by_slug = {audit["slug"]: audit for audit in self.pending_inventory["areaInventories"]}
        required_signals = set(self.pending_inventory["requiredSignals"])

        self.assertEqual(set(source_by_slug), context_slugs)
        self.assertEqual(set(readiness_by_slug), context_slugs)
        self.assertEqual(set(inventory_by_slug), context_slugs)

        for slug in sorted(context_slugs):
            with self.subTest(slug=slug):
                source = source_by_slug[slug]
                readiness = readiness_by_slug[slug]
                inventory = inventory_by_slug[slug]
                self.assertIn(source["status"], {"tgrac_village_matched", "tgrac_statewide_village_matched"})
                self.assertTrue(source.get("officialMatches"))
                official_match = source["officialMatches"][0]
                self.assertTrue(official_match.get("villageName"))
                self.assertTrue(official_match.get("mandalName"))
                self.assertTrue(official_match.get("districtName"))
                self.assertFalse(readiness["promotionReady"])
                self.assertGreater(len(readiness["missingEvidence"]), 0)
                self.assertEqual(set(inventory["signals"]), required_signals)
                self.assertFalse(inventory["signalDeckReady"])

    def test_validator_report_exposes_pending_detail_readiness(self):
        subprocess.run(
            [sys.executable, str(REPO_ROOT / "scripts" / "validate_hyderabad_coverage.py")],
            cwd=REPO_ROOT,
            check=True,
            capture_output=True,
            text=True,
        )
        report = load_json(VALIDATION_REPORT_PATH)
        self.assertEqual(report["pendingContextCellCount"], 75)
        self.assertEqual(report["pendingOfficialMatchCount"], 75)
        self.assertEqual(report["pendingScoringReadinessCount"], 75)
        self.assertEqual(report["pendingSignalInventoryCount"], 75)
        self.assertEqual(report["pendingPromotionReadyCount"], 0)
        self.assertGreater(report["pendingVerifiedPriceSignalCount"], 0)
        self.assertGreater(report["pendingVerifiedInfrastructureSignalCount"], 0)


if __name__ == "__main__":
    unittest.main()
