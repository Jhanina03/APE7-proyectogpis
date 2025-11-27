import { test, expect } from '@playwright/test';

test('manual report of inappropriate product by users', async ({ page }) => {
  // 1. Primer usuario crea producto cuestionable
  await page.goto('http://localhost:5173/login');
  await page.getByRole('textbox', { name: 'Email' }).fill('duqixaga@fxzig.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('maca04SC');
  await page.getByRole('button', { name: 'Login' }).click();

  // Crear producto que podría generar reportes manuales
  await page.getByRole('button', { name: 'GM' }).click();
  await page.getByRole('menuitem', { name: 'My Products' }).click();
  await page.getByRole('button', { name: 'Create Product' }).click();

  await page.getByRole('textbox', { name: 'Product Name *' }).fill('Used Boxers for Sale');
  await page.getByRole('textbox', { name: 'Description *' }).fill('Boxers Calvin Klein for Sale, almost new, only used few times!');
  await page.getByRole('combobox', { name: 'Category *' }).click();
  await page.getByRole('option', { name: '👗 Fashion' }).click();
  await page.getByRole('spinbutton', { name: 'Price ($) *' }).fill('10');

  await page.getByRole('combobox').filter({ hasText: 'Search for address...' }).click();
  await page.getByPlaceholder('Type to search (min 5').fill('Montalvo Ambato');
  await page.getByRole('option', { name: 'Montalvo, Ambato Tungurahua,' }).click();

  await page.getByRole('button', { name: 'Create Product' }).click();
  await page.goto("http://localhost:5173/my-products");


  // Verificar que el producto se creó exitosamente
  await expect(page.getByRole('link', { name: 'Used Boxers for Sale' }).first()).toBeVisible();
  await expect(page.getByText('ACTIVE').first()).toBeVisible();

  // 2. Logout y login como segundo usuario para reportar
  await page.getByRole('button', { name: 'GM' }).click();
  await page.getByRole('menuitem', { name: 'Logout' }).click();

  await page.getByRole('textbox', { name: 'Email' }).fill('sebas28cn@gmail.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('maca04SC');
  await page.getByRole('button', { name: 'Login' }).click();

  // Encontrar y reportar el producto manualmente
  await page.getByRole('button', { name: '🔍 View All' }).click();
  await page.getByRole('complementary').getByRole('button', { name: '👗 Fashion' }).click();
  await page.waitForTimeout(10000);
  await expect(page.locator('.bg-card').first()).toBeVisible();
  await expect(page.getByRole('link', { name: 'Used Boxers for Sale Used' })).toBeVisible();


  // Reportar el producto
  await page.getByRole('button').filter({ hasText: /^$/ }).first().click();
  await page.getByRole('combobox', { name: 'Report Type *' }).click();
  await page.getByRole('option', { name: '⚠️ Inappropriate Offensive or' }).click();
  await page.getByRole('textbox', { name: 'Additional Details (Optional)' }).fill('It is unhealthy to sell used underwear, do better!');
  await page.getByRole('button', { name: 'Submit Report' }).click();
  await page.waitForSelector('[role="dialog"]', { state: 'detached' });

  await expect(page.getByText('Report submitted successfully!')).toBeVisible();

  // 3. Logout y login como moderador para aceptar el reporte
  await page.getByRole('button', { name: 'SC' }).click();
  await page.getByRole('menuitem', { name: 'Logout' }).click();

  await page.getByRole('textbox', { name: 'Email' }).fill('sebastianconstante04@hotmail.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('maca04SC');
  await page.getByRole('button', { name: 'Login' }).click();

  // Revisar y aceptar el reporte manual
  await page.getByRole('button', { name: 'Moderate' }).click();
  await page.getByRole('link', { name: 'Reports' }).click();
  await page.getByRole('tab', { name: 'Manual Reports' }).click();

  await page.getByRole('button', { name: 'Review' }).first().click();
  await page.getByRole('button', { name: 'Accept Report' }).click();
  await page.waitForSelector('[role="dialog"]', { state: 'detached' });

  await expect(page.getByText('Incident accepted successfully!')).toBeVisible();

  // 4. Logout y verificar que el producto está suspendido
  await page.getByRole('button', { name: 'SA Santiago Antiago' }).click();
  await page.getByRole('menuitem', { name: 'Logout' }).click();

  await page.getByRole('textbox', { name: 'Email' }).fill('duqixaga@fxzig.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('maca04SC');
  await page.getByRole('button', { name: 'Login' }).click();

  // Verificar que el producto fue suspendido
  await page.getByRole('button', { name: 'GM' }).click();
  await page.getByRole('menuitem', { name: 'My Products' }).click();


  await page.getByRole('button', { name: 'Appeal' }).first().click();
  await page.getByRole('button', { name: 'Cancel' }).click();
  await expect(page.getByRole('link', { name: 'Used Boxers for Sale' }).first()).toBeVisible();
  await expect(page.locator('#root')).toContainText('SUSPENDED');
});