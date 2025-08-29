// NPM Modules
import { browser as rawBrowser } from '@wdio/globals';
import type { Browser as WdioBrowser } from 'webdriverio';

// Re-type the import to the full WDIO browser so `.url()` is known
const browser = rawBrowser as unknown as WdioBrowser;

export default class BasePage {
  async open(path: string = '/') {
    await browser.url(path);
  }
}
