import { test, expect } from '@playwright/test';
import { v4 as uuidv4 } from 'uuid';

const BACKEND_URL = 'http://localhost:8080';

// --- GENERADOR DE CÉDULA ECUATORIANA ---
function generarCedulaEcuatorianaValida(): string {
    const provincia = String(Math.floor(Math.random() * 24) + 1).padStart(2, '0');
    const tercerDigito = String(Math.floor(Math.random() * 6));
    let siguienteSeis = '';
    for (let i = 0; i < 6; i++) {
        siguienteSeis += Math.floor(Math.random() * 10);
    }

    const base = provincia + tercerDigito + siguienteSeis;
    const digitos = base.split('').map(d => parseInt(d, 10));

    let sum = 0;
    for (let i = 0; i < 9; i++) {
        const coefficient = i % 2 === 0 ? 2 : 1;
        let mult = digitos[i] * coefficient;
        if (mult >= 10) mult -= 9;
        sum += mult;
    }

    const modulo = sum % 10;
    const verificador = modulo === 0 ? 0 : 10 - modulo;

    return base + verificador;
}

test('Registro + verificación con bypass funcionando', async ({ page, request }) => {
    const email = `test-${uuidv4()}@test.com`;
    const password = 'Password123Aa';
    const cedula = generarCedulaEcuatorianaValida();

    // ------------------ 1. FORMULARIO ------------------
    await test.step('1. Completar formulario Signup', async () => {
        await page.goto('/signup');

        await page.fill('input[name="nationalId"]', cedula);
        await page.fill('input[name="firstName"]', 'Test');
        await page.fill('input[name="lastName"]', 'User');
        await page.fill('input[name="email"]', email);
        await page.fill('input[name="phone"]', '0987654321');

        // --- ADDRESS ---
        const addressTrigger = page.locator('label:has-text("Address")').locator('..').locator('button[role="combobox"]');
        await addressTrigger.click();
        const addressInput = page.locator('input[placeholder="Type to search (min 5 characters)..."]');
        await addressInput.fill('Quito');
        await page.locator('div[role="option"]').first().waitFor({ state: 'visible' });
        await page.locator('div[role="option"]').first().click();

        // --- GENDER ---
        const genderTrigger = page.locator('label:has-text("Gender")').locator('..').locator('button');
        await genderTrigger.click();
        await page.locator('div[role="option"]', { hasText: 'Male' }).first().click();
        const genderOption = page.locator('div[role="option"]', { hasText: 'Male' }).first();

        // --- PASSWORD ---
        await page.fill('input[name="password"]', password);
        await page.fill('input[name="confirmPassword"]', password);

        await page.click('button[type="submit"]');
        await expect(page).toHaveURL(/\/verify$/);
    });

    // ------------------ 2. BYPASS DEL CÓDIGO ------------------
    let verificationCode = '';
    await test.step('2. Obtener código desde /testing', async () => {
        const response = await request.get(
            `${BACKEND_URL}/testing/code?email=${email}&type=VERIFICATION`
        );

        expect(response.ok()).toBe(true);
        const data = await response.json();

        expect(data.code).toBeTruthy();
        verificationCode = data.code;
        console.log('Código recibido:', verificationCode);
    });

    // ------------------ 3. INGRESAR OTP ------------------
    await test.step('3. Ingresar OTP', async () => {
        const digits = verificationCode.split('');
        const otpSlots = await page.locator('[data-slot="input-otp-slot"]').all();

        expect(otpSlots.length).toBe(6);

        for (let i = 0; i < digits.length; i++) {
            await otpSlots[i].click({ force: true });
            await page.keyboard.type(digits[i]);
        }
        await page.click('button:has-text("Verify")');
        await expect(page).toHaveURL(/\/login$/);
    });

    // ------------------ 4. CLEANUP ------------------
    await test.step('4. Borrar usuario creado', async () => {
        const res = await request.delete(`${BACKEND_URL}/testing/user?email=${email}`);
        expect(res.ok()).toBe(true);
    });
});
