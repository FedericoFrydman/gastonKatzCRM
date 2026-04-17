# E2E Testing Guide

This project uses [Playwright](https://playwright.dev/) for end-to-end testing. The smoke tests validate core user workflows including signup, event creation, and payment tracking.

## Setup

Playwright is already installed as a dev dependency. No additional setup required beyond the standard `npm install`.

## Running Tests

### Run all E2E tests
```bash
npm run test:e2e
```

### Run tests in UI mode (interactive)
```bash
npm run test:e2e:ui
```

### Debug a specific test
```bash
npm run test:e2e:debug
```

## Test Structure

- **`e2e/smoke.spec.ts`** — Smoke tests covering core workflows:
  1. **User signup** — Register a new account with email/password
  2. **Event creation** — Create an event with date/time/status
  3. **Payment tracking** — Add a payment and verify summary updates
  4. **Calendar navigation** — View calendar and navigate to event detail
  5. **Dashboard filtering** — Filter events by status and reset filters

## CI Integration

Tests run automatically on:
- ✅ Push to `main` branch
- ✅ Pull requests to `main` branch

The CI pipeline:
1. Installs Playwright browsers
2. Runs `npm run test:e2e`
3. Uploads HTML test report as artifact (viewable in GitHub Actions)

Test results do NOT block deployment (informational only for MVP). Future: add required pass gate.

## Environment

Tests use the production Supabase instance by default:
- **Base URL**: `http://localhost:5173` (dev server) or `E2E_BASE_URL` env var
- **Database**: Tries to create test users with timestamp-based emails (`smoke-test-{timestamp}@gmail.com`)
- **Optional fallback auth**: set `E2E_USER_EMAIL` and `E2E_USER_PASSWORD` to bypass signup when Supabase rate-limits new users

## Notes

- Tests create **real users** in Supabase when signup is available
- If Supabase returns `email rate limit exceeded` and fallback env vars are not set, smoke tests are skipped to avoid false failures
- Tests run in **headless mode** by default; use `--headed` flag in debug mode to see browser
- Playwright supports Chromium, Firefox, and Safari by default

## Debugging Tips

If a test fails:
1. Check the HTML report: `npx playwright show-report`
2. Look for screenshots/videos in `playwright-report/`
3. Run in debug mode: `npm run test:e2e:debug`
4. Inspect network requests and console logs in browser

## Future Enhancements

- [ ] Mobile testing (currently desktop only)
- [ ] Visual regression testing
- [ ] Performance benchmarks
- [ ] Required E2E pass gate in CI (currently informational)
- [ ] Fixtures for test user creation/cleanup
