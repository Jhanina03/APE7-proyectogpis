import { test, expect } from '@playwright/test';

const BACKEND_URL = 'http://localhost:8080';

test('Recuperar contraseña con bypass de código', async ({ page, request }) => {
    const existingEmail = 'daylegrimm2004@gmail.com';
    const newPassword = 'NewSecurePassword456';

    await test.step('1. Iniciar el flujo de Forgot Password y Obtener Código', async () => {

        await page.goto('/forgot-password');
        await page.fill('input[name="email"]', existingEmail);
        await page.click('button:has-text("Send Reset Code")');

        // Obtener código desde el backend
        const response = await request.get(`${BACKEND_URL}/testing/code?email=${existingEmail}&type=RECOVERY`);
        const data = await response.json();

        expect(response.ok()).toBe(true);
        expect(data.code).toBeTruthy();

        const recoveryCode = data.code;

        // Forzar email en sessionStorage
        await page.evaluate((email) => {
            sessionStorage.setItem("pendingPasswordResetEmail", email);
        }, existingEmail);

        await page.goto('/reset-password');

        await page.getByText('Reset Your Password').waitFor({ state: 'visible' });

        // Completar OTP
        const digits = recoveryCode.split('');

        const otpSlots = await page.locator('[data-slot="input-otp-slot"]').all();

        expect(otpSlots.length).toBe(6);

        for (let i = 0; i < digits.length; i++) {
            await otpSlots[i].click({ force: true });
            await page.keyboard.type(digits[i]);
        }

        // Rellenar contraseñas
        await page.fill('input[name="newPassword"]', newPassword);
        await page.fill('input[name="confirmPassword"]', newPassword);
    });

    await test.step('2. Completar el Reset Password y Verificar Login', async () => {

        await page.click('button:has-text("Reset Password")');

        await expect(page).toHaveURL(/.*\/login/);

        await test.step('2.3 Verificar Login con Nueva Contraseña', async () => {
            await page.fill('input[name="email"]', existingEmail);
            await page.fill('input[name="password"]', newPassword);
            await page.click('button:has-text("Login")');
            await expect(page).toHaveURL(/localhost:5173\/?$/);
        });
    });
});
