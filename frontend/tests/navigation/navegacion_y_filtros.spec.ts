import { test, expect } from '@playwright/test';

test('filters test - slow motion', async ({ page }) => {

  const slow = async (ms = 900) => {
    await page.waitForTimeout(ms);
  };

  await page.goto('http://localhost:5173/login');
  await slow();

  // LOGIN
  await page.getByLabel("Email").fill('daylegrimm2004@gmail.com');
  await slow();
  await page.getByLabel("Password").fill('NewSecurePassword456');
  await slow();
  await page.getByRole('button', { name: 'Login' }).click();
  await slow();

  // OPEN PRODUCTS PAGE
  await page.getByRole('button', { name: /browse/i }).click();
  await slow(1200);

  const slider = page.getByRole("slider").first();
  const box = await slider.boundingBox();

  if (box) {
    const centerX = box.x + box.width / 2;
    const centerY = box.y + box.height / 2;

    // MOVER HACIA LA DERECHA 30px
    await page.mouse.move(centerX, centerY);
    await page.mouse.down();
    await slow(400);
    await page.mouse.move(centerX + 30, centerY);
    await slow(400);
    await page.mouse.up();
    await slow(1000);

    // MOVER HACIA LA IZQUIERDA 30px
    await page.mouse.move(centerX + 30, centerY);
    await page.mouse.down();
    await slow(400);
    await page.mouse.move(centerX - 30, centerY);
    await slow(400);
    await page.mouse.up();
    await slow(1000);
  }

  const clickFilter = async (name: string) => {
    await page
      .getByRole('complementary')
      .locator(`button:has(span):has-text("${name}")`)
      .click();
    await slow();
  };

  await clickFilter("Electronics");
  await clickFilter("Fashion");
  await clickFilter("Home & Garden");
  await clickFilter("Services");
  await clickFilter("Sports & Outdoors");
  await clickFilter("Books & Media");
  await clickFilter("Toys & Games");
  await clickFilter("Automotive");
  await clickFilter("Other");

  // ===== CLEAR FILTERS =====
  await page.getByRole('button', { name: /clear/i }).click();
  await slow();

  // ===== AVAILABILITY =====
  await page.getByRole('button', { name: /available/i }).click();
  await slow();
  await page.getByRole('button', { name: /available/i }).click();
  await slow();

  // ===== NEARBY PRODUCTS =====
  await page.getByRole('button', { name: /nearby/i }).click();
  await slow();

  await page.getByRole('button', { name: /showing nearby/i }).click();
  await slow();

  const radius = page.getByRole("slider").nth(1);
  if (await radius.isVisible()) {
    const rbox = await radius.boundingBox();

    if (rbox) {
      const cx = rbox.x + rbox.width / 2;
      const cy = rbox.y + rbox.height / 2;

      // mover derecha
      await page.mouse.move(cx, cy);
      await page.mouse.down();
      await slow();
      await page.mouse.move(cx + 40, cy);
      await slow();
      await page.mouse.up();
      await slow();

      // mover izquierda
      await page.mouse.move(cx + 40, cy);
      await page.mouse.down();
      await slow();
      await page.mouse.move(cx - 40, cy);
      await slow();
      await page.mouse.up();
      await slow();
    }
  }

  await slow(1500);
});
