import { $ } from '@wdio/globals';
import type { ChainablePromiseElement } from 'webdriverio';
import BasePage from './base.page';

class ButtonPage extends BasePage {
  get button(): ChainablePromiseElement {
    return $('#primary');
  }

  get output(): ChainablePromiseElement {
    return $('#output');
  }

  async clickButton() {
    await this.button.click();
  }
}

export default new ButtonPage();
