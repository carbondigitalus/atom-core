// Custom Modules
import DidMountCapableComponent from '@atomdev/core/utils/interfaces/DidMountCapableComponent';

/**
 * Executes the didMount lifecycle method with error handling
 * @param component - The component instance with didMount capabilities
 * @returns void - didMount execution is fire-and-forget for async versions
 */
export function executeDidMount(component: DidMountCapableComponent): void {
  try {
    const canInvokeDidMount =
      typeof component.__canInvokeDidMount === 'function'
        ? component.__canInvokeDidMount()
        : typeof component.didMount === 'function';

    if (canInvokeDidMount) {
      if (typeof component.__markDidMountCalled === 'function') {
        component.__markDidMountCalled();
      }

      // Call didMount - handle both sync and async versions
      const didMountResult = component.didMount?.();

      // Mark as mounted AFTER didMount completes
      if (typeof component.__markMounted === 'function') {
        component.__markMounted();
      }

      // If didMount returns a Promise, we don't await it here to avoid blocking render
      if (didMountResult && typeof didMountResult.then === 'function') {
        didMountResult.catch((error: Error) => {
          console.error('Async didMount() error:', error);
        });
      }
    }
  } catch (error) {
    console.error('didMount() error:', error);

    // Still mark as mounted even if didMount failed
    try {
      if (typeof component.__markMounted === 'function') {
        component.__markMounted();
      }
    } catch (markError) {
      // Ignore errors in marking mounted
      console.error('markError error:', markError);
    }
  }
}

/**
 * Validates that a component has the necessary didMount infrastructure
 * @param component - The component to validate
 * @returns boolean - true if component has proper didMount support
 */
export function hasDidMountSupport(component: unknown): component is DidMountCapableComponent {
  if (typeof component !== 'object' || component === null) {
    return false;
  }

  const comp = component as DidMountCapableComponent;

  // Must have at least the guard methods or the lifecycle method itself
  return typeof comp.__canInvokeDidMount === 'function' || typeof comp.didMount === 'function';
}

/**
 * Safe wrapper for didMount execution with validation
 * @param component - The component instance
 */
export function safeExecuteDidMount(component: unknown): void {
  if (!hasDidMountSupport(component)) {
    return;
  }

  executeDidMount(component);
}
