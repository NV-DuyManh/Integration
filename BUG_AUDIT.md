# Bug & Defect Audit

This document serves as the primary tracking log for defects discovered during the full system audit of the NexusBridge middleware application.

---

## 🔴 CRITICAL SEVERITY (Must Fix Immediately)

### 1. Broken Test Suite due to Legacy Mock Users
- **Status:** **RESOLVED**
- **Location:** `backend/tests/test_auth.py`
- **Description:** The automated pytest suite was failing because it relied on hardcoded credentials (`admin` / `admin123`) which were removed when the local SQLite authentication persistence was built. 
- **Impact:** Failed CI/CD pipelines and inability to verify regression on authentication.
- **Resolution:** Modified `test_auth.py` to register a unique test user programmatically using `uuid` before attempting to log in, preserving isolation.

---

## 🟠 HIGH SEVERITY (Core Functionality Impact)

*(No high severity bugs discovered during audit. System connectivity, endpoints, and rendering are fully functional).*

---

## 🟡 MEDIUM SEVERITY (Usability or Edge Cases)

*(No medium severity bugs discovered. PDF export rendering issues were preemptively avoided as `Roboto` fonts were successfully verified in the `public` directory).*

---

## 🟢 LOW SEVERITY (Cosmetic or Missing Features)

### 1. Simulated "Forgot Password" Workflow
- **Status:** OPEN (Documented)
- **Location:** `frontend/src/main.ts` (Lines 391, 488)
- **Description:** The login screen features a "Forgot password?" link. Clicking it displays a UI success alert saying "Password reset instructions have been sent to your email (Simulated)." It does not trigger any backend process.
- **Impact:** Minimal. It functions as a placeholder/mock widget.
- **Recommendation:** Implement a password reset flow using an SMTP integration on the FastAPI backend, or remove the button if out of scope.

### 2. Missing E2E Tests
- **Status:** OPEN (Enhancement)
- **Location:** Frontend module
- **Description:** While API integration tests and TypeScript linting are in place, the application lacks a full simulated-browser test suite (Playwright / Cypress) to check DOM states.
- **Impact:** Minimal for now, but increases risk of regressions during future UI changes.
- **Recommendation:** Add Playwright tests for key workflows (Dashboard load, PDF export).
