// Custom Modules
import PropTypes from '../utils/interfaces/PropTypes';
import VNode from '../utils/interfaces/VNode';
import type { Props } from '../utils/types/Props';

interface TestInstance {
  _constructorCalled?: boolean;
}

/**
 * Base class for all AtomJS components
 * Provides lifecycle methods and state management
 */
export abstract class AtomComponent<P extends Props = Props, S = any> {
  public props: P;
  public state: S;
  private static _baseConstructorCalled: WeakSet<object> = new WeakSet();
  // Ensures beforeMount() is only invoked once
  private _beforeMountCalled: boolean = false;
  // Ensures didMount() is only invoked once
  private _didMountCalled: boolean = false;
  // Ensures afterMount() is only invoked once
  private _afterMountCalled: boolean = false;
  private _constructorCalled: boolean = false;
  private _isMounted: boolean = false;
  // Tracks "mount phase" (constructor finished, before DOM insertion)
  private _isMounting: boolean = false;

  /**
   * Static property for default props (optional)
   * Subclasses can define this to provide default prop values
   */
  static defaultProps?: Partial<Props>;

  /**
   * Static property for prop type validation (optional)
   * Subclasses can define this to enable prop validation
   */
  static propTypes?: PropTypes;

  /**
   * Component constructor - initializes props and allows state setup
   * @param props - The initial props passed to the component
   */
  constructor(props: P) {
    // Check if super() was called properly - track this instance
    /* istanbul ignore if: defensive runtime guard, not reachable in TS */
    if (AtomComponent._baseConstructorCalled.has(this)) {
      throw new Error(
        `AtomComponent constructor called multiple times for the same instance. This should never happen.`
      );
    }

    // Mark that AtomComponent constructor has been called for this instance
    AtomComponent._baseConstructorCalled.add(this);

    // Validate that this is being called properly
    /* istanbul ignore if: defensive runtime guard, not reachable in TS */
    if (this._constructorCalled) {
      throw new Error(
        `Component constructor called multiple times. Make sure you're only calling super(props) once in your constructor.`
      );
    }

    const constructor = this.constructor as typeof AtomComponent;

    // Merge default props with provided props
    const mergedProps = this._mergeDefaultProps(props, constructor.defaultProps);

    // Validate props against propTypes if defined
    if (constructor.propTypes) {
      this._validateProps(mergedProps, constructor.propTypes, constructor.name);
    }

    // Store merged props on the instance
    this.props = mergedProps;

    // Initialize state as empty object by default
    this.state = {} as S;

    // Mark constructor as called
    this._constructorCalled = true;

    // Support for method binding - provide helper method
    this._bindMethods();
  }

  /**
   * Helper method for explicit method binding
   * Subclasses can override this to bind methods explicitly
   * @protected
   */
  protected _bindMethods(): void {
    // Default implementation does nothing
    // Subclasses can override this for explicit binding:
    //
    // protected _bindMethods(): void {
    //   this.handleClick = this.handleClick.bind(this);
    //   this.handleSubmit = this.handleSubmit.bind(this);
    // }
    //
    // Or use class property syntax (arrow functions) which auto-bind:
    // handleClick = () => { ... }
  }

  /** @internal - renderer should check before invoking beforeMount() */
  public __canInvokeBeforeMount(): boolean {
    return !this._beforeMountCalled && typeof this.beforeMount === 'function';
  }

  /** @internal - renderer should check before invoking didMount() */
  public __canInvokeDidMount(): boolean {
    return !this._didMountCalled && typeof this.didMount === 'function';
  }

  /** @internal - renderer should check before invoking afterMount() */
  public __canInvokeAfterMount(): boolean {
    return !this._afterMountCalled && typeof this.afterMount === 'function';
  }

  /** @internal - called by renderer before invoking beforeMount() */
  public __enterMountPhase(): void {
    this._isMounting = true;
  }

  /** @internal - called by renderer immediately after beforeMount() returns/throws */
  public __exitMountPhase(): void {
    this._isMounting = false;
  }

  /** @internal - mark hook as consumed exactly once */
  public __markBeforeMountCalled(): void {
    this._beforeMountCalled = true;
  }

  /** @internal - mark didMount hook as consumed exactly once */
  public __markDidMountCalled(): void {
    this._didMountCalled = true;
  }

  /** @internal - mark afterMount hook as consumed exactly once */
  public __markAfterMountCalled(): void {
    this._afterMountCalled = true;
  }

  /** @internal - mark component as fully mounted */
  public __markMounted(): void {
    this._isMounted = true;
  }

  /* istanbul ignore next: test helper */
  public static __forceGuardCheck(instance: object, guard: 'base' | 'ctor'): void {
    if (guard === 'base') {
      if (this._baseConstructorCalled.has(instance)) {
        throw new Error(
          'AtomComponent constructor called multiple times for the same instance. This should never happen.'
        );
      }
    }
    if (guard === 'ctor') {
      const inst = instance as TestInstance;
      if (inst._constructorCalled) {
        throw new Error(
          "Component constructor called multiple times. Make sure you're only calling super(props) once in your constructor."
        );
      }
    }
  }

  /* istanbul ignore next: test helper */
  public static __forceMarkBase(instance: object): void {
    this._baseConstructorCalled.add(instance);
  }

  /**
   * Merges default props with provided props
   * @private
   */
  private _mergeDefaultProps(props: P, defaultProps?: Partial<Props>): P {
    if (!defaultProps) {
      return props;
    }

    return {
      ...defaultProps,
      ...props
    } as P;
  }

  /**
   * Validates props against defined propTypes
   * @private
   */
  private _validateProps(props: P, propTypes: PropTypes, componentName: string): void {
    for (const propName in propTypes) {
      const validator = propTypes[propName];
      const propValue = (props as Record<string, unknown>)[propName];

      try {
        const error = validator(propValue, propName, componentName);
        if (error) {
          throw new Error(`Invalid prop \`${propName}\` supplied to \`${componentName}\`: ${error.message}`);
        }
      } catch (validationError) {
        throw new Error(
          `Prop validation failed for \`${propName}\` in \`${componentName}\`: ${
            validationError instanceof Error ? validationError.message : String(validationError)
          }`
        );
      }
    }
  }

  /**
   * Abstract render method - must be implemented by subclasses
   * @returns VNode representing the component's structure
   */
  abstract render(): VNode;

  /**
   * Updates component state and triggers re-render
   * Cannot be called in constructor
   * @param partialState - Partial state to merge with current state
   */
  public setState(partialState: Partial<S>): void {
    // Validate constructor was called properly
    if (!this._constructorCalled) {
      throw new Error(
        'setState() called on component before constructor completed. ' +
          'Make sure to call super(props) in your constructor.'
      );
    }

    // Disallow during constructor, but allow during mount phase and after mounting
    if (!this._isMounted && !this._isMounting) {
      throw new Error('Cannot call setState() during constructor. Use this.state = {...} instead.');
    }

    // Merge new state with existing state
    this.state = {
      ...this.state,
      ...partialState
    };

    // If we're mounting, do NOT schedule an extra render.
    if (this._isMounting) {
      return;
    }

    // TODO: Trigger re-render (will be implemented later)
    // For now, setState in afterMount will work but won't trigger re-renders
  }

  /**
   * Lifecycle method - called after component updates
   */
  public afterUpdate?(prevProps: P, prevState: S): void;

  /**
   * Lifecycle method - called before component mounts
   * Perfect for setting up subscriptions or timers that don't require DOM access
   */
  public beforeMount?(): void;

  /**
   * Lifecycle method - called before component unmounts
   */
  public beforeUnmount?(): void;

  /**
   * Lifecycle method - called before component updates
   */
  public beforeUpdate?(nextProps: P, nextState: S): void;

  /**
   * Lifecycle method - called after DOM creation but before DOM insertion
   * Called only once during component lifetime
   * Perfect for setup that requires DOM structure but not full insertion
   */
  public didMount?(): void | Promise<void>;

  /**
   * Lifecycle method - called after component mounts and full DOM insertion
   * Called only once during component lifetime
   * Has full access to DOM elements via refs and computed styles
   * Perfect for:
   * - API calls and data fetching that trigger re-renders
   * - DOM manipulation and measurements requiring full insertion
   * - Focus management and accessibility setup
   * - Third-party library integration requiring DOM in document
   * - Setting up DOM event listeners
   * - Animation initialization requiring layout
   */
  public afterMount?(): void | Promise<void>;

  /**
   * Lifecycle method - determines if component should update
   */
  public shouldUpdate?(nextProps: P, nextState: S): boolean;
}

export default PropTypes;
