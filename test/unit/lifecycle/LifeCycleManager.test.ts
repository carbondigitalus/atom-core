/** @jest-environment jsdom */

// NPM Modules
import { expect, jest } from '@jest/globals';

// Custom Modules
import { AtomComponent } from '@atomdev/core/core/Component';
import { executeAfterMount } from '@atomdev/core/core/lifecycle/afterMount';
import { executeBeforeMount } from '@atomdev/core/core/lifecycle/beforeMount';
import { executeDidMount } from '@atomdev/core/core/lifecycle/didMount';
import { LifecycleManager } from '@atomdev/core/core/lifecycle/LifecycleManager';
import AfterMountCapableComponent from '@atomdev/core/utils/interfaces/AfterMountCapableComponent';
import FullLifecycleComponent from '@atomdev/core/utils/interfaces/FullLifecycleComponent';
import VNode from '@atomdev/core/utils/interfaces/VNode';

// Mock the lifecycle execution functions
jest.mock('@atomdev/core/core/lifecycle/beforeMount', () => ({
  executeBeforeMount: jest.fn()
}));

jest.mock('@atomdev/core/core/lifecycle/didMount', () => ({
  executeDidMount: jest.fn()
}));

jest.mock('@atomdev/core/core/lifecycle/afterMount', () => ({
  executeAfterMount: jest.fn()
}));

describe('LifecycleManager', () => {
  let mockComponent: AtomComponent<any, any>;
  let mockCreateDOMNodeFn: jest.MockedFunction<(result: VNode) => Node>;
  let mockDOMNode: Node;

  beforeEach(() => {
    // Create mock DOM node
    mockDOMNode = document.createElement('div');

    // Create mock createDOMNode function
    mockCreateDOMNodeFn = jest.fn<(result: VNode) => Node>().mockReturnValue(mockDOMNode);

    // Create mock component
    mockComponent = {
      render: jest.fn<() => VNode>().mockReturnValue({
        type: 'div',
        props: { children: ['Test'] }
      }),
      props: { testProp: 'value' },
      state: { testState: 'initial' },
      constructor: { name: 'TestComponent' },
      beforeMount: jest.fn<(this: void) => void>(),
      didMount: jest.fn<(this: void) => void>(),
      afterMount: jest.fn<(this: void) => void>(),
      __canInvokeBeforeMount: jest.fn<(this: void) => boolean>(() => true),
      __canInvokeDidMount: jest.fn<(this: void) => boolean>(() => true),
      __canInvokeAfterMount: jest.fn<(this: void) => boolean>(() => true),
      _constructorCalled: true,
      _isMounted: false,
      _isMounting: false
    } as Partial<AtomComponent<any, any>> as AtomComponent<any, any>;

    // Configure the afterMount mock
    (executeAfterMount as jest.MockedFunction<typeof executeAfterMount>).mockResolvedValue();

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('executeMountingLifecycle', () => {
    it('should execute the complete mounting lifecycle in correct order', () => {
      const result = LifecycleManager.executeMountingLifecycle(mockComponent, mockCreateDOMNodeFn);

      // Verify beforeMount was called first
      expect(executeBeforeMount).toHaveBeenCalledWith(mockComponent);

      // Verify render was called
      expect(mockComponent.render).toHaveBeenCalled();

      // Verify createDOMNode was called with render result
      expect(mockCreateDOMNodeFn).toHaveBeenCalledWith({
        type: 'div',
        props: {
          children: ['Test']
        }
      });

      // Verify didMount was called after DOM creation
      expect(executeDidMount).toHaveBeenCalledWith(mockComponent);

      // Verify correct return value
      expect(result).toBe(mockDOMNode);
    });

    it('should call lifecycle methods in the correct sequence', () => {
      const callOrder: string[] = [];

      (executeBeforeMount as jest.MockedFunction<typeof executeBeforeMount>).mockImplementation(() => {
        callOrder.push('beforeMount');
      });

      mockComponent.render = jest.fn(() => {
        callOrder.push('render');
        return {
          type: 'div',
          props: {
            children: ['Test']
          }
        } as VNode;
      });

      mockCreateDOMNodeFn.mockImplementation(() => {
        callOrder.push('createDOMNode');
        return mockDOMNode;
      });

      (executeDidMount as jest.MockedFunction<typeof executeDidMount>).mockImplementation(() => {
        callOrder.push('didMount');
      });

      LifecycleManager.executeMountingLifecycle(mockComponent, mockCreateDOMNodeFn);

      expect(callOrder).toEqual(['beforeMount', 'render', 'createDOMNode', 'didMount']);
    });

    it('should handle components without lifecycle methods', () => {
      const simpleComponent = {
        render: jest.fn().mockReturnValue({
          type: 'span',
          props: {
            children: ['Simple']
          }
        } as VNode),
        props: {},
        state: {}
      } as Partial<AtomComponent<any, any>> as AtomComponent<any, any>;

      const result = LifecycleManager.executeMountingLifecycle(simpleComponent, mockCreateDOMNodeFn);

      expect(executeBeforeMount).toHaveBeenCalledWith(simpleComponent);
      expect(executeDidMount).toHaveBeenCalledWith(simpleComponent);
      expect(result).toBe(mockDOMNode);
    });

    it('should handle render method that returns complex objects', () => {
      const complexRenderResult: VNode = {
        type: 'div',
        props: {
          className: 'test',
          children: ['Hello World']
        }
      };

      mockComponent.render = jest.fn<() => VNode>().mockReturnValue(complexRenderResult);

      LifecycleManager.executeMountingLifecycle(mockComponent, mockCreateDOMNodeFn);

      expect(mockCreateDOMNodeFn).toHaveBeenCalledWith(complexRenderResult);
    });
  });

  describe('executeAfterMountLifecycle', () => {
    it('should execute afterMount lifecycle', async () => {
      const afterMountComponent: AfterMountCapableComponent = {
        afterMount: jest.fn<() => void>(),
        __canInvokeAfterMount: jest.fn(() => true),
        __markAfterMountCalled: jest.fn()
      };

      await LifecycleManager.executeAfterMountLifecycle(afterMountComponent);

      expect(executeAfterMount).toHaveBeenCalledWith(afterMountComponent);
    });

    it('should handle async afterMount execution', async () => {
      const afterMountComponent: AfterMountCapableComponent = {
        afterMount: jest.fn<() => void>(),
        __canInvokeAfterMount: jest.fn(() => true),
        __markAfterMountCalled: jest.fn()
      };

      (executeAfterMount as jest.MockedFunction<typeof executeAfterMount>).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 10))
      );

      const startTime = Date.now();
      await LifecycleManager.executeAfterMountLifecycle(afterMountComponent);
      const endTime = Date.now();

      expect(endTime - startTime).toBeGreaterThanOrEqual(10);
      expect(executeAfterMount).toHaveBeenCalledWith(afterMountComponent);
    });

    it('should handle afterMount errors gracefully', async () => {
      const afterMountComponent: AfterMountCapableComponent = {
        afterMount: jest.fn<() => void>(),
        __canInvokeAfterMount: jest.fn(() => true),
        __markAfterMountCalled: jest.fn()
      };

      (executeAfterMount as jest.MockedFunction<typeof executeAfterMount>).mockRejectedValue(
        new Error('AfterMount failed')
      );

      await expect(LifecycleManager.executeAfterMountLifecycle(afterMountComponent)).rejects.toThrow(
        'AfterMount failed'
      );
    });
  });

  describe('supportsFullMountingLifecycle', () => {
    it('should return true for components with all lifecycle methods', () => {
      const fullComponent: FullLifecycleComponent = {
        render: jest.fn<() => any>(),
        beforeMount: jest.fn<() => void>(),
        didMount: jest.fn<() => void>(),
        afterMount: jest.fn<() => void>(),
        __canInvokeBeforeMount: jest.fn(() => true),
        __canInvokeDidMount: jest.fn(() => true),
        __canInvokeAfterMount: jest.fn(() => true),
        __markBeforeMountCalled: jest.fn(),
        __markDidMountCalled: jest.fn(),
        __markAfterMountCalled: jest.fn()
      };

      expect(LifecycleManager.supportsFullMountingLifecycle(fullComponent)).toBe(true);
    });

    it('should return true for components with guard methods instead of lifecycle methods', () => {
      const guardComponent = {
        render: jest.fn<() => any>(),
        __canInvokeBeforeMount: jest.fn(() => true),
        __canInvokeDidMount: jest.fn(() => true),
        __canInvokeAfterMount: jest.fn(() => true)
      };

      expect(LifecycleManager.supportsFullMountingLifecycle(guardComponent)).toBe(true);
    });

    it('should return false for components missing render method', () => {
      const noRenderComponent = {
        beforeMount: jest.fn<() => void>(),
        didMount: jest.fn<() => void>(),
        afterMount: jest.fn<() => void>()
      };

      expect(LifecycleManager.supportsFullMountingLifecycle(noRenderComponent)).toBe(false);
    });

    it('should return false for components missing lifecycle methods', () => {
      const incompleteComponent = {
        render: jest.fn<() => any>(),
        beforeMount: jest.fn<() => void>()
        // Missing didMount and afterMount
      };

      expect(LifecycleManager.supportsFullMountingLifecycle(incompleteComponent)).toBe(false);
    });

    it('should return false for null or undefined', () => {
      expect(LifecycleManager.supportsFullMountingLifecycle(null)).toBe(false);
      expect(LifecycleManager.supportsFullMountingLifecycle(undefined)).toBe(false);
    });

    it('should return false for non-objects', () => {
      expect(LifecycleManager.supportsFullMountingLifecycle('string')).toBe(false);
      expect(LifecycleManager.supportsFullMountingLifecycle(123)).toBe(false);
      expect(LifecycleManager.supportsFullMountingLifecycle(true)).toBe(false);
    });

    it('should return false for empty objects', () => {
      expect(LifecycleManager.supportsFullMountingLifecycle({})).toBe(false);
    });
  });

  describe('getLifecyclePhase', () => {
    it('should return "mounted" when component is mounted', () => {
      const comp = mockComponent as any;
      comp._isMounted = true;
      comp._isMounting = false;
      comp._constructorCalled = true;

      expect(LifecycleManager.getLifecyclePhase(mockComponent)).toBe('mounted');
    });

    it('should return "mounting" when component is mounting', () => {
      const comp = mockComponent as any;
      comp._isMounted = false;
      comp._isMounting = true;
      comp._constructorCalled = true;

      expect(LifecycleManager.getLifecyclePhase(mockComponent)).toBe('mounting');
    });

    it('should return "constructed" when component is constructed but not mounting', () => {
      const comp = mockComponent as any;
      comp._isMounted = false;
      comp._isMounting = false;
      comp._constructorCalled = true;

      expect(LifecycleManager.getLifecyclePhase(mockComponent)).toBe('constructed');
    });

    it('should return "unknown" when component state is unclear', () => {
      const comp = mockComponent as any;
      comp._isMounted = false;
      comp._isMounting = false;
      comp._constructorCalled = false;

      expect(LifecycleManager.getLifecyclePhase(mockComponent)).toBe('unknown');
    });

    it('should prioritize mounted state over mounting state', () => {
      // This shouldn't happen in practice, but tests edge cases
      const comp = mockComponent as any;
      comp._isMounted = true;
      comp._isMounting = true;

      expect(LifecycleManager.getLifecyclePhase(mockComponent)).toBe('mounted');
    });
  });

  describe('validateMountingReadiness', () => {
    it('should not throw for a component ready for mounting', () => {
      const comp = mockComponent as any;
      comp._constructorCalled = true;
      comp._isMounted = false;
      comp._isMounting = false;

      expect(() => {
        LifecycleManager.validateMountingReadiness(mockComponent);
      }).not.toThrow();
    });

    it('should throw if constructor has not been called', () => {
      const comp = mockComponent as any;
      comp._constructorCalled = false;

      expect(() => {
        LifecycleManager.validateMountingReadiness(mockComponent);
      }).toThrow('Component constructor has not been called');
    });

    it('should throw if component is already mounted', () => {
      const comp = mockComponent as any;
      comp._constructorCalled = true;
      comp._isMounted = true;

      expect(() => {
        LifecycleManager.validateMountingReadiness(mockComponent);
      }).toThrow('Component is already mounted');
    });

    it('should throw if component is currently mounting', () => {
      const comp = mockComponent as any;
      comp._constructorCalled = true;
      comp._isMounting = true;

      expect(() => {
        LifecycleManager.validateMountingReadiness(mockComponent);
      }).toThrow('Component is currently mounting');
    });

    it('should throw if component does not have render method', () => {
      const comp = mockComponent as any;
      comp._constructorCalled = true;
      comp._isMounted = false;
      comp._isMounting = false;
      delete comp.render;

      expect(() => {
        LifecycleManager.validateMountingReadiness(mockComponent);
      }).toThrow('Component must implement render() method');
    });

    it('should throw if render is not a function', () => {
      const comp = mockComponent as any;
      comp._constructorCalled = true;
      comp._isMounted = false;
      comp._isMounting = false;
      comp.render = 'not a function';

      expect(() => {
        LifecycleManager.validateMountingReadiness(mockComponent);
      }).toThrow('Component must implement render() method');
    });
  });

  describe('createLifecycleEvent', () => {
    beforeEach(() => {
      // Mock Date.now to ensure consistent timestamps
      jest.spyOn(Date, 'now').mockReturnValue(1234567890);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should create lifecycle event with all required properties', () => {
      const event = LifecycleManager.createLifecycleEvent(mockComponent, 'beforeMount');

      expect(event).toEqual({
        componentName: 'TestComponent',
        phase: 'beforeMount',
        timestamp: 1234567890,
        props: { testProp: 'value' },
        state: { testState: 'initial' }
      });
    });

    it('should create events for all lifecycle phases', () => {
      const phases: Array<'beforeMount' | 'didMount' | 'afterMount' | 'beforeUnmount'> = [
        'beforeMount',
        'didMount',
        'afterMount',
        'beforeUnmount'
      ];

      phases.forEach((phase) => {
        const event = LifecycleManager.createLifecycleEvent(mockComponent, phase);

        expect(event.phase).toBe(phase);
        expect(event.componentName).toBe('TestComponent');
      });
    });

    it('should use custom timestamp when provided', () => {
      const customTimestamp = 9876543210;
      const event = LifecycleManager.createLifecycleEvent(mockComponent, 'didMount', customTimestamp);

      expect(event.timestamp).toBe(customTimestamp);
    });

    it('should create shallow copies of props and state', () => {
      const event = LifecycleManager.createLifecycleEvent(mockComponent, 'afterMount');

      // Modify original props and state
      const comp = mockComponent as any;
      comp.props.testProp = 'modified';
      comp.state.testState = 'modified';

      // Event should still have original values
      expect(event.props.testProp).toBe('value');
      expect(event.state.testState).toBe('initial');
    });

    it('should handle components with empty props and state', () => {
      const componentWithEmptyData = {
        ...mockComponent,
        props: {},
        state: {},
        constructor: { name: 'EmptyComponent' }
      } as Partial<AtomComponent<any, any>> as AtomComponent<any, any>;

      const event = LifecycleManager.createLifecycleEvent(componentWithEmptyData, 'beforeMount');

      expect(event.props).toEqual({});
      expect(event.state).toEqual({});
      expect(event.componentName).toBe('EmptyComponent');
    });

    it('should handle components with complex props and state', () => {
      const complexComponent = {
        ...mockComponent,
        props: {
          stringProp: 'test',
          numberProp: 42,
          booleanProp: true,
          objectProp: { nested: 'value' },
          arrayProp: [1, 2, 3]
        },
        state: {
          complexState: { data: [{ id: 1, name: 'item' }] }
        }
      } as Partial<AtomComponent<any, any>> as AtomComponent<any, any>;

      const event = LifecycleManager.createLifecycleEvent(complexComponent, 'didMount');

      expect(event.props).toEqual(complexComponent.props);
      expect(event.state).toEqual(complexComponent.state);
    });

    it('should handle components with null/undefined props and state', () => {
      const componentWithNullData = {
        ...mockComponent,
        props: null,
        state: undefined
      } as Partial<AtomComponent<any, any>> as AtomComponent<any, any>;

      const event = LifecycleManager.createLifecycleEvent(componentWithNullData, 'afterMount');

      expect(event.props).toEqual({});
      expect(event.state).toEqual({});
    });
  });

  describe('Integration Tests', () => {
    it('should execute complete mounting lifecycle with validation', () => {
      // Validate component is ready
      LifecycleManager.validateMountingReadiness(mockComponent);

      // Check initial phase
      expect(LifecycleManager.getLifecyclePhase(mockComponent)).toBe('constructed');

      // Execute mounting lifecycle
      const result = LifecycleManager.executeMountingLifecycle(mockComponent, mockCreateDOMNodeFn);

      // Verify all lifecycle methods were called
      expect(executeBeforeMount).toHaveBeenCalled();
      expect(mockComponent.render).toHaveBeenCalled();
      expect(executeDidMount).toHaveBeenCalled();
      expect(result).toBe(mockDOMNode);
    });

    it('should handle full lifecycle component with all methods', () => {
      const fullComponent = {
        ...mockComponent,
        beforeMount: jest.fn<() => void>(),
        didMount: jest.fn<() => void>(),
        afterMount: jest.fn<() => void>(),
        __canInvokeBeforeMount: jest.fn(() => true),
        __canInvokeDidMount: jest.fn(() => true),
        __canInvokeAfterMount: jest.fn(() => true)
      } as Partial<AtomComponent<any, any>> as AtomComponent<any, any>;

      // Verify it supports full lifecycle
      expect(LifecycleManager.supportsFullMountingLifecycle(fullComponent)).toBe(true);

      // Execute mounting lifecycle
      LifecycleManager.executeMountingLifecycle(fullComponent, mockCreateDOMNodeFn);

      expect(executeBeforeMount).toHaveBeenCalledWith(fullComponent);
      expect(executeDidMount).toHaveBeenCalledWith(fullComponent);
    });

    it('should create lifecycle events during mounting process', () => {
      const events: any[] = [];

      // Mock the lifecycle execution to capture events
      (executeBeforeMount as jest.MockedFunction<typeof executeBeforeMount>).mockImplementation(() => {
        events.push(LifecycleManager.createLifecycleEvent(mockComponent, 'beforeMount'));
      });

      (executeDidMount as jest.MockedFunction<typeof executeDidMount>).mockImplementation(() => {
        events.push(LifecycleManager.createLifecycleEvent(mockComponent, 'didMount'));
      });

      LifecycleManager.executeMountingLifecycle(mockComponent, mockCreateDOMNodeFn);

      expect(events).toHaveLength(2);
      expect(events[0].phase).toBe('beforeMount');
      expect(events[1].phase).toBe('didMount');
    });

    it('should handle component state transitions during lifecycle', () => {
      // Start in constructed state
      const comp = mockComponent as any;
      comp._isMounting = false;
      comp._isMounted = false;

      expect(LifecycleManager.getLifecyclePhase(mockComponent)).toBe('constructed');

      // Simulate mounting state change
      comp._isMounting = true;
      expect(LifecycleManager.getLifecyclePhase(mockComponent)).toBe('mounting');

      // Simulate mounted state change
      comp._isMounting = false;
      comp._isMounted = true;
      expect(LifecycleManager.getLifecyclePhase(mockComponent)).toBe('mounted');
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      jest.resetAllMocks();
      // Re-set default behavior so executeAfterMount etc. aren’t left undefined
      (executeAfterMount as jest.MockedFunction<typeof executeAfterMount>).mockResolvedValue();
    });

    it('should handle errors in lifecycle execution gracefully', () => {
      (executeBeforeMount as jest.MockedFunction<typeof executeBeforeMount>).mockImplementation(() => {
        throw new Error('BeforeMount failed');
      });

      expect(() => {
        LifecycleManager.executeMountingLifecycle(mockComponent, mockCreateDOMNodeFn);
      }).toThrow('BeforeMount failed');
    });

    it('should handle render errors', () => {
      // no executeBeforeMount error here
      const comp = mockComponent as any;
      comp.render = jest.fn(() => {
        throw new Error('Render failed');
      });

      expect(() => {
        LifecycleManager.executeMountingLifecycle(mockComponent, mockCreateDOMNodeFn);
      }).toThrow('Render failed');
    });

    it('should handle createDOMNode errors', () => {
      mockCreateDOMNodeFn.mockImplementation(() => {
        throw new Error('DOM creation failed');
      });

      expect(() => {
        LifecycleManager.executeMountingLifecycle(mockComponent, mockCreateDOMNodeFn);
      }).toThrow('DOM creation failed');
    });

    it('should handle didMount errors', () => {
      (executeDidMount as jest.MockedFunction<typeof executeDidMount>).mockImplementation(() => {
        throw new Error('DidMount failed');
      });

      expect(() => {
        LifecycleManager.executeMountingLifecycle(mockComponent, mockCreateDOMNodeFn);
      }).toThrow('DidMount failed');
    });
  });
});
