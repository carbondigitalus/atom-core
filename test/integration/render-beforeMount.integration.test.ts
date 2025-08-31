/** @jest-environment jsdom */

// NPM Modules
import { describe, test, expect } from '@jest/globals';

// Custom Modules
import { render } from '@atomdev/core';
import { AtomComponent } from '@atomdev/core/core/Component';
import { VNode } from '@atomdev/core/utils/interfaces/VNode';

type Empty = Record<string, never>;

describe('render() integration with beforeMount()', () => {
  test('data from setState in beforeMount reflects in first DOM', () => {
    class C extends AtomComponent<Empty, { v: number }> {
      constructor(p: Empty) {
        super(p);
        this.state = { v: 0 };
      }
      beforeMount() {
        this.setState({ v: 7 });
      }
      render(): VNode {
        return {
          type: 'div',
          props: { id: 'x', 'data-v': String(this.state.v) }
        } as unknown as VNode;
      }
    }

    const container = document.createElement('div');
    const vnode = { type: C, props: {} } as unknown as VNode;

    render(vnode, container);

    const el = container.querySelector('#x')!;
    expect(el).not.toBeNull();
    expect(el.getAttribute('data-v')).toBe('7');
  });
});
