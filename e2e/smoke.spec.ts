import { test, expect } from '@playwright/test'

test.describe('Core Event Management Flow (Smoke Test)', () => {
  const testEmail = 'smoke-test-' + Date.now() + '@test.gastonkatz.com'
  const testPassword = 'TestPassword123!'
  let eventId: string

  test('User can sign up, create an event, and add a payment', async ({ page }) => {
    // ─── 1. Sign Up ───────────────────────────────────────────────────────
    await page.goto('/')
    
    // Click on signup tab if visible
    await page.click('button:has-text("Crear cuenta")')
    
    // Fill signup form
    await page.fill('input[type="email"]', testEmail)
    await page.fill('input[placeholder*="Contraseña"]', testPassword)
    await page.fill('input[placeholder*="Confirmar"]', testPassword)
    
    // Submit signup
    await page.click('button:has-text("Crear cuenta")')
    
    // Wait for redirect to dashboard or success message
    await page.waitForURL('/dashboard', { timeout: 10000 })
    await expect(page).toHaveURL(/\/dashboard/)

    // ─── 2. Create Event ──────────────────────────────────────────────────
    await page.click('button:has-text("Nuevo evento")')
    
    // Fill event form
    const eventName = 'E2E Test Event - ' + Date.now()
    await page.fill('input[placeholder*="Nombre del evento"]', eventName)
    
    // Set date to tomorrow
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const dateStr = tomorrow.toISOString().split('T')[0]
    await page.fill('input[type="date"]', dateStr)
    
    // Set start time
    await page.fill('input[type="time"]', '14:00')
    
    // Select status
    const statusSelect = page.locator('select').filter({ hasText: 'Estado' }).first()
    await statusSelect.selectOption('confirmed')
    
    // Submit form
    await page.click('button:has-text("Crear evento")')
    
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
    await page.click('button:has-text("Agregar pago")')
    
    // Fill payment form
    await page.fill('input[type="number"]', '1000')
    const typeSelect = page.locator('select').first()
    await typeSelect.selectOption('total')
    
    // Submit payment
    await page.click('button:has-text("Guardar pago")')
    
    // Wait for payment to appear in list
    await page.waitForTimeout(500)
    await expect(page.locator('text=$1.000')).toBeVisible()

    // ─── 5. Verify Summary Updated ────────────────────────────────────────
    await expect(page.locator('text=Pago completo')).toBeVisible()
  })

  test('User can view calendar and navigate to event', async ({ page }) => {
    // ─── 1. Login with existing account ────────────────────────────────────
    await page.goto('/')
    
    // If we're on login page, fill in credentials
    const emailInput = page.locator('input[type="email"]')
    if (await emailInput.isVisible()) {
      await emailInput.fill(testEmail)
      await page.fill('input[type="password"]', testPassword)
      await page.click('button:has-text("Ingresar")')
      await page.waitForURL('/dashboard', { timeout: 10000 })
    }

    // ─── 2. Navigate to Calendar ──────────────────────────────────────────
    await page.click('a:has-text("Calendario")')
    await page.waitForURL('/calendar')
    
    // Verify calendar is visible
    await expect(page.locator('text=Próximos eventos')).toBeVisible()

    // ─── 3. Click on a date with events (if any) ──────────────────────────
    const eventCard = page.locator('[class*="event-card"]').first()
    if (await eventCard.isVisible()) {
      await eventCard.click()
      await page.waitForURL(/\/events\//, { timeout: 10000 })
      await expect(page).toHaveURL(/\/events\//)
    }
  })

  test('User can filter events on dashboard', async ({ page }) => {
    // ─── 1. Login ─────────────────────────────────────────────────────────
    await page.goto('/dashboard')
    
    // Wait for auth check
    await page.waitForLoadState('networkidle')
    
    // If redirected to login, sign in first
    const emailInput = page.locator('input[type="email"]')
    if (await emailInput.isVisible()) {
      await emailInput.fill(testEmail)
      await page.fill('input[type="password"]', testPassword)
      await page.click('button:has-text("Ingresar")')
      await page.waitForURL('/dashboard', { timeout: 10000 })
    }

    // ─── 2. Open Filters ──────────────────────────────────────────────────
    await page.click('button:has-text("Filtros")')
    
    // Verify filter panel opened
    await expect(page.locator('label:has-text("Estado")')).toBeVisible()

    // ─── 3. Filter by Status ──────────────────────────────────────────────
    const statusSelect = page.locator('select').filter({ hasText: 'Estado' }).first()
    await statusSelect.selectOption('confirmed')
    
    // Wait for results to update
    await page.waitForTimeout(500)
    
    // Verify table still has content
    await expect(page.locator('table')).toBeVisible()

    // ─── 4. Test Clear Filters ────────────────────────────────────────────
    await page.click('button:has-text("Limpiar filtros")')
    await page.waitForTimeout(300)
    
    // Verify status filter reset
    const status = await statusSelect.inputValue()
    expect(status).toBe('')
  })
})
