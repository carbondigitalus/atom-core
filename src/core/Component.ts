// Custom Modules
import type { Props } from '../utils/types/Props';
import type { VNode } from '../utils/interfaces/VNode';

/**
 * Prop type definitions for validation
 */
export interface PropTypes {
  [key: string]: (
    value: any,
    propName: string,
    componentName: string
  ) => Error | null;
}

/**
 * Base class for all AtomJS components
 * Provides lifecycle methods and state management
 */
export abstract class AtomComponent<P extends Props = Props, S = any> {
  public props: P;
  public state: S;
  private _isMounted: boolean = false;
  private _constructorCalled: boolean = false;

  /**
   * Static property for prop type validation (optional)
   * Subclasses can define this to enable prop validation
   */
  static propTypes?: PropTypes;

  /**
   * Static property for default props (optional)
   * Subclasses can define this to provide default prop values
   */
  static defaultProps?: Partial<Props>;

  /**
   * Component constructor - initializes props and allows state setup
   * @param props - The initial props passed to the component
   */
  constructor(props: P) {
    // Validate that this is being called properly
    if (this._constructorCalled) {
      throw new Error(
        `AtomComponent constructor called multiple times. This should never happen.`
      );
    }

    const constructor = this.constructor as typeof AtomComponent;

    // Merge default props with provided props
    const mergedProps = this._mergeDefaultProps(
      props,
      constructor.defaultProps
    );

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

  /**
   * Validates props against defined propTypes
   * @private
   */
  private _validateProps(
    props: P,
    propTypes: PropTypes,
    componentName: string
  ): void {
    for (const propName in propTypes) {
      const validator = propTypes[propName];
      const propValue = (props as Record<string, unknown>)[propName];

      try {
        const error = validator(propValue, propName, componentName);
        if (error) {
          throw new Error(
            `Invalid prop \`${propName}\` supplied to \`${componentName}\`: ${error.message}`
          );
        }
      } catch (validationError) {
        throw new Error(
          `Prop validation failed for \`${propName}\` in \`${componentName}\`: ${
            validationError instanceof Error
              ? validationError.message
              : String(validationError)
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

    if (!this._isMounted) {
      throw new Error(
        'Cannot call setState() during constructor. Use this.state = {...} instead.'
      );
    }

    // Merge new state with existing state
    this.state = {
      ...this.state,
      ...partialState
    };

    // TODO: Trigger re-render (will be implemented later)
  }

  /**
   * Lifecycle method - called before component mounts
   */
  public beforeMount?(): void;

  /**
   * Lifecycle method - called after component mounts
   */
  public afterMount?(): void {
    this._isMounted = true;
  }

  /**
   * Lifecycle method - called before component updates
   */
  public beforeUpdate?(nextProps: P, nextState: S): void;

  /**
   * Lifecycle method - called after component updates
   */
  public afterUpdate?(prevProps: P, prevState: S): void;

  /**
   * Lifecycle method - determines if component should update
   */
  public shouldUpdate?(nextProps: P, nextState: S): boolean;

  /**
   * Lifecycle method - called before component unmounts
   */
  public beforeUnmount?(): void;
}
