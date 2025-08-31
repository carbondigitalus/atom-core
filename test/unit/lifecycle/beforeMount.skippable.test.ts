/** @jest-environment jsdom */

// NPM Modules
import { describe, test, expect } from '@jest/globals';

// Custom Modules
import { AtomComponent } from '../../../src/core/Component';
import { createDOMNode } from '../../../src/core/createDOMNode';
import type { VNode } from '../../../src/utils/interfaces/VNode';

type Empty = Record<string, never>;

describe('beforeMount() is skippable when not defined', () => {
  test('component without beforeMount still mounts and renders', () => {
    class NoBefore extends AtomComponent<Empty, { v: number }> {
      constructor(p: Empty) {
        super(p);
        this.state = { v: 42 };
      }
      render(): VNode {
        return {
          type: 'div',
          props: {
            id: 'no-before',
            'data-v': String(this.state.v),
            children: 'ok'
          }
        } as unknown as VNode;
      }
    }

    const vnode = { type: NoBefore, props: {} } as unknown as VNode;
    const node = createDOMNode(vnode);

    expect(node.nodeType).toBe(1);
    const el = node as Element;
    expect(el.id).toBe('no-before');
    expect(el.getAttribute('data-v')).toBe('42');
    expect(el.textContent).toBe('ok');
  });
});
