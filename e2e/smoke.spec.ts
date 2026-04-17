import { test, expect } from '@playwright/test'

test.describe('Core Event Management Flow (Smoke Test)', () => {
  test.describe.configure({ mode: 'serial' })

  const testEmail = 'smoke-test-' + Date.now() + '@gmail.com'
  const testPassword = 'TestPassword123!'
  const fallbackEmail = process.env.E2E_USER_EMAIL
  const fallbackPassword = process.env.E2E_USER_PASSWORD
  let authEmail = testEmail
  let authPassword = testPassword
  let eventId: string
  let eventName: string

  const ensureLoggedIn = async (page: import('@playwright/test').Page) => {
    await page.goto('/dashboard')

    const emailInput = page.locator('#email')
    if (await emailInput.isVisible()) {
      await emailInput.fill(authEmail)
      await page.locator('#password').fill(authPassword)
      await page.locator('form button[type="submit"]').click()
      await page.waitForURL(/\/dashboard/, { timeout: 15000 })
    }

    await expect(page).toHaveURL(/\/dashboard/)
  }

  test('User can sign up, create an event, and add a payment', async ({ page }) => {
    // ─── 1. Sign Up ───────────────────────────────────────────────────────
    await page.goto('/')

    await page.getByRole('button', { name: 'Crear cuenta', exact: true }).click()

    // Fill signup form
    await page.locator('#email').fill(testEmail)
    await page.locator('#password').fill(testPassword)
    await page.locator('#confirm-password').fill(testPassword)

    // Submit signup
    await page.locator('form button[type="submit"]').click()

    // Sign-up can either navigate to dashboard or resolve with a form feedback message.
    const submitButton = page.locator('form button[type="submit"]')
    await Promise.race([
      page.waitForURL(/\/dashboard/, { timeout: 20000 }).catch(() => null),
      expect(submitButton).not.toHaveText('Procesando...', { timeout: 20000 }).catch(() => null),
    ])

    if (!/\/dashboard/.test(page.url())) {
      const formText = await page.locator('form').innerText()

      if (/rate limit exceeded/i.test(formText)) {
        if (!fallbackEmail || !fallbackPassword) {
          test.skip(true, 'Supabase signup rate-limited. Set E2E_USER_EMAIL and E2E_USER_PASSWORD to run smoke tests without signup.')
        }

        authEmail = fallbackEmail
        authPassword = fallbackPassword
        await ensureLoggedIn(page)
      } else if (/cuenta creada/i.test(formText)) {
        await page.locator('#email').fill(authEmail)
        await page.locator('#password').fill(authPassword)
        await page.locator('form button[type="submit"]').click()
        await page.waitForURL(/\/dashboard/, { timeout: 15000 })
      } else {
        throw new Error(`Signup did not succeed. Form state: ${formText}`)
      }
    }

    await expect(page).toHaveURL(/\/dashboard/)

    // ─── 2. Create Event ──────────────────────────────────────────────────
    await page.getByRole('button', { name: 'Nuevo evento' }).click()
    await expect(page.getByText('Nuevo evento')).toBeVisible()

    // Fill event form
    eventName = 'E2E Test Event - ' + Date.now()
    await page.fill('input[placeholder*="Nombre del evento"]', eventName)

    // Set date to tomorrow
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const dateStr = tomorrow.toISOString().split('T')[0]
    await page.fill('input[type="date"]', dateStr)

    // Set start time
    await page.locator('input[type="time"]').first().fill('14:00')

    // Submit form
    await page.getByRole('button', { name: 'Crear evento' }).click()

    // Wait for modal to close and event to appear in list
    await page.waitForTimeout(1000)
    await expect(page.locator(`text=${eventName}`)).toBeVisible()

    // ─── 3. Navigate to Event Detail ──────────────────────────────────────
    await page.click(`text=${eventName}`)
    await page.waitForURL(/\/events\//, { timeout: 10000 })
    
    // Extract event ID from URL
    const url = page.url()
    eventId = url.split('/').pop() ?? ''
    await expect(page.locator(`text=${eventName}`)).toBeVisible()

    // ─── 4. Add Payment ──────────────────────────────────────────────────
    await page.getByRole('button', { name: 'Registrar pago' }).click()

    // Fill payment form
    await page.fill('input[type="number"]', '1000')
    const typeSelect = page.locator('select').first()
    await typeSelect.selectOption('total')

    // Submit payment
    await page.getByRole('button', { name: 'Guardar' }).click()

    // Wait for payment to appear in list
    await page.waitForTimeout(500)
    await expect(page.locator('text=$ 1.000').first()).toBeVisible()

    // ─── 5. Verify Summary Updated ────────────────────────────────────────
    await expect(page.locator('text=Pago completo')).toBeVisible()
  })

  test('User can view calendar and navigate to event', async ({ page }) => {
    test.skip(!eventName, 'Requires a created event from previous smoke step.')

    // ─── 1. Login with existing account ────────────────────────────────────
    await ensureLoggedIn(page)

    // ─── 2. Navigate to Calendar ──────────────────────────────────────────
    await page.getByRole('link', { name: 'Calendario' }).click()
    await page.waitForURL(/\/calendar/)

    // Verify calendar is visible
    await expect(page.getByRole('button', { name: 'Hoy' })).toBeVisible()

    // ─── 3. Open created event from calendar ──────────────────────────────
    await page.getByText(eventName, { exact: false }).first().click()
    await page.waitForURL(/\/events\//, { timeout: 10000 })
    await expect(page).toHaveURL(new RegExp(`/events/${eventId}$`))
  })

  test('User can filter events on dashboard', async ({ page }) => {
    test.skip(!eventName, 'Requires a created event from previous smoke step.')

    // ─── 1. Login ─────────────────────────────────────────────────────────
    await ensureLoggedIn(page)

    // ─── 2. Open Filters ──────────────────────────────────────────────────
    await page.getByRole('button', { name: 'Filtros' }).click()

    // Verify filter panel opened
    await expect(page.locator('label:has-text("Estado")')).toBeVisible()

    // ─── 3. Filter by Status ──────────────────────────────────────────────
    const statusSelect = page.locator('label:has-text("Estado")').locator('..').locator('select')
    await statusSelect.selectOption('query')

    // Wait for results to update
    await page.waitForTimeout(500)

    // Verify table still has content
    await expect(page.getByText(eventName, { exact: false })).toBeVisible()

    // ─── 4. Test Clear Filters ────────────────────────────────────────────
    await page.getByRole('button', { name: 'Limpiar filtros' }).click()
    await page.waitForTimeout(300)

    // Verify status filter reset
    const status = await statusSelect.inputValue()
    expect(status).toBe('')
  })
})
