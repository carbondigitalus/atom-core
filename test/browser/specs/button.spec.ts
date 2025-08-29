// NPM Modules
import { expect } from '@wdio/globals';

// Custom Modules
import ButtonPage from '../pageobjects/button.page';

describe('Button component (browser harness)', () => {
  it('toggles pressed state and updates UI', async () => {
    await ButtonPage.open('/button.html');

    const button = ButtonPage.button;
    const output = ButtonPage.output;

    await button.waitForExist();
    await expect(button).toHaveAttribute('aria-pressed', 'false');
    await expect(output).toHaveText('idle');

    await ButtonPage.clickButton();

    await expect(button).toHaveAttribute('aria-pressed', 'true');
    await expect(output).toHaveText('clicked');
    await expect(button).toHaveElementClass('active');
  });
});
