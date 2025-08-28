import { describe, it, expect } from '@jest/globals';
import { jsxDEV, Fragment } from '../../../src/runtime/jsx-dev-runtime';
import { createElement } from '../../../src/core/createElement';

describe('jsxDEV-runtime', () => {
  it('creates VNode without children', () => {
    const vnode = jsxDEV('div', { id: 'test' });
    const expected = createElement('div', {
      id: 'test',
      __source: undefined,
      __self: undefined
    });
    expect(vnode).toStrictEqual(expected);
  });

  it('creates VNode with single string child', () => {
    const vnode = jsxDEV('span', { children: 'Hello' });
    const expected = createElement(
      'span',
      { __source: undefined, __self: undefined },
      'Hello'
    );
    expect(vnode).toStrictEqual(expected);
  });

  it('creates VNode with multiple children', () => {
    const vnode = jsxDEV('ul', { children: ['One', 'Two'] });
    const expected = createElement(
      'ul',
      { __source: undefined, __self: undefined },
      'One',
      'Two'
    );
    expect(vnode).toStrictEqual(expected);
  });

  it('flattens nested arrays and filters falsey children', () => {
    const vnode = jsxDEV('ul', {
      children: [null, false, 'A', ['B', ['C', null], undefined], 'D']
    });
    const expected = createElement(
      'ul',
      { __source: undefined, __self: undefined },
      'A',
      'B',
      'C',
      'D'
    );
    expect(vnode).toStrictEqual(expected);
  });

  it('preserves key if provided', () => {
    const vnode = jsxDEV('li', { children: 'Item' }, 'my-key');
    expect(vnode.props.key).toBe('my-key');
  });

  it('attaches __source and __self', () => {
    const fakeSource = { fileName: 'test.tsx', lineNumber: 10 };
    const fakeSelf = { component: 'Test' };
    const vnode = jsxDEV(
      'div',
      { children: 'Dev' },
      undefined,
      false,
      fakeSource,
      fakeSelf
    );

    const props = vnode.props as typeof vnode.props & {
      __source?: unknown;
      __self?: unknown;
    };

    expect(props.__source).toEqual(fakeSource);
    expect(props.__self).toEqual(fakeSelf);
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
