import unittest

from app.services.flatdna.aprera_quarterly import parse_quarterly_tables


YEARS = ["2019-20", "2020-21", "2021-22", "2022-23", "2023-24", "2024-25"]


def report_table(*records):
    year_row = [None] * 33
    for index, year in zip(range(7, 31, 4), YEARS):
        year_row[index] = year
    header = [
        "ProjectID", "Project\nName", "Approval\nDate", "Validity\nDate", "Project\nType",
        "Units", "Total\nArea\n(Sqm/Acres)",
        *[quarter for _ in YEARS for quarter in ("Q1", "Q2", "Q3", "Q4")],
        "Closure\nApplied", "Status",
    ]
    return [["APRERA REGISTERED PROJECTS", *([None] * 32)], year_row, header, *records]


class ApreraQuarterlyExtractorTests(unittest.TestCase):
    def test_parses_official_table_into_dated_staging_records(self):
        records = parse_quarterly_tables([
            report_table([
                "P02280150024", "SATYA ANNAPURNA\nHEIGHTS", "01/08/2018", "31/08/2020",
                "Residential", "15", "685.53", *(["Y", "Y", "Y", "N"] * 6), "N", "-",
            ])
        ])

        self.assertEqual(len(records), 1)
        record = records[0]
        self.assertEqual(record["project_id"], "P02280150024")
        self.assertEqual(record["project_name"], "SATYA ANNAPURNA HEIGHTS")
        self.assertEqual(record["units"], 15)
        self.assertEqual(record["total_area_as_reported"], "685.53")
        self.assertEqual(record["quarterly_updates"]["2024-25"], {"Q1": "Y", "Q2": "Y", "Q3": "Y", "Q4": "N"})
        self.assertEqual(record["closure_applied"], "N")

    def test_skips_non_project_rows_and_normalizes_missing_units(self):
        records = parse_quarterly_tables([
            report_table(
                [None] * 33,
                [
                    "P06180020050", "SREE RAMJI INFRATECH", "01/11/2018", "30/09/2019",
                    "Residential", "-", "1635.18", *(["N"] * 24), "Y", "Exempted From\nSubmission of QU",
                ],
            )
        ])

        self.assertEqual(len(records), 1)
        self.assertIsNone(records[0]["units"])
        self.assertEqual(records[0]["status"], "Exempted From Submission of QU")

    def test_rejects_changed_report_shape_instead_of_publishing_partial_data(self):
        with self.assertRaisesRegex(ValueError, "APRERA quarterly report shape changed"):
            parse_quarterly_tables([[['ProjectID'], ['P1']]])

    def test_ignores_non_table_pages_when_a_valid_report_table_exists(self):
        records = parse_quarterly_tables([
            [],
            report_table([
                "P02280150024", "SATYA ANNAPURNA HEIGHTS", "01/08/2018", "31/08/2020",
                "Residential", "15", "685.53", *(["Y"] * 24), "N", "-",
            ]),
        ])

        self.assertEqual([record["project_id"] for record in records], ["P02280150024"])


if __name__ == "__main__":
    unittest.main()
