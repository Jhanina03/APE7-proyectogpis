import { test, expect } from '@playwright/test';

test('automatic content detection and moderation flow', async ({ page }) => {
  // 1. Login como usuario normal
  await page.goto('http://localhost:5173/login');
  await page.getByRole('textbox', { name: 'Email' }).fill('sebas28cn@gmail.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('maca04SC');
  await page.getByRole('button', { name: 'Login' }).click();

  // 2. Crear producto peligroso (debe ser detectado automáticamente)
  await page.getByRole('button', { name: 'SC' }).click();
  await page.getByRole('menuitem', { name: 'My Products' }).click();
  await page.getByRole('button', { name: 'Create Product' }).click();

  await page.getByRole('textbox', { name: 'Product Name *' }).fill('Illegal Drugs Violence');
  await page.getByRole('textbox', { name: 'Description *' }).fill('Illegal Drugs for Sale, they harm people');
  await page.getByRole('combobox', { name: 'Category *' }).click();
  await page.getByRole('option', { name: '📦 Other' }).click();
  await page.getByRole('combobox', { name: 'Type *' }).click();
  await page.getByRole('option', { name: 'Product' }).click();
  await page.getByRole('spinbutton', { name: 'Price ($) *' }).fill('200.99');

  await page.getByRole('combobox').filter({ hasText: 'Search for address...' }).click();
  await page.getByPlaceholder('Type to search (min 5').fill('Mall de los Andes');
  await page.getByRole('option', { name: 'Mall de los Andes, Avenida Atahualpa, Presidencial, Ambato Tungurahua, 180208, Ecuador', exact: true }).click();

  await page.getByRole('button', { name: 'Create Product' }).click();
  await page.goto("http://localhost:5173/my-products");

  // 3. Verificar que el producto fue reportado automáticamente
  await expect(page.getByRole('link', { name: 'Illegal Drugs Violence' }).nth(1)).toBeVisible();
  await expect(page.locator('#root')).toContainText('REPORTED');

  // 4. Logout y login como moderador
  await page.getByRole('button', { name: 'SC' }).click();
  await page.getByRole('menuitem', { name: 'Logout' }).click();

  await page.getByRole('textbox', { name: 'Email' }).fill('sebastianconstante04@hotmail.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('maca04SC');
  await page.getByRole('button', { name: 'Login' }).click();

  // 5. Revisar y aceptar el reporte automático
  await page.getByRole('button', { name: 'Moderate' }).click();
  await page.getByRole('link', { name: 'Reports' }).click();
  await page.getByRole('tab', { name: 'Automatic Reports' }).click();

  await expect(page.locator('.bg-card').first()).toBeVisible();
  await expect(page.getByRole('link', { name: 'Illegal Drugs Violence' }).first()).toBeVisible();

  await page.getByRole('button', { name: 'Review' }).first().click();
  await page.getByRole('button', { name: 'Accept Report' }).click();
  await page.waitForSelector('[role="dialog"]', { state: 'detached' });

  // 6. Logout y login como usuario original
  await page.getByRole('button', { name: 'SA Santiago Antiago' }).click();
  await page.getByRole('menuitem', { name: 'Logout' }).click();

  await page.getByRole('textbox', { name: 'Email' }).fill('sebas28cn@gmail.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('maca04SC');
  await page.getByRole('button', { name: 'Login' }).click();

  // 7. Verificar que el producto está suspendido
  await page.getByRole('button', { name: 'SC' }).click();
  await page.getByRole('menuitem', { name: 'My Products' }).click();

  await expect(page.locator('#root')).toContainText('SUSPENDED');

  // 8. Verificar opción de apelación
  await page.getByRole('button', { name: 'Appeal' }).first().click();
  await page.getByRole('button', { name: 'Cancel' }).click();

  await expect(page.getByText('Automatically detected as').first()).toBeVisible();
});
