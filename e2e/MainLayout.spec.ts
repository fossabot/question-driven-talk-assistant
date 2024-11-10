import { test, expect } from '@playwright/test';
import { QRCodeComponentPage } from './pageobjects/QRCodeComponentPage';
import {MainLayoutPage} from "./pageobjects/MainLayoutPage";

test.describe('MainLayout e2e tests', () => {
    let mainLayoutPage: MainLayoutPage;

    test.beforeEach(async ({ page }) => {
        mainLayoutPage = new MainLayoutPage(page);
        await mainLayoutPage.goto();
    });

    test('should edit header in MainLayout', async () => {
        // given
        let newTitle = 'New Title';
        expect(await mainLayoutPage.header.textContent()).not.toBe(newTitle);

        // when
        await mainLayoutPage.editHeader(newTitle);

        // then
        expect(await mainLayoutPage.header.textContent()).toBe(newTitle);
    });

    test('should edit footer in MainLayout', async () => {
        // given
        let newFooter = 'New Footer';
        expect(await mainLayoutPage.footer.textContent()).not.toBe(newFooter);

        // when
        await mainLayoutPage.editFooter(newFooter);

        // then
        expect(await mainLayoutPage.footer.textContent()).toBe(newFooter);
    });

    test('should toggle time format in TimeDisplay', async () => {
        // given
        const initialTime = await mainLayoutPage.timeDisplay.textContent();

        // when
        await mainLayoutPage.toggleTimeFormat();
        const toggledTime = await mainLayoutPage.timeDisplay.textContent();

        // then
        // TODO potentially flaky, if toggled right before minute advances
        expect(toggledTime).not.toEqual(initialTime);
    });

    test('should not open fullscreen QR code when URL is empty', async () => {
        // when
        await mainLayoutPage.toggleFullscreenQRCode();

        // then
        await expect(mainLayoutPage.fullscreenQRCode).toBeHidden();
    });

    test('should open and close fullscreen QR code', async ({ page }) => {
        // given
        const qrCodeComponentPage = new QRCodeComponentPage(page);
        await qrCodeComponentPage.setExampleQrCodeURL();

        // when
        await mainLayoutPage.toggleFullscreenQRCode();

        // then
        await expect(mainLayoutPage.fullscreenQRCode).toBeVisible();

        // when
        await mainLayoutPage.toggleFullscreenQRCode();

        // then
        await expect(mainLayoutPage.fullscreenQRCode).toBeHidden();
    });
});