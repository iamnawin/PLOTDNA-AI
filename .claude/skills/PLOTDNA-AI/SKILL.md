```markdown
# PLOTDNA-AI Development Patterns

> Auto-generated skill from repository analysis

## Overview
This skill introduces the core development patterns and workflows used in the PLOTDNA-AI Python codebase. You'll learn the project's coding conventions, how to implement new backend features with corresponding tests, and how to follow established workflows for consistent, maintainable contributions.

## Coding Conventions

- **File Naming:**  
  Use camelCase for Python files.  
  *Example:*  
  ```
  dataProcessor.py
  apiRoutes.py
  ```

- **Import Style:**  
  Use aliases for imports to clarify usage and avoid naming conflicts.  
  *Example:*  
  ```python
  import numpy as np
  import pandas as pd
  ```

- **Export Style:**  
  Use named exports (explicitly define what is exported from a module).  
  *Example:*  
  ```python
  def processData(data):
      # logic here
      return result

  __all__ = ['processData']
  ```

## Workflows

### Backend Feature Addition with Tests
**Trigger:** When you want to introduce new backend features or data sources and ensure they are tested.  
**Command:** `/new-backend-feature`

1. **Implement the Feature:**  
   Create or update backend service or API route files to add the new functionality.  
   *Example:*  
   ```python
   # backend/app/services/dataCatalog.py
   def addNewCatalogEntry(entry):
       # implementation
       pass
   ```

2. **Write/Update Tests:**  
   Add or update test files to validate the new backend logic.  
   *Example:*  
   ```python
   # backend/tests/test_dataCatalog.py
   def test_addNewCatalogEntry():
       # test logic
       assert ...
   ```

3. **(Optional) Update Data Files:**  
   If your feature involves new datasets, add or update files in `data/catalog/*.json`.

**Files Involved:**
- `backend/app/services/*.py`
- `backend/app/api/routes/*.py`
- `backend/tests/test_*.py`
- `data/catalog/*.json`

**Frequency:** ~2x/month

---

## Testing Patterns

- **Framework:** Unknown (custom or minimal)
- **File Pattern:** Test files are named with the pattern `test_*.py` and located in `backend/tests/`.
- **Example Test File:**
  ```python
  # backend/tests/test_apiRoutes.py
  def test_api_route_response():
      # Arrange
      # Act
      # Assert
      assert ...
  ```

## Commands

| Command              | Purpose                                                    |
|----------------------|------------------------------------------------------------|
| /new-backend-feature | Start the workflow for adding a backend feature with tests |
```
