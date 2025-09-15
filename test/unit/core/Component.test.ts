// NPM Modules
import { describe, test, expect } from '@jest/globals';

// Custom Modules
import PropTypes, { AtomComponent } from '@atomdev/core/core/Component';

import { Props } from '@atomdev/core/utils/types/Props';
import VNode from '@atomdev/core/utils/interfaces/VNode';

// Test component implementations
class TestComponent extends AtomComponent<Props, { count: number }> {
  constructor(props: Props) {
    super(props);
    this.state = { count: (props.initialCount as number) || 0 };
  }

  render(): VNode {
    return { type: 'div', props: {} };
  }
}

class TestComponentWithBinding extends AtomComponent<Props, { count: number }> {
  constructor(props: Props) {
    super(props);
    this.state = { count: 0 };
    this.handleClick = this.handleClick.bind(this);
  }

  handleClick() {
    this.setState({ count: this.state.count + 1 });
  }

  render(): VNode {
    return { type: 'div', props: {} };
  }
}

class TestComponentWithArrowFunction extends AtomComponent<Props, { count: number }> {
  constructor(props: Props) {
    super(props);
    this.state = { count: 0 };
  }

  handleClick = () => {
    this.setState({ count: this.state.count + 1 });
  };

  render(): VNode {
    return { type: 'div', props: {} };
  }
}

class TestComponentWithDefaultProps extends AtomComponent<Props, { title: string }> {
  static defaultProps = { title: 'Default Title', count: 10 };

  constructor(props: Props) {
    super(props);
    this.state = { title: props.title as string };
  }

  render(): VNode {
    return { type: 'div', props: {} };
  }
}

class TestComponentWithPropTypes extends AtomComponent<Props, { title: string }> {
  static propTypes: PropTypes = {
    title: (value: any, propName: string) => {
      if (value === undefined || value === null) {
        return new Error(`${propName} is required`);
      }
      if (typeof value !== 'string') {
        return new Error(`${propName} must be a string`);
      }
      return null;
    },

    count: (value: any, propName: string) => {
      if (value !== undefined && typeof value !== 'number') {
        return new Error(`${propName} must be a number`);
      }
      return null;
    }
  };

  constructor(props: Props) {
    super(props);
    this.state = { title: props.title as string };
  }

  render(): VNode {
    return { type: 'div', props: {} };
  }
}

describe('AtomComponent Constructor', () => {
  describe('1. Basic Constructor Call', () => {
    test('Constructor is called with props', () => {
      const props = { initialCount: 5 };
      const component = new TestComponent(props);

      expect(component).toBeInstanceOf(AtomComponent);
      expect(component).toBeInstanceOf(TestComponent);
    });

    test('super(props) is properly invoked and this.props is accessible', () => {
      const props = { initialCount: 5, title: 'Test' };
      const component = new TestComponent(props);

      expect(component.props).toEqual(props);
      expect(component.props.initialCount).toBe(5);
      expect(component.props.title).toBe('Test');
    });

    test('Component can be instantiated with empty props', () => {
      const component = new TestComponent({});

      expect(component.props).toEqual({});
      expect(component.state.count).toBe(0);
    });
  });

  describe('2. State Initialization', () => {
    test('this.state can be set directly in constructor', () => {
      const props = { initialCount: 10 };
      const component = new TestComponent(props);

      expect(component.state).toEqual({ count: 10 });
    });

    test('Initial state can use props values', () => {
      const props = { initialCount: 42 };
      const component = new TestComponent(props);

      expect(component.state.count).toBe(42);
    });

    test('State is initialized before other operations', () => {
      const component = new TestComponent({ initialCount: 5 });

      // State should be available immediately after construction
      expect(component.state).toBeDefined();
      expect(component.state.count).toBe(5);
    });

    test('State can be complex object with multiple properties', () => {
      class ComplexStateComponent extends AtomComponent<Props, { count: number; visible: boolean; items: string[] }> {
        constructor(props: Props) {
          super(props);
          this.state = { count: 0, visible: true, items: ['item1', 'item2'] };
        }
        render(): VNode {
          return { type: 'div', props: {} };
        }
      }

      const component = new ComplexStateComponent({});
      expect(component.state).toEqual({
        count: 0,
        visible: true,
        items: ['item1', 'item2']
      });
    });
  });

  describe('3. Method Binding', () => {
    test('Methods bound in constructor have correct this context', () => {
      const component = new TestComponentWithBinding({});

      // Mark component as mounted so setState works
      component.__markMounted();

      // Simulate the method being called in a different context
      // eslint-disable-next-line @typescript-eslint/unbound-method
      const boundMethod = component.handleClick;

      // This should not throw because method is properly bound
      expect(() => boundMethod()).not.toThrow();
    });

    test('Arrow function methods work without explicit binding', () => {
      const component = new TestComponentWithArrowFunction({});

      // Mark component as mounted so setState works
      component.__markMounted();

      // Simulate the method being called in a different context
      const arrowMethod = component.handleClick;

      // This should not throw because arrow functions auto-bind
      expect(() => arrowMethod()).not.toThrow();
    });

    test('Bound methods can access component state and setState', () => {
      const component = new TestComponentWithBinding({});

      // Mock afterMount to allow setState
      component.__markMounted();

      expect(component.state.count).toBe(0);
      component.handleClick();
      expect(component.state.count).toBe(1);
    });

    test('Arrow function methods can access component state and setState', () => {
      const component = new TestComponentWithArrowFunction({});

      // Mock afterMount to allow setState
      component.__markMounted();

      expect(component.state.count).toBe(0);
      component.handleClick();
      expect(component.state.count).toBe(1);
    });
  });

  describe('4. Error Handling', () => {
    test('Error messages include component names for debugging', () => {
      expect(() => {
        new TestComponentWithPropTypes({ title: null });
      }).toThrow(/TestComponentWithPropTypes/);
    });

    test('Error thrown when setState is called in constructor', () => {
      class BadComponent extends AtomComponent {
        constructor(props: Props) {
          super(props);
          this.setState({ count: 1 }); // should throw
        }
        render(): VNode {
          return { type: 'div', props: {} };
        }
      }

      expect(() => new BadComponent({})).toThrow(
        'Cannot call setState() during constructor. Use this.state = {...} instead.'
      );
    });

    test('Error thrown when super(props) is called multiple times', () => {
      class TestMultipleSuper extends AtomComponent {
        constructor(props: Props) {
          super(props);
          const baseConstructorCalled = (
            AtomComponent as unknown as {
              _baseConstructorCalled: WeakSet<object>;
            }
          )._baseConstructorCalled;

          if (baseConstructorCalled.has(this)) {
            throw new Error(
              'AtomComponent constructor called multiple times for the same instance. This should never happen.'
            );
          }
        }
        render(): VNode {
          return { type: 'div', props: {} };
        }
      }

      expect(() => new TestMultipleSuper({})).toThrow(
        'AtomComponent constructor called multiple times for the same instance'
      );
    });

    test('Helpful error messages for setState before constructor completion', () => {
      const component = new TestComponent({});

      // Reset the constructor flag to simulate incomplete constructor
      (component as unknown as { _constructorCalled: boolean })._constructorCalled = false;

      expect(() => {
        component.setState({ count: 1 });
      }).toThrow(
        'setState() called on component before constructor completed. Make sure to call super(props) in your constructor.'
      );
    });

    test('Throws if _constructorCalled flag is already set', () => {
      const fake = {};
      AtomComponent.__forceMarkBase(fake);

      expect(() => {
        AtomComponent.__forceGuardCheck(fake, 'base');
      }).toThrow(/AtomComponent constructor called multiple times/);
    });

    test('Throws if AtomComponent constructor called twice for same instance', () => {
      expect(() => {
        AtomComponent.__forceGuardCheck({ _constructorCalled: true }, 'ctor');
      }).toThrow(/Component constructor called multiple times/);
    });
  });

  describe('5. Props Handling', () => {
    test('Props are accessible via this.props', () => {
      const props = { title: 'Test Title', count: 42 };
      const component = new TestComponent(props);

      expect(component.props).toEqual(props);
      expect(component.props.title).toBe('Test Title');
      expect(component.props.count).toBe(42);
    });

    test('Default props are properly merged', () => {
      const props = { count: 5 };
      const component = new TestComponentWithDefaultProps(props);

      // Should have default title but custom count
      expect(component.props.title).toBe('Default Title');
      expect(component.props.count).toBe(5);
    });

    test('Provided props override default props', () => {
      const props = { title: 'Custom Title', count: 20 };
      const component = new TestComponentWithDefaultProps(props);

      expect(component.props.title).toBe('Custom Title');
      expect(component.props.count).toBe(20);
    });

    test('Props validation works with valid props', () => {
      const props = { title: 'Valid Title', count: 10 };

      expect(() => {
        new TestComponentWithPropTypes(props);
      }).not.toThrow();
    });

    test('Props validation throws error for invalid props', () => {
      const props = { title: 123 }; // Should be string

      expect(() => {
        new TestComponentWithPropTypes(props);
      }).toThrow('Invalid prop `title` supplied to `TestComponentWithPropTypes`: title must be a string');
    });

    test('Props validation throws error for missing required props', () => {
      const props = {}; // Missing required title

      expect(() => {
        new TestComponentWithPropTypes(props);
      }).toThrow('Invalid prop `title` supplied to `TestComponentWithPropTypes`: title is required');
    });

    test('Props validation allows optional props to be undefined', () => {
      const props = { title: 'Valid Title' }; // count is optional

      expect(() => {
        new TestComponentWithPropTypes(props);
      }).not.toThrow();
    });

    test('Props validation with wrong type shows helpful message', () => {
      const props = { title: 'Valid Title', count: 'not a number' };

      expect(() => {
        new TestComponentWithPropTypes(props);
      }).toThrow('Invalid prop `count` supplied to `TestComponentWithPropTypes`: count must be a number');
    });
  });

  describe('Integration Tests', () => {
    test('Constructor completes successfully with all features', () => {
      const props = { title: 'Integration Test', count: 100 };
      const component = new TestComponentWithDefaultProps(props);

      // All features should work together
      expect(component.props).toEqual(props);
      expect(component.state).toBeDefined();
      expect(component.render()).toBeDefined();
    });

    test('Component is ready for lifecycle methods after constructor', () => {
      const component = new TestComponent({});

      // Should be able to call lifecycle methods
      expect(() => component.beforeMount?.()).not.toThrow();
      expect(() => component.afterMount?.()).not.toThrow();
      expect(() => component.render()).not.toThrow();
    });
  });
});
