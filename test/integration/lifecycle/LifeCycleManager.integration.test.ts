/** @jest-environment jsdom */

// NPM Modules
import { expect, jest } from '@jest/globals';

// Custom Modules
import { AtomComponent } from '@atomdev/core/core/Component';
import { executeAfterMount } from '@atomdev/core/core/lifecycle/afterMount';
import { executeBeforeMount } from '@atomdev/core/core/lifecycle/beforeMount';
import { executeDidMount } from '@atomdev/core/core/lifecycle/didMount';
import { LifecycleManager } from '@atomdev/core/core/lifecycle/LifecycleManager';
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
});
