// Custom Modules
import FullLifecycleComponent from '@atomdev/core/utils/interfaces/FullLifecycleComponent';
import { executeAfterMount } from './afterMount';
import { executeBeforeMount } from './beforeMount';
import { executeDidMount } from './didMount';
import { AtomComponent } from '../Component';
import AfterMountCapableComponent from '../../utils/interfaces/AfterMountCapableComponent';
import BeforeMountCapableComponent from '../../utils/interfaces/BeforeMountCapableComponent';
import DidMountCapableComponent from '../../utils/interfaces/DidMountCapableComponent';

/**
 * Centralized lifecycle manager that coordinates the mounting sequence
 * Provides a unified interface for executing the complete component lifecycle
 */
export class LifecycleManager {
  /**
   * Executes the complete mounting lifecycle sequence
   * @param component - The component instance
   * @returns Node - The created DOM node after lifecycle completion
   */
  public static executeMountingLifecycle(
    component: AtomComponent<any, any>,
    createDOMNodeFn: (result: any) => Node
  ): Node {
    // Phase 1: beforeMount - setup before rendering
    executeBeforeMount(component as BeforeMountCapableComponent);

    // Phase 2: render - create the virtual DOM structure
    const result = component.render();
    const domNode = createDOMNodeFn(result);

    // Phase 3: didMount - setup after DOM creation but before insertion
    executeDidMount(component as DidMountCapableComponent);

    return domNode;
  }

  /**
   * Executes the afterMount lifecycle after DOM insertion
   * This is called separately because it happens after the DOM is inserted into the container
   * @param component - The component instance
   */
  public static async executeAfterMountLifecycle(component: AfterMountCapableComponent): Promise<void> {
    await executeAfterMount(component);
  }

  /**
   * Checks if a component supports the full mounting lifecycle
   * @param component - The component to check
   * @returns boolean - true if component supports all mounting lifecycle methods
   */
  public static supportsFullMountingLifecycle(component: unknown): component is FullLifecycleComponent {
    if (typeof component !== 'object' || component === null) {
      return false;
    }

    const comp = component as FullLifecycleComponent;

    return (
      typeof comp.render === 'function' &&
      (typeof comp.beforeMount === 'function' || typeof comp.__canInvokeBeforeMount === 'function') &&
      (typeof comp.didMount === 'function' || typeof comp.__canInvokeDidMount === 'function') &&
      (typeof comp.afterMount === 'function' || typeof comp.__canInvokeAfterMount === 'function')
    );
  }

  /**
   * Gets the current lifecycle phase of a component
   * @param component - The component to check
   * @returns string - The current lifecycle phase
   */
  public static getLifecyclePhase(
    component: AtomComponent<any, any>
  ): 'constructed' | 'mounting' | 'mounted' | 'unknown' {
    const comp = component as any;

    if (comp._isMounted) {
      return 'mounted';
    } else if (comp._isMounting) {
      return 'mounting';
    } else if (comp._constructorCalled) {
      return 'constructed';
    } else {
      return 'unknown';
    }
  }

  /**
   * Validates that a component is ready for mounting
   * @param component - The component to validate
   * @throws Error if component is not ready for mounting
   */
  public static validateMountingReadiness(component: AtomComponent<any, any>): void {
    const comp = component as any;

    if (!comp._constructorCalled) {
      throw new Error('Component constructor has not been called');
    }

    if (comp._isMounted) {
      throw new Error('Component is already mounted');
    }

    if (comp._isMounting) {
      throw new Error('Component is currently mounting');
    }

    if (typeof component.render !== 'function') {
      throw new Error('Component must implement render() method');
    }
  }

  /**
   * Creates a lifecycle event object for debugging/monitoring
   * @param component - The component instance
   * @param phase - The lifecycle phase
   * @param timestamp - Optional timestamp (defaults to current time)
   * @returns Lifecycle event object
   */
  public static createLifecycleEvent(
    component: AtomComponent<any, any>,
    phase: 'beforeMount' | 'didMount' | 'afterMount' | 'beforeUnmount',
    timestamp: number = Date.now()
  ) {
    return {
      componentName: component.constructor.name,
      phase,
      timestamp,
      props: { ...component.props },
      state: { ...component.state }
    };
  }
}
