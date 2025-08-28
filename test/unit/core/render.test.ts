/**
 * @jest-environment jsdom
 */

// NPM Modules
import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Custom Modules
import { render } from '../../../src/core/render';
import type { Children } from '../../../src/utils/types/Children';

describe('render', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  it('clears the container before rendering', () => {
    container.innerHTML = '<span>Old content</span>';

    render('New content' as Children, container);

    expect(container.innerHTML).toBe('New content');
  });

  it('renders primitive string', () => {
    render('Hello World' as Children, container);

    expect(container.textContent).toBe('Hello World');
    expect(container.childNodes).toHaveLength(1);
    expect(container.childNodes[0].nodeType).toBe(Node.TEXT_NODE);
  });

  it('renders number primitive', () => {
    render(123 as unknown as Children, container);

    expect(container.textContent).toBe('123');
  });

  it('renders array of children', () => {
    render(['One', 'Two', 'Three'] as Children, container);

    expect(container.childNodes).toHaveLength(3);
    expect(container.textContent).toBe('OneTwoThree');
  });

  it('renders intrinsic VNode with props and children', () => {
    const vnode = {
      type: 'ul',
      props: {
        id: 'list',
        children: [
          { type: 'li', props: { children: 'Item 1' } },
          { type: 'li', props: { children: 'Item 2' } }
        ]
      }
    };

    render(vnode as Children, container);

    const ul = container.querySelector('#list') as HTMLUListElement;
    expect(ul).not.toBeNull();
    expect(ul.childNodes).toHaveLength(2);
    expect(ul.childNodes[0].textContent).toBe('Item 1');
    expect(ul.childNodes[1].textContent).toBe('Item 2');
  });

  it('attaches event listeners', () => {
    const handleClick = jest.fn();

    const vnode = {
      type: 'button',
      props: { onClick: handleClick, children: 'Click Me' }
    };

    render(vnode as Children, container);

    const btn = container.querySelector('button') as HTMLButtonElement;
    expect(btn).not.toBeNull();

    btn.click();
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
