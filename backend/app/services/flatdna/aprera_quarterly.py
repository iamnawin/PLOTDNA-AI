from __future__ import annotations

import re
from typing import Iterable


PROJECT_ID_PATTERN = re.compile(r"^P\d+$")
QUARTERS = ("Q1", "Q2", "Q3", "Q4")
EXPECTED_COLUMNS = 33


def _clean(value) -> str:
    return " ".join(str(value or "").split())


def parse_quarterly_tables(tables: Iterable[list[list[object]]]) -> list[dict]:
    records: list[dict] = []
    seen_project_ids: set[str] = set()
    recognized_tables = 0

    for table in tables:
        header_index = next(
            (index for index, row in enumerate(table) if row and _clean(row[0]) == "ProjectID"),
            None,
        )
        if header_index is None:
            continue
        header = table[header_index]
        if len(header) != EXPECTED_COLUMNS or _clean(header[-2]) != "Closure Applied":
            raise ValueError("APRERA quarterly report shape changed")
        if header_index == 0:
            raise ValueError("APRERA quarterly report shape changed")

        year_row = table[header_index - 1]
        years = [_clean(year_row[index]) for index in range(7, 31, 4)]
        if len(years) != 6 or any(not re.fullmatch(r"\d{4}-\d{2}", year) for year in years):
            raise ValueError("APRERA quarterly report shape changed")
        recognized_tables += 1

        for row in table[header_index + 1:]:
            if not row or not PROJECT_ID_PATTERN.fullmatch(_clean(row[0])):
                continue
            if len(row) != EXPECTED_COLUMNS:
                raise ValueError("APRERA quarterly report shape changed")
            project_id = _clean(row[0])
            if project_id in seen_project_ids:
                raise ValueError(f"duplicate APRERA project ID: {project_id}")
            seen_project_ids.add(project_id)
            unit_value = _clean(row[5])
            records.append({
                "project_id": project_id,
                "project_name": _clean(row[1]),
                "approval_date": _clean(row[2]),
                "validity_date": _clean(row[3]),
                "project_type": _clean(row[4]),
                "units": None if unit_value in {"", "-"} else int(unit_value.replace(",", "")),
                "total_area_as_reported": _clean(row[6]),
                "quarterly_updates": {
                    year: {
                        quarter: _clean(row[7 + year_index * 4 + quarter_index])
                        for quarter_index, quarter in enumerate(QUARTERS)
                    }
                    for year_index, year in enumerate(years)
                },
                "closure_applied": _clean(row[31]),
                "status": _clean(row[32]),
            })

    if recognized_tables == 0:
        raise ValueError("APRERA quarterly report shape changed")
    return records
