---
name: backend-feature-addition-with-tests
description: Workflow command scaffold for backend-feature-addition-with-tests in PLOTDNA-AI.
allowed_tools: ["Bash", "Read", "Write", "Grep", "Glob"]
---

# /backend-feature-addition-with-tests

Use this workflow when working on **backend-feature-addition-with-tests** in `PLOTDNA-AI`.

## Goal

Implements new backend functionality (such as a new catalog or API route) and adds or updates corresponding unit tests.

## Common Files

- `backend/app/services/*.py`
- `backend/app/api/routes/*.py`
- `backend/tests/test_*.py`
- `data/catalog/*.json`

## Suggested Sequence

1. Understand the current state and failure mode before editing.
2. Make the smallest coherent change that satisfies the workflow goal.
3. Run the most relevant verification for touched files.
4. Summarize what changed and what still needs review.

## Typical Commit Signals

- Create or update backend service or API route files to implement the new feature.
- Add or update test files to validate the new backend logic.
- Optionally, add or update data files if the feature involves new datasets.

## Notes

- Treat this as a scaffold, not a hard-coded script.
- Update the command if the workflow evolves materially.