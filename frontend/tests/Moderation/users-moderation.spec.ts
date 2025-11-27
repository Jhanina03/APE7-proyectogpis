import { test, expect } from '@playwright/test';

test('moderator management flow', async ({ page }) => {
  await page.goto('http://localhost:5173/login');

  // Iniciar sesión como moderador - simplificado
  await page.getByRole('textbox', { name: 'Email' }).fill('sconstante8@icloud.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('maca04SC');
  await page.getByRole('button', { name: 'Login' }).click();

  // Dirigirse al panel de moderación
  await page.getByRole('button', { name: 'Moderate' }).click();
  await page.getByRole('link', { name: 'Moderators' }).click();

  // Crear nuevo moderador - simplificado
  await page.getByRole('button', { name: 'Create Moderator' }).click();
  await page.getByRole('textbox', { name: 'National ID' }).fill('1802699627');
  await page.getByRole('textbox', { name: 'First Name' }).fill('Moderador');
  await page.getByRole('textbox', { name: 'Last Name' }).fill('Prueba');
  await page.getByRole('textbox', { name: 'Email' }).fill('hnaranjoc@gmail.com');
  await page.getByRole('textbox', { name: 'Phone Number' }).fill('0998047078');

  // Buscar dirección - simplificado
  await page.getByRole('combobox').filter({ hasText: 'Search for address...' }).click();
  await page.getByPlaceholder('Type to search (min 5').fill('La Pradera Ambato');
  await page.getByRole('option', { name: 'La Pradera, Avenida Atahualpa' }).click();

  await page.getByRole('combobox', { name: 'Gender' }).click();
  await page.getByRole('option', { name: 'Female' }).click();
  await page.getByRole('button', { name: 'Create Moderator' }).click();
  await page.waitForSelector('[role="dialog"]', { state: 'detached' });

  // Verificar creación y probar activación/desactivación
  await expect(page.locator('.bg-card').first()).toBeVisible();

  // Desactivar y activar moderador
  await page.getByRole('button', { name: 'Deactivate' }).first().click();
  await page.getByRole('button', { name: 'Deactivate' }).click();
  await page.goto("http://localhost:5173/moderation/moderators")
  await page.getByRole('button', { name: 'Activate', exact: true }).first().click();
  await page.getByRole('button', { name: 'Activate' }).click();
  await page.goto("http://localhost:5173/moderation/moderators")

  // Buscar moderador
  await page.getByRole('textbox', { name: 'Search by name, email, or ID' }).fill('Moderador');
  await expect(page.locator('.bg-card')).toBeVisible();

  // Filtrar por estado activo
  await page.getByRole('combobox').click();
  await page.getByRole('option', { name: 'Active Only', exact: true }).click();
  await expect(page.locator('.bg-card')).toBeVisible();

  // Dirigirse a la sección de usuarios
  await page.getByRole('link', { name: 'Clients' }).click();

  // Desactivar y activar usuario
  await page.getByRole('button', { name: 'Deactivate' }).first().click();
  await page.getByRole('button', { name: 'Deactivate' }).click();
  await page.goto("http://localhost:5173/moderation/clients")

  await expect(page.getByRole('main')).toContainText('Activate');

  await page.getByRole('button', { name: 'Activate', exact: true }).first().click();
  await page.getByRole('button', { name: 'Activate' }).click();
  await page.goto("http://localhost:5173/moderation/clients")

});