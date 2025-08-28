/**
 * @jest-environment jsdom
 */

// NPM Modules
import { describe, it, expect, jest } from '@jest/globals';
import { Children } from '@atomdev/core/utils/types/Children';
import { createDOMNode } from '../../../src/core/createDOMNode';

describe('createDOMNode', () => {
  it('renders null/undefined/boolean to empty text node', () => {
    const nullNode = createDOMNode(null);
    const undefNode = createDOMNode(undefined);
    const trueNode = createDOMNode(true);
    const falseNode = createDOMNode(false);

    expect(nullNode.nodeType).toBe(Node.TEXT_NODE);
    expect(nullNode.textContent).toBe('');
    expect(undefNode.textContent).toBe('');
    expect(trueNode.textContent).toBe('');
    expect(falseNode.textContent).toBe('');
  });

  it('renders string primitives as text nodes', () => {
    const node = createDOMNode('Hello World');
    expect(node.nodeType).toBe(Node.TEXT_NODE);
    expect(node.textContent).toBe('Hello World');
  });

  it('renders number primitives as text nodes', () => {
    const node = createDOMNode(42);
    expect(node.nodeType).toBe(Node.TEXT_NODE);
    expect(node.textContent).toBe('42');
  });

  it('renders arrays as document fragments', () => {
    const node = createDOMNode(['One', 'Two', 'Three']);
    expect(node.nodeType).toBe(Node.DOCUMENT_FRAGMENT_NODE);
    expect(node.childNodes).toHaveLength(3);
    expect(node.childNodes[0].textContent).toBe('One');
    expect(node.childNodes[1].textContent).toBe('Two');
    expect(node.childNodes[2].textContent).toBe('Three');
  });

  it('renders intrinsic VNode with attributes', () => {
    const vnode = {
      type: 'div',
      props: { id: 'test-div', class: 'foo' }
    };
    const node = createDOMNode(vnode);

    expect(node.nodeType).toBe(Node.ELEMENT_NODE);
    const el = node as HTMLElement;
    expect(el.tagName.toLowerCase()).toBe('div');
    expect(el.getAttribute('id')).toBe('test-div');
    expect(el.getAttribute('class')).toBe('foo');
  });

  it('renders intrinsic VNode with children', () => {
    const vnode = {
      type: 'ul',
      props: {
        children: [
          { type: 'li', props: { children: 'Item 1' } },
          { type: 'li', props: { children: 'Item 2' } }
        ]
      }
    };
    const node = createDOMNode(vnode);
    const ul = node as HTMLUListElement;

    expect(ul.tagName.toLowerCase()).toBe('ul');
    expect(ul.childNodes).toHaveLength(2);
    expect(ul.childNodes[0].textContent).toBe('Item 1');
    expect(ul.childNodes[1].textContent).toBe('Item 2');
  });

  it('adds event listeners from props', () => {
    const handleClick = jest.fn();
    const vnode = {
      type: 'button',
      props: { onClick: handleClick, children: 'Click Me' }
    };
    const node = createDOMNode(vnode);
    const btn = node as HTMLButtonElement;

    // simulate a click
    btn.click();
    expect(handleClick).toHaveBeenCalledTimes(1);
    expect(btn.textContent).toBe('Click Me');
  });

  it('falls back to text node for unknown object', () => {
    const node = createDOMNode({ foo: 'bar' } as unknown as Children);
    expect(node.nodeType).toBe(Node.TEXT_NODE);
    expect(node.textContent).toBe('');
  });
});
