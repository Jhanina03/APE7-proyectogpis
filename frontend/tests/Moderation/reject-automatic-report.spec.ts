import { test, expect } from '@playwright/test';

test('automatic detection and moderation rejection', async ({ page }) => {
  // 1. Login como usuario normal
  await page.goto('http://localhost:5173/login');
  await page.getByRole('textbox', { name: 'Email' }).fill('sebas28cn@gmail.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('maca04SC');
  await page.getByRole('button', { name: 'Login' }).click();

  // 2. Crear producto con título peligroso (debe ser detectado automáticamente)
  await page.getByRole('button', { name: 'SC' }).click();
  await page.getByRole('menuitem', { name: 'My Products' }).click();
  await page.getByRole('button', { name: 'Create Product' }).click();

  // Título que debe ser detectado como peligroso inmediatamente
  await page.getByRole('textbox', { name: 'Product Name *' }).fill('AK47 Gun for kids Illegal');
  await page.getByRole('textbox', { name: 'Description *' }).fill('Similar to real life AK47 gun, has bullets and aim trainer');
  await page.getByRole('combobox', { name: 'Category *' }).click();
  await page.getByLabel('🎮 Toys & Games').getByText('🎮 Toys & Games').click();
  await page.getByRole('spinbutton', { name: 'Price ($) *' }).fill('60');

  await page.getByRole('combobox').filter({ hasText: 'Search for address...' }).click();
  await page.getByPlaceholder('Type to search (min 5').fill('Montalvo Ambato');
  await page.getByRole('option', { name: 'Montalvo, Ambato Tungurahua,' }).click();

  await page.getByRole('button', { name: 'Create Product' }).click();
  await page.goto("http://localhost:5173/my-products");

  // 3. Verificar que el producto fue reportado automáticamente
  await expect(page.getByRole('link', { name: 'AK47 Gun for kids Illegal' }).first()).toBeVisible();
  await expect(page.locator('#root')).toContainText('REPORTED');

  // 4. Logout y login como moderador
  await page.getByRole('button', { name: 'SC' }).click();
  await page.getByRole('menuitem', { name: 'Logout' }).click();

  await page.getByRole('textbox', { name: 'Email' }).fill('sebastianconstante04@hotmail.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('maca04SC');
  await page.getByRole('button', { name: 'Login' }).click();

  // 5. Revisar y rechazar el reporte automático
  await page.getByRole('button', { name: 'Moderate' }).click();
  await page.getByRole('link', { name: 'Reports' }).click();
  await page.getByRole('tab', { name: 'Automatic Reports' }).click();

  await expect(page.locator('.bg-card').first()).toBeVisible();
  await page.getByRole('button', { name: 'Review' }).first().click();
  await page.getByRole('button', { name: 'Reject Report' }).click();
  await page.waitForSelector('[role="dialog"]', { state: 'detached' });


  // 6. Verificar que el reporte fue rechazado
  await expect(page.getByText('Incident rejected successfully!')).toBeVisible();

  // 7. Logout y login como usuario original
  await page.getByRole('button', { name: 'SA Santiago Antiago' }).click();
  await page.getByRole('menuitem', { name: 'Logout' }).click();

  await page.getByRole('textbox', { name: 'Email' }).fill('sebas28cn@gmail.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('maca04SC');
  await page.getByRole('button', { name: 'Login' }).click();

  // 8. Verificar que el producto está activo después del rechazo
  await page.getByRole('button', { name: 'SC' }).click();
  await page.getByRole('menuitem', { name: 'My Products' }).click();
  await expect(page.locator('#root')).toContainText('ACTIVE');

  // 9. Verificar que el producto es visible en el marketplace
  await page.getByRole('link', { name: 'SafeTrade' }).click();
  await page.getByRole('button', { name: '🔍 View All' }).click();
  await expect(page.getByRole('link', { name: 'AK47 Gun for kids Illegal' })).toBeVisible();
});