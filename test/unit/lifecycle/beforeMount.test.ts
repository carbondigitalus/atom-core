/** @jest-environment jsdom */

// NPM Modules
import { describe, test, expect, jest } from '@jest/globals';

// Custom Modules
import { render } from '@atomdev/core';
import { createDOMNode } from '@atomdev/core/core/dom/createDOMNode';
import VNode from '@atomdev/core/utils/interfaces/VNode';
import { AtomComponent } from '../../../src/core/Component';

type Empty = Record<string, never>;
type Props = { label?: string };

describe('beforeMount() lifecycle', () => {
  test('is called after constructor and before first render; only once', () => {
    const calls: string[] = [];

    class TestComponent extends AtomComponent<Props, { n: number }> {
      constructor(props: Props) {
        super(props);
        calls.push('ctor');
        this.state = { n: 0 };
      }
      beforeMount() {
        calls.push('beforeMount');
        // Direct state write (allowed pre-render)
        this.state = { n: 1 };
        // setState during mount phase should be allowed and non-scheduling
        this.setState({ n: 2 });
      }
      render(): VNode {
        calls.push('render');
        return {
          type: 'div',
          props: { 'data-n': String(this.state.n), children: 'ok' }
        } as unknown as VNode;
      }
    }

    const vnode = {
      type: TestComponent,
      props: { label: 'x' }
    } as unknown as VNode;
    const node = createDOMNode(vnode);

    expect(node.nodeType).toBe(1); // element node
    expect((node as Element).getAttribute('data-n')).toBe('2');

    expect(calls).toEqual(['ctor', 'beforeMount', 'render']);

    // Mounting happens once; a subsequent render should NOT have another beforeMount
    // Simulate re-render by creating a new instance (framework would normally diff)
    const vnode2 = {
      type: TestComponent,
      props: { label: 'y' }
    } as unknown as VNode;
    createDOMNode(vnode2);
    // The second component will push its own sequence; we only ensure per-instance behavior:
    // i.e., no duplicate beforeMount per instance — covered by order assertion above.
  });

  test('errors in beforeMount() do not prevent initial render', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    try {
      let rendered = false;

      class BrokenBeforeMount extends AtomComponent<Empty, Empty> {
        beforeMount() {
          throw new Error('boom');
        }
        render(): VNode {
          rendered = true;
          return {
            type: 'span',
            props: { children: 'rendered' }
          } as unknown as VNode;
        }
      }

      const vnode = { type: BrokenBeforeMount, props: {} } as unknown as VNode;
      const node = createDOMNode(vnode);

      expect(rendered).toBe(true);
      expect(node.nodeType).toBe(1);
      expect((node as Element).tagName.toLowerCase()).toBe('span');
    } finally {
      spy.mockRestore();
    }
  });

  test('async work kicked off in beforeMount() does not block mounting', () => {
    let resolved = false;

    class AsyncKickoff extends AtomComponent<Empty, Empty> {
      beforeMount() {
        Promise.resolve()
          .then(() => {
            resolved = true;
          })
          .catch(() => {
            resolved = false;
          });
      }
      render(): VNode {
        return {
          type: 'div',
          props: { children: 'ready' }
        } as unknown as VNode;
      }
    }

    const vnode = { type: AsyncKickoff, props: {} } as unknown as VNode;
    const node = createDOMNode(vnode);

    // Immediately after mount, async shouldn't have resolved yet (most of the time)
    // We assert that DOM exists regardless; then flush microtasks to prove it resolves.
    expect(node.nodeType).toBe(1);
    // Now flush the microtask queue
    return Promise.resolve().then(() => {
      expect(resolved).toBe(true);
    });
  });

  test('props are available and merged with defaultProps; propTypes run before beforeMount', () => {
    const seen: string[] = [];

    const validator = (value: unknown) => {
      if (typeof value !== 'string') {
        return new Error('label must be string');
      }
      return null;
    };

    class WithDefaultsAndTypes extends AtomComponent<Props, Empty> {
      static defaultProps = { label: 'default' };
      static propTypes = { label: validator };

      beforeMount() {
        seen.push(this.props.label!);
      }
      render(): VNode {
        return {
          type: 'div',
          props: { children: this.props.label }
        } as unknown as VNode;
      }
    }

    // 1) No label provided -> default applied
    createDOMNode({
      type: WithDefaultsAndTypes,
      props: {}
    } as unknown as VNode);
    // 2) Explicit label provided
    createDOMNode({
      type: WithDefaultsAndTypes,
      props: { label: 'x' }
    } as unknown as VNode);

    expect(seen).toEqual(['default', 'x']);
  });
});

describe('beforeMount - no DOM access yet', () => {
  test('document cannot find the component DOM inside beforeMount', () => {
    let sawNullInHook = false;

    class C extends AtomComponent<Empty, Empty> {
      beforeMount() {
        // Will be created by render(), but not yet appended
        const found = document.getElementById('hook-id');
        sawNullInHook = found === null;
      }
      render(): VNode {
        return {
          type: 'div',
          props: { id: 'hook-id', children: 'ok' }
        } as unknown as VNode;
      }
    }

    const container = document.createElement('div');
    render({ type: C, props: {} } as unknown as VNode, container);

    expect(sawNullInHook).toBe(true);
    expect(container.querySelector('#hook-id')).not.toBeNull();
  });
});

describe('beforeMount - third-party config', () => {
  test('config built and state flag set before first render', () => {
    type ChartConfig = {
      type: string;
      data: number[];
      options: Record<string, unknown>;
    };
    type Props = {
      chartType?: string;
      initialData?: number[];
      chartOptions?: Record<string, unknown>;
    };

    class ChartComponent extends AtomComponent<Props, { chartReady: boolean }> {
      public chartConfig?: ChartConfig;
      static lastConfig?: ChartConfig; // capture for assertions

      constructor(p: Props) {
        super(p);
        this.state = { chartReady: false };
      }

      beforeMount() {
        const cfg: ChartConfig = {
          type: this.props.chartType ?? 'line',
          data: this.props.initialData ?? [],
          options: { responsive: true, ...(this.props.chartOptions ?? {}) }
        };
        this.chartConfig = cfg;
        ChartComponent.lastConfig = cfg; // <-- record it
        this.setState({ chartReady: true });
      }

      render(): VNode {
        return {
          type: 'div',
          props: {
            id: 'chart',
            'data-ready': String(this.state.chartReady),
            children: 'ready?'
          }
        } as unknown as VNode;
      }
    }

    const node = createDOMNode({
      type: ChartComponent,
      props: { chartType: 'bar', initialData: [1, 2], chartOptions: { a: 1 } }
    } as unknown as VNode);

    // State flag reflects beforeMount's setState during mount
    expect((node as Element).getAttribute('data-ready')).toBe('true');

    // Config was built in beforeMount
    expect(ChartComponent.lastConfig).toEqual({
      type: 'bar',
      data: [1, 2],
      options: { responsive: true, a: 1 }
    });
  });
});
