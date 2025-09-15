// Custom Modules
import BeforeMountCapableComponent from '@atomdev/core/utils/interfaces/BeforeMountCapableComponent';

/**
 * Executes the beforeMount lifecycle method with proper phase management and error handling
 * @param component - The component instance with beforeMount capabilities
 * @returns void - beforeMount is always synchronous
 */
export function executeBeforeMount(
  component: BeforeMountCapableComponent
): void {
  // Signal "we are mounting" so setState is allowed but non-scheduling
  if (typeof component.__enterMountPhase === 'function') {
    component.__enterMountPhase();
  }

  try {
    // Check if we can/should invoke beforeMount
    const canInvoke =
      typeof component.__canInvokeBeforeMount === 'function'
        ? component.__canInvokeBeforeMount()
        : typeof component.beforeMount === 'function';

    if (canInvoke) {
      // Mark beforeMount as called to prevent multiple invocations
      if (typeof component.__markBeforeMountCalled === 'function') {
        component.__markBeforeMountCalled();
      }

      // Synchronous call; do not await
      component.beforeMount?.();
    }
  } catch (error) {
    // Don't break mounting if beforeMount throws
    console.error('beforeMount() error:', error);
    // (Intentionally avoid setState here: it may be disallowed depending on phase/impl.)
  } finally {
    // Always exit mount phase, even if beforeMount threw an error
    if (typeof component.__exitMountPhase === 'function') {
      component.__exitMountPhase();
    }
  }
}

/**
 * Validates that a component has the necessary beforeMount infrastructure
 * @param component - The component to validate
 * @returns boolean - true if component has proper beforeMount support
 */
export function hasBeforeMountSupport(
  component: unknown
): component is BeforeMountCapableComponent {
  if (typeof component !== 'object' || component === null) {
    return false;
  }

  const comp = component as BeforeMountCapableComponent;

  // Must have at least the guard methods or the lifecycle method itself
  return (
    typeof comp.__canInvokeBeforeMount === 'function' ||
    typeof comp.beforeMount === 'function'
  );
}

/**
 * Safe wrapper for beforeMount execution with validation
 * @param component - The component instance
 */
export function safeExecuteBeforeMount(component: unknown): void {
  if (!hasBeforeMountSupport(component)) {
    return;
  }

  executeBeforeMount(component);
}
