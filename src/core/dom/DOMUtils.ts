/**
 * Interface for DOM nodes that may have attached component instances
 */
export interface ComponentAttachedNode extends Node {
  __atomComponent?: {
    __canInvokeAfterMount?: () => boolean;
    __markAfterMountCalled?: () => void;
    afterMount?: () => void | Promise<void>;
  };
}

/**
 * Handles ref callback execution with error handling
 * @param refCallback - The ref callback function
 * @param element - The DOM element to pass to the callback
 */
export function executeRefCallback(
  refCallback: (el: HTMLElement | null) => void,
  element: HTMLElement
): void {
  try {
    refCallback(element);
  } catch (refError) {
    console.error('Ref callback error:', refError);
  }
}

/**
 * Sets up event listeners on a DOM element
 * @param element - The DOM element
 * @param eventName - The event name (e.g., 'click')
 * @param handler - The event handler function
 */
export function attachEventListener(
  element: HTMLElement,
  eventName: string,
  handler: EventListener
): void {
  element.addEventListener(eventName, handler);
}

/**
 * Sets an attribute on a DOM element with string conversion
 * @param element - The DOM element
 * @param key - The attribute name
 * @param value - The attribute value
 */
export function setElementAttribute(
  element: HTMLElement,
  key: string,
  value: unknown
): void {
  element.setAttribute(key, String(value));
}

/**
 * Processes props and applies them to a DOM element
 * @param element - The DOM element
 * @param props - The props object containing attributes, events, and ref
 */
export function applyPropsToElement(
  element: HTMLElement,
  props: Record<string, unknown>
): void {
  const entries = Object.entries(props);

  for (const [key, value] of entries) {
    if (key === 'children') continue;

    // Handle ref callback
    if (key === 'ref' && typeof value === 'function') {
      executeRefCallback(value as (el: HTMLElement | null) => void, element);
      continue;
    }

    // Handle event listeners
    if (key.startsWith('on') && typeof value === 'function') {
      const eventName = key.slice(2).toLowerCase();
      attachEventListener(element, eventName, value as EventListener);
      continue;
    }

    // Handle regular attributes
    setElementAttribute(element, key, value);
  }
}

/**
 * Attaches a component instance to a DOM node for later lifecycle processing
 * @param domNode - The DOM node to attach the component to
 * @param component - The component instance with lifecycle methods
 */
export function attachComponentToNode(
  domNode: Node,
  component: {
    __canInvokeAfterMount?: () => boolean;
    __markAfterMountCalled?: () => void;
    afterMount?: () => void | Promise<void>;
  }
): void {
  (domNode as ComponentAttachedNode).__atomComponent = component;
}

/**
 * Recursively traverses DOM tree and invokes afterMount() on attached components
 * @param node - The DOM node to process
 */
export async function processAfterMountRecursively(node: Node): Promise<void> {
  const componentNode = node as ComponentAttachedNode;

  // Check if this node has an attached component
  if (componentNode.__atomComponent) {
    const component = componentNode.__atomComponent;

    try {
      // Check if we can/should invoke afterMount
      const canInvoke =
        typeof component.__canInvokeAfterMount === 'function'
          ? component.__canInvokeAfterMount()
          : typeof component.afterMount === 'function';

      if (canInvoke) {
        // Mark that we're calling afterMount to prevent multiple calls
        if (typeof component.__markAfterMountCalled === 'function') {
          component.__markAfterMountCalled();
        }

        // Call afterMount - handle both sync and async versions
        const result = component.afterMount?.();

        // If afterMount returns a Promise, await it
        if (result && typeof result.then === 'function') {
          await result;
        }
      }
    } catch (error) {
      // Don't break other components if one afterMount fails
      console.error('afterMount() error:', error);
    } finally {
      // Clean up the reference to prevent memory leaks
      delete componentNode.__atomComponent;
    }
  }

  // Recursively process child nodes
  if (node.childNodes && node.childNodes.length > 0) {
    for (const child of Array.from(node.childNodes)) {
      await processAfterMountRecursively(child);
    }
  }
}

/**
 * Creates a text node with string conversion
 * @param content - The content to convert to a text node
 * @returns A text node
 */
export function createTextNode(content: string | number): Text {
  return document.createTextNode(String(content));
}

/**
 * Creates an HTML element with the specified tag name
 * @param tagName - The HTML tag name
 * @returns An HTML element
 */
export function createElement(tagName: string): HTMLElement {
  return document.createElement(tagName);
}
