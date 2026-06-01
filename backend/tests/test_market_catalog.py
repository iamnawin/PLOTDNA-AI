import unittest

from app.services.market_catalog import get_city_area, list_city_areas


class MarketCatalogServiceTests(unittest.TestCase):
    def test_lists_hyderabad_areas_from_catalog(self):
        areas = list_city_areas("hyderabad")

        self.assertGreaterEqual(len(areas), 1)
        self.assertTrue(any(area.slug == "adibatla" for area in areas))

    def test_gets_hyderabad_area_detail(self):
        area = get_city_area("hyderabad", "adibatla")

        self.assertIsNotNone(area)
        assert area is not None
        self.assertEqual(area.slug, "adibatla")
        self.assertEqual(area.name, "Adibatla")
        self.assertEqual(area.category, "Emerging")
        self.assertIsInstance(area.center, list)
        self.assertGreaterEqual(len(area.polygon), 4)
        self.assertEqual(area.signals.infrastructure, 92)

    def test_unknown_city_returns_empty_list(self):
        self.assertEqual(list_city_areas("unknown-city"), [])

    def test_unknown_area_returns_none(self):
        self.assertIsNone(get_city_area("hyderabad", "missing-area"))


if __name__ == "__main__":
    unittest.main()
