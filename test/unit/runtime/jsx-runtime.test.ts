import { describe, it, expect } from '@jest/globals';
import { jsx, jsxs, Fragment } from '../../../src/runtime/jsx-runtime';
import { createElement } from '../../../src/core/createElement';
import { Children } from '@atomdev/core/utils/types/Children';

describe('jsx-runtime', () => {
  describe('jsx', () => {
    it('creates VNode without children', () => {
      const vnode = jsx('div', { id: 'test' });
      const expected = createElement('div', { id: 'test' });
      expect(vnode).toStrictEqual(expected);
    });

    it('creates VNode with single string child', () => {
      const vnode = jsx('span', { children: 'Hello' });
      const expected = createElement('span', {}, 'Hello');
      expect(vnode).toStrictEqual(expected);
    });

    it('flattens nested/falsey children into a clean array', () => {
      const vnode = jsx('p', {
        children: ['Hello', null, false, ['World', undefined]] as Children
      });
      const expected = createElement('p', {}, 'Hello', 'World');
      expect(vnode).toStrictEqual(expected);
    });

    it('preserves key if provided', () => {
      const vnode = jsx('li', { children: 'Item' }, 'my-key');
      expect(vnode.props.key).toBe('my-key');
    });
  });

  describe('jsxs', () => {
    it('creates VNode with multiple children', () => {
      const vnode = jsxs('div', { children: ['One', 'Two', 'Three'] });
      const expected = createElement('div', {}, 'One', 'Two', 'Three');
      expect(vnode).toStrictEqual(expected);
    });

    it('creates VNode without children (jsxs)', () => {
      const vnode = jsxs('section', { id: 'no-children' });
      const expected = createElement('section', { id: 'no-children' });
      expect(vnode).toStrictEqual(expected);
    });

    it('flattens deeply nested arrays and removes null/false/undefined', () => {
      const vnode = jsxs('ul', {
        children: [
          null,
          false,
          'A',
          ['B', ['C', null], false],
          undefined,
          'D'
        ] as Children
      });
      const expected = createElement('ul', {}, 'A', 'B', 'C', 'D');
      expect(vnode).toStrictEqual(expected);
    });

    it('preserves key if provided', () => {
      const vnode = jsxs('li', { children: ['Nested'] }, 'list-key');
      expect(vnode.props.key).toBe('list-key');
    });
  });

  describe('Fragment', () => {
    it('returns children when provided', () => {
      const out = Fragment({ children: ['One', 'Two'] });
      expect(out).toStrictEqual(['One', 'Two']);
    });

    it('returns null if no children', () => {
      const out = Fragment({});
      expect(out).toBeNull();
    });
  });
});
