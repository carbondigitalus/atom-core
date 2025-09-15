/** @jest-environment jsdom */

// NPM Modules
import { expect, jest } from '@jest/globals';

// Custom Modules
import {
  applyPropsToElement,
  attachComponentToNode,
  processAfterMountRecursively,
  createTextNode,
  createElement
} from '@atomdev/core/core/dom/DOMUtils';

describe('DOMUtils', () => {
  let consoleErrorSpy: ReturnType<typeof jest.spyOn>;

  beforeEach(() => {
    // Mock console.error to avoid cluttering test output
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    // Clear document body
    document.body.innerHTML = '';
  });

  afterEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    consoleErrorSpy.mockRestore();
    jest.clearAllMocks();
  });

  describe('Integration Tests', () => {
    it('should handle complete DOM manipulation workflow', async () => {
      // Create elements
      const container = createElement('div');
      const button = createElement('button');
      const textNode = createTextNode('Click me');

      // Set up component
      const component = {
        __canInvokeAfterMount: jest.fn<() => boolean>(() => true),
        __markAfterMountCalled: jest.fn<() => void>(),
        afterMount: jest.fn<() => void>()
      };

      // Build DOM structure
      button.appendChild(textNode);
      container.appendChild(button);
      document.body.appendChild(container);

      // Apply props
      const clickHandler = jest.fn();
      const refCallback = jest.fn();
      applyPropsToElement(button, {
        onClick: clickHandler,
        ref: refCallback,
        'data-testid': 'test-button',
        disabled: false
      });

      // Attach component and process
      attachComponentToNode(container, component);
      await processAfterMountRecursively(container);

      // Verify everything works
      expect(refCallback).toHaveBeenCalledWith(button);
      expect(button.getAttribute('data-testid')).toBe('test-button');
      expect(component.afterMount).toHaveBeenCalled();

      // Test event handling
      button.dispatchEvent(new MouseEvent('click'));
      expect(clickHandler).toHaveBeenCalled();

      // Cleanup
      document.body.removeChild(container);
    });

    it('should handle complex nested component tree', async () => {
      const callOrder: string[] = [];

      // Create DOM structure
      const root = createElement('div');
      const header = createElement('header');
      const nav = createElement('nav');
      const main = createElement('main');

      root.appendChild(header);
      root.appendChild(nav);
      root.appendChild(main);

      // Create components that track call order
      const rootComponent = {
        afterMount: jest.fn<() => void>(() => callOrder.push('root'))
      };
      const headerComponent = {
        afterMount: jest.fn<() => void>(() => callOrder.push('header'))
      };
      const navComponent = {
        afterMount: jest.fn<() => void>(() => callOrder.push('nav'))
      };
      const mainComponent = {
        afterMount: jest.fn<() => void>(() => callOrder.push('main'))
      };

      // Attach components
      attachComponentToNode(root, rootComponent);
      attachComponentToNode(header, headerComponent);
      attachComponentToNode(nav, navComponent);
      attachComponentToNode(main, mainComponent);

      // Process the tree
      await processAfterMountRecursively(root);

      // All components should have been processed
      expect(callOrder).toContain('root');
      expect(callOrder).toContain('header');
      expect(callOrder).toContain('nav');
      expect(callOrder).toContain('main');
      expect(callOrder).toHaveLength(4);
    });
  });
});
