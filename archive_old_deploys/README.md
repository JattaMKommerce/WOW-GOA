# Archive: Old Deployment Packages

This directory contains old deployment ZIP archives that are no longer actively used.

## Archived Files (Phase 11 - Sept 4, 2026)

1. **cpanel_ready_deploy.zip** (71.9 MB) - Old cPanel deployment package
2. **wowgoa_deploy_package.zip** (72.2 MB) - Old WOW GOA deployment package
3. **tripgalileo.zip** (48.1 MB) - Old TripGalileo archive from July 2026
4. **backend.zip** (1.3 MB) - Old backend snapshot
5. **backend (2).zip** (1.3 MB) - Old backend snapshot #2
6. **backend (3).zip** (64.2 MB) - Old backend snapshot #3
7. **tripgalileo_production.zip** (9.3 MB) - Old production snapshot from August 2026

## Why Archived

- All `*.zip` files are in `.gitignore` (development artifacts only)
- Current deployment uses GitHub Actions workflow (`.github/workflows/deploy.yml`)
- Fresh deployment packages are generated on each build via CI/CD
- These ZIPs are superseded by the current deployment process

## Current Deployment Process

The live deployment process:
1. GitHub Actions builds frontend (`npm run build`)
2. Packages `dist` + `backend` into `deploy_bundle.zip`
3. Uploads to cPanel via `backend/deploy_v2.php`

The `package_cpanel.py` script generates `cpanel_ready_deploy.zip` for local testing only.

## Safety

These files can be safely deleted if disk space is needed. They are not referenced by any production code, configuration, or deployment scripts.
