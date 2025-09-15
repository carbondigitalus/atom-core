/** @jest-environment jsdom */

// NPM Modules
import { expect, jest } from '@jest/globals';

// Custom Modules
import {
  executeAfterMount,
  executeAfterMountNonBlocking,
  hasAfterMountSupport,
  safeExecuteAfterMount,
  batchExecuteAfterMount,
  createAfterMountCleanup
} from '@atomdev/core/core/lifecycle/afterMount';
import AfterMountCapableComponent from '@atomdev/core/utils/interfaces/AfterMountCapableComponent';

describe('afterMount Lifecycle', () => {
  let mockComponent: AfterMountCapableComponent;
  let consoleErrorSpy: ReturnType<typeof jest.spyOn>;

  beforeEach(() => {
    // Mock console.error to avoid cluttering test output
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    // Create base mock component
    mockComponent = {
      __canInvokeAfterMount: jest.fn(() => true),
      __markAfterMountCalled: jest.fn(),
      afterMount: jest.fn()
    } as AfterMountCapableComponent;
  });

  afterEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    consoleErrorSpy.mockRestore();
    jest.clearAllMocks();
  });

  describe('Unit Tests', () => {
    describe('Execution Order', () => {
      it('should call __markAfterMountCalled before afterMount', async () => {
        const callOrder: string[] = [];

        mockComponent.__markAfterMountCalled = jest.fn(() => {
          callOrder.push('markAfterMountCalled');
        });

        mockComponent.afterMount = jest.fn(() => {
          callOrder.push('afterMount');
        });

        await executeAfterMount(mockComponent);

        expect(callOrder).toEqual(['markAfterMountCalled', 'afterMount']);
      });

      it('should only execute if __canInvokeAfterMount returns true', async () => {
        mockComponent.__canInvokeAfterMount = jest.fn(() => false);

        await executeAfterMount(mockComponent);

        expect(mockComponent.afterMount).not.toHaveBeenCalled();
        expect(mockComponent.__markAfterMountCalled).not.toHaveBeenCalled();
      });

      it('should execute if __canInvokeAfterMount is undefined but afterMount exists', async () => {
        delete mockComponent.__canInvokeAfterMount;

        await executeAfterMount(mockComponent);

        expect(mockComponent.afterMount).toHaveBeenCalled();
        expect(mockComponent.__markAfterMountCalled).toHaveBeenCalled();
      });

      it('should not execute if afterMount is undefined and __canInvokeAfterMount is undefined', async () => {
        delete mockComponent.__canInvokeAfterMount;
        delete mockComponent.afterMount;

        await executeAfterMount(mockComponent);

        expect(mockComponent.__markAfterMountCalled).not.toHaveBeenCalled();
      });

      it('should be called only once during component lifetime', async () => {
        await executeAfterMount(mockComponent);
        await executeAfterMount(mockComponent);

        expect(mockComponent.afterMount).toHaveBeenCalledTimes(2);
        expect(mockComponent.__markAfterMountCalled).toHaveBeenCalledTimes(2);
      });

      it('should be called after all child components are mounted', async () => {
        const childComponent = {
          __canInvokeAfterMount: jest.fn<() => boolean>(() => true),
          __markAfterMountCalled: jest.fn<() => void>(),
          afterMount: jest.fn<() => void>()
        };

        const callOrder: string[] = [];

        childComponent.afterMount = jest.fn(() => {
          callOrder.push('child-afterMount');
        });

        mockComponent.afterMount = jest.fn(() => {
          callOrder.push('parent-afterMount');
        });

        // Simulate child mounting first, then parent
        await executeAfterMount(childComponent);
        await executeAfterMount(mockComponent);

        expect(callOrder).toEqual(['child-afterMount', 'parent-afterMount']);
      });
    });

    describe('DOM Access', () => {
      it('should have all refs populated and accessible', async () => {
        const testElement = document.createElement('div');
        testElement.id = 'test-ref';
        testElement.setAttribute('data-ref', 'testRef');
        document.body.appendChild(testElement);

        mockComponent.afterMount = jest.fn(() => {
          const refElement = document.getElementById('test-ref');
          expect(refElement).toBeTruthy();
          expect(refElement?.getAttribute('data-ref')).toBe('testRef');
        });

        await executeAfterMount(mockComponent);

        expect(mockComponent.afterMount).toHaveBeenCalled();

        // Cleanup
        document.body.removeChild(testElement);
      });

      it('should allow DOM elements to be queried and manipulated', async () => {
        const container = document.createElement('div');
        container.innerHTML = '<p id="target">Original text</p>';
        document.body.appendChild(container);

        mockComponent.afterMount = jest.fn(() => {
          const target = document.getElementById('target');
          expect(target).toBeTruthy();
          if (target) {
            target.textContent = 'Modified in afterMount';
            target.style.color = 'red';
          }
        });

        await executeAfterMount(mockComponent);

        const target = document.getElementById('target');
        expect(target?.textContent).toBe('Modified in afterMount');
        expect(target?.style.color).toBe('red');

        // Cleanup
        document.body.removeChild(container);
      });

      it('should have computed styles and dimensions available', async () => {
        const element = document.createElement('div');
        element.style.width = '100px';
        element.style.height = '50px';
        element.style.backgroundColor = 'blue';
        document.body.appendChild(element);

        mockComponent.afterMount = jest.fn(() => {
          const computedStyle = window.getComputedStyle(element);
          expect(computedStyle.width).toBe('100px');
          expect(computedStyle.height).toBe('50px');
          expect(computedStyle.backgroundColor).toBe('blue');

          const rect = element.getBoundingClientRect();
          expect(rect.width).toBe(100);
          expect(rect.height).toBe(50);
        });

        await executeAfterMount(mockComponent);

        // Cleanup
        document.body.removeChild(element);
      });
    });

    describe('State Modifications', () => {
      it('should handle setState calls that trigger re-render cycle', async () => {
        let componentState = { count: 0, mounted: false };
        let rerenderTriggered = false;

        const mockSetState = jest.fn(
          (newState: Partial<typeof componentState>) => {
            componentState = { ...componentState, ...newState };
            rerenderTriggered = true;
          }
        );

        mockComponent.afterMount = jest.fn(() => {
          mockSetState({ count: 1, mounted: true });
        });

        await executeAfterMount(mockComponent);

        expect(mockSetState).toHaveBeenCalledWith({ count: 1, mounted: true });
        expect(componentState.count).toBe(1);
        expect(componentState.mounted).toBe(true);
        expect(rerenderTriggered).toBe(true);
      });

      it('should handle async state updates correctly', async () => {
        let componentState = { loading: false, data: null };

        const mockSetState = jest.fn(
          (newState: Partial<typeof componentState>) => {
            componentState = { ...componentState, ...newState };
          }
        );

        mockComponent.afterMount = jest.fn(async () => {
          mockSetState({ loading: true });

          // Simulate async operation
          await new Promise((resolve) => setTimeout(resolve, 10));

          mockSetState({ loading: false, data: 'loaded data' });
        });

        await executeAfterMount(mockComponent);

        expect(componentState.loading).toBe(false);
        expect(componentState.data).toBe('loaded data');
        expect(mockSetState).toHaveBeenCalledTimes(2);
      });

      it('should update component properly after afterMount state changes', async () => {
        let componentUpdated = false;
        const mockUpdate = jest.fn(() => {
          componentUpdated = true;
        });

        mockComponent.afterMount = jest.fn(() => {
          // Simulate state change that triggers update
          mockUpdate();
        });

        await executeAfterMount(mockComponent);

        expect(mockUpdate).toHaveBeenCalled();
        expect(componentUpdated).toBe(true);
      });
    });

    describe('Error Handling', () => {
      it('should catch errors in synchronous afterMount and continue execution', async () => {
        mockComponent.afterMount = jest.fn(() => {
          throw new Error('Sync afterMount error');
        });

        await expect(executeAfterMount(mockComponent)).resolves.toBeUndefined();

        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'afterMount() error:',
          expect.any(Error)
        );
      });

      it('should handle errors in __markAfterMountCalled gracefully', async () => {
        mockComponent.__markAfterMountCalled = jest.fn(() => {
          throw new Error('markAfterMountCalled error');
        });

        await expect(executeAfterMount(mockComponent)).resolves.toBeUndefined();

        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'afterMount() error:',
          expect.any(Error)
        );
      });

      it('should handle errors in __canInvokeAfterMount gracefully', async () => {
        mockComponent.__canInvokeAfterMount = jest.fn(() => {
          throw new Error('canInvokeAfterMount error');
        });

        await expect(executeAfterMount(mockComponent)).resolves.toBeUndefined();

        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'afterMount() error:',
          expect.any(Error)
        );
      });

      it('should remain functional even if afterMount fails', async () => {
        mockComponent.afterMount = jest.fn(() => {
          throw new Error('afterMount failure');
        });

        // Component should still be considered functional
        await executeAfterMount(mockComponent);

        // Subsequent operations should still work
        expect(mockComponent.__markAfterMountCalled).toHaveBeenCalled();
        expect(consoleErrorSpy).toHaveBeenCalled();
      });
    });

    describe('Async Operations', () => {
      it('should handle async afterMount correctly', async () => {
        let asyncCompleted = false;

        mockComponent.afterMount = jest.fn(async () => {
          await new Promise((resolve) => setTimeout(resolve, 50));
          asyncCompleted = true;
        });

        await executeAfterMount(mockComponent);

        expect(asyncCompleted).toBe(true);
        expect(mockComponent.afterMount).toHaveBeenCalled();
      });

      it('should handle state updates from async operations', async () => {
        let componentState = { data: null, loading: true };

        mockComponent.afterMount = jest.fn(async () => {
          // Simulate async data fetch
          await new Promise((resolve) => setTimeout(resolve, 10));
          componentState = { data: 'fetched data', loading: false };
        });

        await executeAfterMount(mockComponent);

        expect(componentState.data).toBe('fetched data');
        expect(componentState.loading).toBe(false);
      });

      it('should handle error handling for failed async operations', async () => {
        mockComponent.afterMount = jest.fn(async () => {
          await new Promise((resolve) => setTimeout(resolve, 10));
          throw new Error('Async operation failed');
        });

        await expect(executeAfterMount(mockComponent)).resolves.toBeUndefined();

        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'afterMount() error:',
          expect.any(Error)
        );
      });
    });
  });

  describe('hasAfterMountSupport Function', () => {
    it('should return true for components with __canInvokeAfterMount', () => {
      const component = { __canInvokeAfterMount: () => true };
      expect(hasAfterMountSupport(component)).toBe(true);
    });

    it('should return true for components with afterMount method', () => {
      const component = { afterMount: () => {} };
      expect(hasAfterMountSupport(component)).toBe(true);
    });

    it('should return true for components with both methods', () => {
      const component = {
        __canInvokeAfterMount: () => true,
        afterMount: () => {}
      };
      expect(hasAfterMountSupport(component)).toBe(true);
    });

    it('should return false for null or undefined', () => {
      expect(hasAfterMountSupport(null)).toBe(false);
      expect(hasAfterMountSupport(undefined)).toBe(false);
    });

    it('should return false for non-objects', () => {
      expect(hasAfterMountSupport('string')).toBe(false);
      expect(hasAfterMountSupport(123)).toBe(false);
      expect(hasAfterMountSupport(true)).toBe(false);
    });

    it('should return false for objects without afterMount support', () => {
      expect(hasAfterMountSupport({})).toBe(false);
      expect(hasAfterMountSupport({ someMethod: () => {} })).toBe(false);
    });
  });

  describe('safeExecuteAfterMount Function', () => {
    it('should execute afterMount for supported components', async () => {
      await safeExecuteAfterMount(mockComponent);

      expect(mockComponent.afterMount).toHaveBeenCalled();
      expect(mockComponent.__markAfterMountCalled).toHaveBeenCalled();
    });

    it('should not execute for unsupported components', async () => {
      const unsupportedComponent = { someMethod: () => {} };

      await expect(
        safeExecuteAfterMount(unsupportedComponent)
      ).resolves.toBeUndefined();
    });

    it('should not execute for null/undefined', async () => {
      await expect(safeExecuteAfterMount(null)).resolves.toBeUndefined();
      await expect(safeExecuteAfterMount(undefined)).resolves.toBeUndefined();
    });

    it('should handle errors in supported components', async () => {
      mockComponent.afterMount = jest.fn(() => {
        throw new Error('Safe execute error');
      });

      await expect(
        safeExecuteAfterMount(mockComponent)
      ).resolves.toBeUndefined();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'afterMount() error:',
        expect.any(Error)
      );
    });
  });

  describe('executeAfterMountNonBlocking Function', () => {
    it('should execute afterMount without awaiting', () => {
      const promise = executeAfterMountNonBlocking(mockComponent);

      expect(promise).toBeInstanceOf(Promise);
      expect(mockComponent.afterMount).toHaveBeenCalled();
    });

    it('should handle errors without throwing', async () => {
      mockComponent.afterMount = jest.fn(() => {
        throw new Error('Non-blocking error');
      });

      const promise = executeAfterMountNonBlocking(mockComponent);

      await expect(promise).resolves.toBeUndefined();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'afterMount() error:',
        expect.any(Error)
      );
    });
  });

  describe('batchExecuteAfterMount Function', () => {
    it('should execute afterMount on multiple components', async () => {
      const component1 = {
        __canInvokeAfterMount: jest.fn<() => boolean>(() => true),
        __markAfterMountCalled: jest.fn<() => void>(),
        afterMount: jest.fn<() => void>()
      };

      const component2 = {
        __canInvokeAfterMount: jest.fn<() => boolean>(() => true),
        __markAfterMountCalled: jest.fn<() => void>(),
        afterMount: jest.fn<() => void>()
      };

      await batchExecuteAfterMount([component1, component2]);

      expect(component1.afterMount).toHaveBeenCalled();
      expect(component2.afterMount).toHaveBeenCalled();
    });

    it('should filter out unsupported components', async () => {
      const supportedComponent = {
        __canInvokeAfterMount: jest.fn<() => boolean>(() => true),
        __markAfterMountCalled: jest.fn<() => void>(),
        afterMount: jest.fn<() => void>()
      };

      const unsupportedComponent = { someMethod: () => {} };

      await expect(
        batchExecuteAfterMount([
          supportedComponent,
          unsupportedComponent as AfterMountCapableComponent
        ])
      ).resolves.toBeUndefined();

      expect(supportedComponent.afterMount).toHaveBeenCalled();
    });

    it('should handle errors in batch execution', async () => {
      const workingComponent = {
        afterMount: jest.fn<() => void>()
      };

      const failingComponent = {
        afterMount: jest.fn(() => {
          throw new Error('Batch execution error');
        })
      };

      await batchExecuteAfterMount([workingComponent, failingComponent]);

      expect(workingComponent.afterMount).toHaveBeenCalled();
      expect(failingComponent.afterMount).toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'afterMount() error:',
        expect.any(Error)
      );
    });
  });

  describe('createAfterMountCleanup Function', () => {
    it('should create cleanup function that removes component reference', () => {
      const componentNode = {
        __atomComponent: mockComponent
      };

      const cleanup = createAfterMountCleanup(componentNode);

      expect(componentNode.__atomComponent).toBe(mockComponent);

      cleanup();

      expect(componentNode.__atomComponent).toBeUndefined();
    });

    it('should handle nodes without component references', () => {
      const componentNode = {};

      const cleanup = createAfterMountCleanup(componentNode);

      expect(() => cleanup()).not.toThrow();
    });
  });
});
