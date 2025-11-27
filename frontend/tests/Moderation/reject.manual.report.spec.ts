import { test, expect } from '@playwright/test';

test.only('reject manual report', async ({ page }) => {
  // 1. Primer usuario crea el producto coleccionable
  await page.goto('http://localhost:5173/login');
  await page.getByRole('textbox', { name: 'Email' }).fill('duqixaga@fxzig.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('maca04SC');
  await page.getByRole('button', { name: 'Login' }).click();

  // Crear producto vintage coleccionable
  await page.getByRole('button', { name: 'GM' }).click();
  await page.getByRole('menuitem', { name: 'My Products' }).click();
  await page.getByRole('button', { name: 'Create Product' }).click();

  await page.getByRole('textbox', { name: 'Product Name *' }).fill('Vintage Ashtray Collection');
  await page.getByRole('textbox', { name: 'Description *' }).fill('Beautiful vintage glass ashtrays from the 1970s. Perfect for collectors or as decorative pieces.');
  await page.getByRole('combobox', { name: 'Category *' }).click();
  await page.getByRole('option', { name: '🏠 Home & Garden' }).click();
  await page.getByRole('spinbutton', { name: 'Price ($) *' }).fill('99.99');

  await page.getByRole('combobox').filter({ hasText: 'Search for address...' }).click();
  await page.getByPlaceholder('Type to search (min 5').fill('Ficoa Ambato');
  await page.getByRole('option', { name: 'Ficoa Park, Avenida Rodrigo' }).click();

  await page.getByRole('button', { name: 'Create Product' }).click();
  await page.goto("http://localhost:5173/my-products");

  // Verificar que el producto está activo
  await expect(page.locator('#root')).toContainText('ACTIVE');
  await expect(page.getByRole('link', { name: 'Vintage Ashtray Collection' }).first()).toBeVisible();

  // 2. Logout y login como usuario que reporta
  await page.getByRole('button', { name: 'GM' }).click();
  await page.getByRole('menuitem', { name: 'Logout' }).click();

  await page.getByRole('textbox', { name: 'Email' }).fill('sebastianconstante04@hotmail.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('maca04SC');
  await page.getByRole('button', { name: 'Login' }).click();

  // Reportar el producto manualmente
  await page.getByRole('button', { name: 'Moderate' }).click();
  await page.getByRole('link', { name: 'Products' }).click();
  await page.getByRole('textbox', { name: 'Search products by name or' }).click();
  await page.getByRole('textbox', { name: 'Search products by name or' }).fill('Ashtray');
  await page.getByRole('button', { name: 'Report product' }).first().click();
  await page.getByRole('combobox', { name: 'Report Type *' }).click();
  await page.getByRole('option', { name: '🚫 Dangerous Weapons, drugs,' }).click();
  await page.getByRole('textbox', { name: 'Additional Details (Optional)' }).fill('Induces the smoking activity');
  await page.getByRole('button', { name: 'Submit Report' }).click();

  // 3. Logout y login como moderador para rechazar el reporte
  await page.getByRole('button', { name: 'SA Santiago Antiago' }).click();
  await page.getByRole('menuitem', { name: 'Logout' }).click();

  await page.getByRole('textbox', { name: 'Email' }).fill('sconstante8@icloud.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('maca04SC');
  await page.getByRole('button', { name: 'Login' }).click();

  // Revisar y rechazar el reporte manual
  await page.getByRole('button', { name: 'Moderate' }).click();
  await page.getByRole('link', { name: 'Reports' }).click();
  await page.getByRole('tab', { name: 'Manual Reports' }).click();

  await expect(page.locator('.bg-card').first()).toBeVisible();
  await expect(page.getByRole('link', { name: 'Vintage Ashtray Collection' }).first()).toBeVisible();

  await page.getByRole('button', { name: 'Review' }).first().click();
  await page.getByRole('button', { name: 'Reject Report' }).click();
  await page.waitForSelector('[role="dialog"]', { state: 'detached' });

  await expect(page.getByText('Incident rejected successfully!')).toBeVisible();


  // 4. Verificar que el producto sigue activo en el marketplace
  await page.getByRole('link', { name: 'SafeTrade' }).click();
  await page.getByRole('button', { name: '🔍 View All' }).click();
  await page.getByRole('complementary').getByRole('button', { name: '🏠 Home & Garden' }).click();
  await page.waitForTimeout(10000);
  await expect(page.getByRole('link', { name: 'Vintage Ashtray Collection' }).first()).toBeVisible();
});