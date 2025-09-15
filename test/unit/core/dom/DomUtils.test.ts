/** @jest-environment jsdom */

// NPM Modules
import { expect, jest } from '@jest/globals';

// Custom Modules
import {
  executeRefCallback,
  attachEventListener,
  setElementAttribute,
  applyPropsToElement,
  attachComponentToNode,
  processAfterMountRecursively,
  createTextNode,
  createElement
} from '@atomdev/core/core/dom/DOMUtils';
import ComponentAttachedNode from '@atomdev/core/utils/interfaces/ComponentAttachedNode';

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

  describe('executeRefCallback', () => {
    it('should execute ref callback with element', () => {
      const refCallback = jest.fn();
      const element = document.createElement('div');

      executeRefCallback(refCallback, element);

      expect(refCallback).toHaveBeenCalledWith(element);
    });

    it('should handle ref callback errors gracefully', () => {
      const refCallback = jest.fn(() => {
        throw new Error('Ref callback error');
      });
      const element = document.createElement('div');

      expect(() => executeRefCallback(refCallback, element)).not.toThrow();
      expect(consoleErrorSpy).toHaveBeenCalledWith('Ref callback error:', expect.any(Error));
    });
  });

  describe('attachEventListener', () => {
    it('should attach event listener to element', () => {
      const element = document.createElement('button');
      const handler = jest.fn();

      attachEventListener(element, 'click', handler);

      // Simulate click event
      element.click();
      expect(handler).toHaveBeenCalled();
    });

    it('should attach multiple event listeners', () => {
      const element = document.createElement('input');
      const clickHandler = jest.fn();
      const focusHandler = jest.fn();

      attachEventListener(element, 'click', clickHandler);
      attachEventListener(element, 'focus', focusHandler);

      element.click();
      element.dispatchEvent(new FocusEvent('focus'));

      expect(clickHandler).toHaveBeenCalled();
      expect(focusHandler).toHaveBeenCalled();
    });

    it('should handle custom events', () => {
      const element = document.createElement('div');
      const handler = jest.fn();

      attachEventListener(element, 'custom-event', handler);

      // Dispatch custom event
      const customEvent = new CustomEvent('custom-event');
      element.dispatchEvent(customEvent);

      expect(handler).toHaveBeenCalled();
    });
  });

  describe('setElementAttribute', () => {
    it('should set string attribute', () => {
      const element = document.createElement('div');

      setElementAttribute(element, 'id', 'test-id');

      expect(element.getAttribute('id')).toBe('test-id');
    });

    it('should convert number to string', () => {
      const element = document.createElement('input');

      setElementAttribute(element, 'tabindex', 42);

      expect(element.getAttribute('tabindex')).toBe('42');
    });

    it('should convert boolean to string', () => {
      const element = document.createElement('div');

      setElementAttribute(element, 'data-active', true);

      expect(element.getAttribute('data-active')).toBe('true');
    });

    it('should handle null and undefined', () => {
      const element = document.createElement('div');

      setElementAttribute(element, 'data-null', null);
      setElementAttribute(element, 'data-undefined', undefined);

      expect(element.getAttribute('data-null')).toBe('null');
      expect(element.getAttribute('data-undefined')).toBe('undefined');
    });

    it('should handle object values', () => {
      const element = document.createElement('div');
      const obj = { key: 'value' };

      setElementAttribute(element, 'data-object', obj);

      expect(element.getAttribute('data-object')).toBe('[object Object]');
    });
  });

  describe('applyPropsToElement', () => {
    it('should skip children prop', () => {
      const element = document.createElement('div');
      const props = {
        children: ['child1', 'child2'],
        id: 'test'
      };

      applyPropsToElement(element, props);

      expect(element.getAttribute('id')).toBe('test');
      expect(element.getAttribute('children')).toBeNull();
    });

    it('should handle ref callback', () => {
      const element = document.createElement('div');
      const refCallback = jest.fn();
      const props = {
        ref: refCallback,
        id: 'test'
      };

      applyPropsToElement(element, props);

      expect(refCallback).toHaveBeenCalledWith(element);
      expect(element.getAttribute('ref')).toBeNull();
      expect(element.getAttribute('id')).toBe('test');
    });

    it('should handle event listeners', () => {
      const element = document.createElement('button');
      const clickHandler = jest.fn();
      const mouseOverHandler = jest.fn();
      const props = {
        onClick: clickHandler,
        onMouseOver: mouseOverHandler,
        id: 'button'
      };

      applyPropsToElement(element, props);

      element.click();
      element.dispatchEvent(new MouseEvent('mouseover'));

      expect(clickHandler).toHaveBeenCalled();
      expect(mouseOverHandler).toHaveBeenCalled();
      expect(element.getAttribute('id')).toBe('button');
    });

    it('should handle mixed props types', () => {
      const element = document.createElement('input');
      const changeHandler = jest.fn();
      const refCallback = jest.fn();
      const props = {
        type: 'text',
        placeholder: 'Enter text',
        maxLength: 100,
        disabled: false,
        onChange: changeHandler,
        ref: refCallback,
        'data-testid': 'input-field'
      };

      applyPropsToElement(element, props);

      expect(element.getAttribute('type')).toBe('text');
      expect(element.getAttribute('placeholder')).toBe('Enter text');
      expect(element.getAttribute('maxLength')).toBe('100');
      expect(element.getAttribute('disabled')).toBe('false');
      expect(element.getAttribute('data-testid')).toBe('input-field');
      expect(refCallback).toHaveBeenCalledWith(element);

      // Test event listener
      element.dispatchEvent(new Event('change'));
      expect(changeHandler).toHaveBeenCalled();
    });

    it('should handle empty props object', () => {
      const element = document.createElement('div');
      const props = {};

      expect(() => applyPropsToElement(element, props)).not.toThrow();
    });

    it('should handle ref callback errors', () => {
      const element = document.createElement('div');
      const refCallback = jest.fn(() => {
        throw new Error('Ref error');
      });
      const props = {
        ref: refCallback,
        id: 'test'
      };

      expect(() => applyPropsToElement(element, props)).not.toThrow();
      expect(consoleErrorSpy).toHaveBeenCalledWith('Ref callback error:', expect.any(Error));
      expect(element.getAttribute('id')).toBe('test');
    });
  });

  describe('attachComponentToNode', () => {
    it('should attach component to DOM node', () => {
      const node = document.createElement('div');
      const component = {
        __canInvokeAfterMount: jest.fn<() => boolean>(() => true),
        __markAfterMountCalled: jest.fn<() => void>(),
        afterMount: jest.fn<() => void>()
      };

      attachComponentToNode(node, component);

      const attachedNode = node as ComponentAttachedNode;
      expect(attachedNode.__atomComponent).toBe(component);
    });

    it('should attach component with minimal interface', () => {
      const node = document.createElement('div');
      const component = {
        afterMount: jest.fn<() => void>()
      };

      attachComponentToNode(node, component);

      const attachedNode = node as ComponentAttachedNode;
      expect(attachedNode.__atomComponent).toBe(component);
    });

    it('should attach component to text node', () => {
      const node = document.createTextNode('text');
      const component = {
        afterMount: jest.fn<() => void>()
      };

      attachComponentToNode(node, component);

      const attachedNode = node as ComponentAttachedNode;
      expect(attachedNode.__atomComponent).toBe(component);
    });
  });

  describe('processAfterMountRecursively', () => {
    it('should process node with attached component', async () => {
      const node = document.createElement('div');
      const component = {
        __canInvokeAfterMount: jest.fn<() => boolean>(() => true),
        __markAfterMountCalled: jest.fn<() => void>(),
        afterMount: jest.fn<() => void>()
      };

      attachComponentToNode(node, component);

      await processAfterMountRecursively(node);

      expect(component.__markAfterMountCalled).toHaveBeenCalled();
      expect(component.afterMount).toHaveBeenCalled();

      // Component reference should be cleaned up
      const attachedNode = node as ComponentAttachedNode;
      expect(attachedNode.__atomComponent).toBeUndefined();
    });

    it('should process async afterMount', async () => {
      const node = document.createElement('div');
      let asyncCompleted = false;
      const component = {
        __canInvokeAfterMount: jest.fn(() => true),
        __markAfterMountCalled: jest.fn(),
        afterMount: jest.fn(async () => {
          await new Promise((resolve) => setTimeout(resolve, 10));
          asyncCompleted = true;
        })
      };

      attachComponentToNode(node, component);

      await processAfterMountRecursively(node);

      expect(asyncCompleted).toBe(true);
      expect(component.afterMount).toHaveBeenCalled();
    });

    it('should handle afterMount errors gracefully', async () => {
      const node = document.createElement('div');
      const component = {
        __canInvokeAfterMount: jest.fn(() => true),
        __markAfterMountCalled: jest.fn(),
        afterMount: jest.fn(() => {
          throw new Error('AfterMount error');
        })
      };

      attachComponentToNode(node, component);

      await expect(processAfterMountRecursively(node)).resolves.not.toThrow();
      expect(consoleErrorSpy).toHaveBeenCalledWith('afterMount() error:', expect.any(Error));

      // Component reference should still be cleaned up
      const attachedNode = node as ComponentAttachedNode;
      expect(attachedNode.__atomComponent).toBeUndefined();
    });

    it('should process nested components recursively', async () => {
      const parentNode = document.createElement('div');
      const childNode = document.createElement('span');
      const grandChildNode = document.createElement('p');

      parentNode.appendChild(childNode);
      childNode.appendChild(grandChildNode);

      const parentComponent = {
        __canInvokeAfterMount: jest.fn<() => boolean>(() => true),
        __markAfterMountCalled: jest.fn<() => void>(),
        afterMount: jest.fn<() => void>()
      };

      const childComponent = {
        __canInvokeAfterMount: jest.fn<() => boolean>(() => true),
        __markAfterMountCalled: jest.fn<() => void>(),
        afterMount: jest.fn<() => void>()
      };

      const grandChildComponent = {
        __canInvokeAfterMount: jest.fn<() => boolean>(() => true),
        __markAfterMountCalled: jest.fn<() => void>(),
        afterMount: jest.fn<() => void>()
      };

      attachComponentToNode(parentNode, parentComponent);
      attachComponentToNode(childNode, childComponent);
      attachComponentToNode(grandChildNode, grandChildComponent);

      await processAfterMountRecursively(parentNode);

      expect(parentComponent.afterMount).toHaveBeenCalled();
      expect(childComponent.afterMount).toHaveBeenCalled();
      expect(grandChildComponent.afterMount).toHaveBeenCalled();
    });

    it('should skip nodes without attached components', async () => {
      const node = document.createElement('div');
      const childNode = document.createElement('span');
      node.appendChild(childNode);

      await expect(processAfterMountRecursively(node)).resolves.not.toThrow();
    });

    it('should handle nodes without __canInvokeAfterMount method', async () => {
      const node = document.createElement('div');
      const component = {
        afterMount: jest.fn<() => void>()
      };

      attachComponentToNode(node, component);

      await processAfterMountRecursively(node);

      expect(component.afterMount).toHaveBeenCalled();
    });

    it('should not call afterMount if __canInvokeAfterMount returns false', async () => {
      const node = document.createElement('div');

      const component = {
        __canInvokeAfterMount: jest.fn<() => boolean>(() => false),
        __markAfterMountCalled: jest.fn<() => void>(),
        afterMount: jest.fn<() => void>()
      };

      attachComponentToNode(node, component);

      await processAfterMountRecursively(node);

      expect(component.__canInvokeAfterMount).toHaveBeenCalled();
      expect(component.__markAfterMountCalled).not.toHaveBeenCalled();
      expect(component.afterMount).not.toHaveBeenCalled();
    });

    it('should handle async afterMount errors', async () => {
      const node = document.createElement('div');
      const component = {
        __canInvokeAfterMount: jest.fn(() => true),
        __markAfterMountCalled: jest.fn(),
        afterMount: jest.fn(async () => {
          await new Promise((resolve) => setTimeout(resolve, 10));
          throw new Error('Async afterMount error');
        })
      };

      attachComponentToNode(node, component);

      await expect(processAfterMountRecursively(node)).resolves.not.toThrow();
      expect(consoleErrorSpy).toHaveBeenCalledWith('afterMount() error:', expect.any(Error));
    });
  });

  describe('createTextNode', () => {
    it('should create text node with string content', () => {
      const textNode = createTextNode('Hello World');

      expect(textNode.nodeType).toBe(Node.TEXT_NODE);
      expect(textNode.textContent).toBe('Hello World');
    });

    it('should convert number to string', () => {
      const textNode = createTextNode(42);

      expect(textNode.nodeType).toBe(Node.TEXT_NODE);
      expect(textNode.textContent).toBe('42');
    });

    it('should handle empty string', () => {
      const textNode = createTextNode('');

      expect(textNode.nodeType).toBe(Node.TEXT_NODE);
      expect(textNode.textContent).toBe('');
    });

    it('should handle zero', () => {
      const textNode = createTextNode(0);

      expect(textNode.nodeType).toBe(Node.TEXT_NODE);
      expect(textNode.textContent).toBe('0');
    });
  });

  describe('createElement', () => {
    it('should create HTML element with correct tag', () => {
      const element = createElement('div');

      expect(element.tagName).toBe('DIV');
      expect(element.nodeType).toBe(Node.ELEMENT_NODE);
    });

    it('should create different element types', () => {
      const button = createElement('button');
      const input = createElement('input');
      const span = createElement('span');

      expect(button.tagName).toBe('BUTTON');
      expect(input.tagName).toBe('INPUT');
      expect(span.tagName).toBe('SPAN');
    });

    it('should create element that can be manipulated', () => {
      const element = createElement('div');

      element.id = 'test';
      element.className = 'test-class';
      element.textContent = 'Test content';

      expect(element.id).toBe('test');
      expect(element.className).toBe('test-class');
      expect(element.textContent).toBe('Test content');
    });
  });
});
