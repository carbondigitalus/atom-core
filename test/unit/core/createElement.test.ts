import { describe, it, expect, beforeAll } from '@jest/globals';

import { PropsWithChildren } from '@atomdev/core/utils/types/PropsWithChildren';
import { createElement } from '../../../src/core/createElement';

describe('createElement', () => {
  beforeAll(() => {
    // setup if needed
  });

  describe('Basic element creation', () => {
    it('should create VNode with string type', () => {
      const vnode = createElement('div', { id: 'test' });

      expect(vnode.type).toBe('div');
      expect(vnode.props.id).toBe('test');
    });

    it('should handle null props', () => {
      const vnode = createElement('span', null);
      expect(vnode.type).toBe('span');
      expect(vnode.props).toEqual({});
    });

    it('should handle undefined props', () => {
      const vnode = createElement('p', undefined);
      expect(vnode.type).toBe('p');
      expect(vnode.props).toEqual({});
    });
  });

  describe('Children handling', () => {
    it('should handle single child', () => {
      const vnode = createElement('div', null, 'Hello World');
      expect(vnode.props['children']).toStrictEqual(['Hello World']);
    });

    it('should handle multiple children', () => {
      const vnode = createElement('div', null, 'Child 1', 'Child 2', 'Child 3');
      const children = (vnode.props as PropsWithChildren).children;

      expect(Array.isArray(children)).toBe(true);
      expect(children).toEqual(['Child 1', 'Child 2', 'Child 3']);
    });

    it('should prefer children in props over spread children', () => {
      const vnode = createElement('div', { children: 'Props child' }, 'Spread child');

      expect(vnode.props['children']).toBe('Props child');
    });
  });

  describe('Key handling', () => {
    it('should preserve key from props', () => {
      const vnode = createElement('li', { key: 'item-1', id: 'test' });

      expect(vnode.props['key']).toBe('item-1');
      expect(vnode.props['id']).toBe('test');
    });

    it('should handle key with children', () => {
      const vnode = createElement('li', { key: 'item-2' }, 'List item');

      expect(vnode.props['key']).toBe('item-2');
      expect(vnode.props['children']).toStrictEqual(['List item']);
    });
  });
});
