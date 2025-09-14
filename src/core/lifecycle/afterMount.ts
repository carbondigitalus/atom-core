// Custom Modules
import AfterMountCapableComponent from '@atomdev/core/utils/interfaces/AfterMountCapableComponent';

/**
 * Executes the afterMount lifecycle method with proper error handling
 * Supports both synchronous and asynchronous afterMount implementations
 * @param component - The component instance with afterMount capabilities
 * @returns Promise<void> - Always returns a promise to handle async afterMount
 */
export async function executeAfterMount(
  component: AfterMountCapableComponent
): Promise<void> {
  try {
    // Check if we can/should invoke afterMount
    const canInvoke =
      typeof component.__canInvokeAfterMount === 'function'
        ? component.__canInvokeAfterMount()
        : typeof component.afterMount === 'function';

    if (canInvoke) {
      // Mark afterMount as called to prevent multiple invocations
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
    // Don't break other components if afterMount fails
    console.error('afterMount() error:', error);
    // Component should still be considered mounted even if afterMount fails
  }
}

/**
 * Executes afterMount without awaiting the result
 * Useful for fire-and-forget scenarios where blocking is not desired
 * @param component - The component instance with afterMount capabilities
 * @returns Promise<void> - Promise that resolves when afterMount completes (or fails)
 */
export function executeAfterMountNonBlocking(
  component: AfterMountCapableComponent
): Promise<void> {
  return executeAfterMount(component).catch((error) => {
    console.error('Non-blocking afterMount execution failed:', error);
  });
}

/**
 * Validates that a component has the necessary afterMount infrastructure
 * @param component - The component to validate
 * @returns boolean - true if component has proper afterMount support
 */
export function hasAfterMountSupport(
  component: unknown
): component is AfterMountCapableComponent {
  if (typeof component !== 'object' || component === null) {
    return false;
  }

  const comp = component as AfterMountCapableComponent;

  // Must have at least the guard methods or the lifecycle method itself
  return (
    typeof comp.__canInvokeAfterMount === 'function' ||
    typeof comp.afterMount === 'function'
  );
}

/**
 * Safe wrapper for afterMount execution with validation
 * @param component - The component instance
 * @returns Promise<void> - Promise that resolves when afterMount completes
 */
export async function safeExecuteAfterMount(component: unknown): Promise<void> {
  if (!hasAfterMountSupport(component)) {
    return;
  }

  return executeAfterMount(component);
}

/**
 * Batch executes afterMount on multiple components
 * Useful for processing multiple components after DOM insertion
 * @param components - Array of component instances
 * @returns Promise<void> - Promise that resolves when all afterMount calls complete
 */
export async function batchExecuteAfterMount(
  components: AfterMountCapableComponent[]
): Promise<void> {
  const promises = components
    .filter(hasAfterMountSupport)
    .map((component) => executeAfterMount(component));

  await Promise.all(promises);
}

/**
 * Creates a cleanup function that can be used to remove component references
 * after afterMount execution to prevent memory leaks
 * @param componentNode - The DOM node with attached component
 * @returns Function that cleans up the component reference
 */
export function createAfterMountCleanup(componentNode: {
  __atomComponent?: unknown;
}): () => void {
  return () => {
    delete componentNode.__atomComponent;
  };
}
