// Custom Modules
import { createDOMNode } from './createDOMNode';
import { Children } from '../utils/types/Children';

/**
 * Interface for DOM nodes that may have attached component instances
 */
interface ComponentAttachedNode extends Node {
  __atomComponent?: {
    __canInvokeAfterMount?: () => boolean;
    __markAfterMountCalled?: () => void;
    afterMount?: () => void | Promise<void>;
  };
}

/**
 * Recursively traverses DOM tree and invokes afterMount() on attached components
 * @param node - The DOM node to process
 */
async function processAfterMountRecursively(node: Node): Promise<void> {
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

function render(element: Children, container: HTMLElement): void {
  // Clear container
  container.innerHTML = '';

  // Convert element to DOM node
  const domNode = createDOMNode(element);

  // Append to container FIRST - this ensures DOM insertion is complete
  container.appendChild(domNode);

  // Call afterMount() after DOM insertion is complete
  // Use setTimeout to ensure this happens after the current synchronous call stack
  setTimeout(() => {
    processAfterMountRecursively(domNode).catch((error) => {
      console.error('afterMount() processing failed:', error);
    });
  }, 0);
}

export { render };
