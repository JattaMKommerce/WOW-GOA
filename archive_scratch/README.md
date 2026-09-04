# Archive: Scratch Development Scripts

This directory contains ad-hoc development, testing, debugging, and migration scripts that were used during the implementation phases but are no longer actively needed.

## Archived Files (Phase 11 - Sept 4, 2026)

### Development Scripts (84 files from `scratch/` directory)

These include:
- Database schema inspection scripts (`check_*.php`, `list_*.php`, `inspect_*.php`)
- Migration utilities (`migrate_*.php`, `alter_*.php`, `update_*.php`)
- Test scripts (`test_*.php`, `test_*.js`, `test_*.json`)
- Debug utilities (`debug_*.php`, `diag_*.php`, `audit_*.php`)
- Recovery scripts (`recover_*.php`, `extract_*.php`)
- Pre-RBAC snapshots (`pre_rbac_*.jsx`, `exact_pre_rbac_*.jsx`)

### Root-level ad-hoc files (8 files)

- `alter_users.php` - User table alteration script
- `check_users_db.php` - User database inspection
- `aviationstack_test.txt` - Aviation API test results
- `tequila_test.txt` - Tequila API test results
- `test_api.js` - API testing script
- `test_aviation.js` - Aviation API testing script
- `tripgalileo (1).sql` - Old SQL dump
- `setup_crm.sql` - MySQL CRM table setup (project now uses SQLite)

## Why Archived

- All files in `scratch/` directory are in `.gitignore` (dev artifacts only)
- These scripts were used during Phases 1-10 implementation
- Database migrations have been completed and are now in `backend/migrations/`
- Testing is now handled through structured test suites
- Pre-RBAC code snapshots are no longer needed (RBAC fully implemented)

## Safety

These files can be safely deleted if needed. They are:
- Not referenced by production code
- Not part of the deployment process
- Not required for ongoing development
- Preserved here only for historical reference

## If You Need to Recreate Similar Scripts

Modern equivalents:
- Database inspection: Use `backend/db_debug.php` (production utility)
- Migrations: Create new files in `backend/migrations/`
- Testing: Use the main test suites and API endpoints
- Schema changes: Run through proper migration workflow
