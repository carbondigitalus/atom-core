// NPM Modules
import { describe, it, expect } from '@jest/globals';

import { createElement as rootCreateElement, render as rootRender } from '../../src';
import { createElement as directCreateElement } from '../../src/core/createElement';
import { render as directRender } from '../../src/core/render';

describe('barrel exports', () => {
  it('re-exports createElement', () => {
    expect(rootCreateElement).toBe(directCreateElement);
  });

  it('re-exports render', () => {
    expect(rootRender).toBe(directRender);
  });
});
