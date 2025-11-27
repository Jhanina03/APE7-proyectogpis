import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('http://localhost:5173/login');
  await page.getByRole('textbox', { name: 'Email' }).fill('olahhhh5@gmail.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('Root123456');
  await page.getByRole('button', { name: 'Login' }).click();

  await page.getByRole('button', { name: 'CP' }).click();
  await page.getByRole('menuitem', { name: 'My Products' }).click();
  // CREAR PRODUCTO
  await page.getByRole('button', { name: 'Create Product' }).click();

  await page.getByRole('textbox', { name: 'Product Name *' }).fill('prueba producto');
  await page.getByRole('textbox', { name: 'Description *' }).fill('probando crud de productos');
  await page.getByRole('combobox', { name: 'Type *' }).click();
  await page.getByRole('option', { name: 'Product' }).click();

  await page.getByRole('combobox', { name: 'Category *' }).click();
  await page.getByLabel('📱 Electronics').getByText('📱 Electronics').click();

  await page.getByRole('spinbutton', { name: 'Price ($) *' }).fill('20.10');

  await page.getByRole('combobox').filter({ hasText: 'Search for address...' }).click();
  await page.getByPlaceholder('Type to search (min 5').fill('Techo Propio');
  await page.getByRole('option', { name: 'Techo Propio, Ambato Tungurahua, 180110, Ecuador', exact: true }).click();

  const [fileChooser1] = await Promise.all([
    page.waitForEvent('filechooser'),
    page.getByRole('button', { name: 'Upload Images' }).click(),
  ]);

  await fileChooser1.setFiles([
    'tests/assets/Imagen1.jfif',
    'tests/assets/Imagen2.jfif'
  ]);

  await page.getByRole('button', { name: 'Create Product' }).click();

  //EDITAR PRODUCTO
  await page.waitForSelector('[role="dialog"]', { state: 'detached' });
  await page.goto('http://localhost:5173/my-products');
  await page.getByRole('button', { name: 'Edit product' }).click();

  await page.getByRole('textbox', { name: 'Product Name *' }).fill('prueba producto editado');
  await page.getByRole('textbox', { name: 'Description *' }).fill('probando crud de productos editando');

  await page.getByRole('combobox', { name: 'Type *' }).click();
  await page.getByRole('option', { name: 'Service' }).click();

  await page.getByRole('spinbutton', { name: 'Price ($) *' }).fill('13');

  await page.getByRole('combobox').filter({ hasText: 'Techo Propio, Ambato,' }).click();
  await page.getByPlaceholder('Type to search (min 5').fill('Ambato');
  await page.locator('#radix-_r_1l_').click();

  await page.getByRole('textbox', { name: 'Service Hours' }).fill('Lunes a Domingo de 1 a 3');
  await page.getByRole('checkbox', { name: 'Available' }).uncheck();

  await page.getByRole('button').nth(1).click();

  const [fileChooser2] = await Promise.all([
    page.waitForEvent('filechooser'),
    page.getByRole('button', { name: 'Upload Images' }).click(),
  ]);

  await fileChooser2.setFiles([
    'tests/assets/Imagen3.jpg'
  ]);

  await page.getByRole('button', { name: 'Update Product' }).click();
  await page.waitForSelector('[role="dialog"]', { state: 'detached' });

  // ELIMINAR PRODUCTO
  await page.goto('http://localhost:5173/my-products');
  await page.locator('div').filter({ hasText: 'Unavailableprueba producto' }).nth(4).click();
  await page.getByRole('button', { name: 'Delete product' }).click();
  await page.getByRole('button', { name: 'Delete' }).click();

  await page.goto('http://localhost:5173/my-products');
});
