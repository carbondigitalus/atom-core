/** @jest-environment jsdom */

// NPM Modules
import { expect, jest } from '@jest/globals';

// Custom Modules
import {
  executeDidMount,
  hasDidMountSupport,
  safeExecuteDidMount
} from '@atomdev/core/core/lifecycle/didMount';
import DidMountCapableComponent from '@atomdev/core/utils/interfaces/DidMountCapableComponent';

describe('didMount Lifecycle', () => {
  let mockComponent: DidMountCapableComponent;
  let consoleErrorSpy: ReturnType<typeof jest.spyOn>;

  beforeEach(() => {
    // Mock console.error to avoid cluttering test output
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    // Create base mock component
    mockComponent = {
      __canInvokeDidMount: jest.fn(() => true),
      __markDidMountCalled: jest.fn(),
      __markMounted: jest.fn(),
      didMount: jest.fn()
    } as DidMountCapableComponent;
  });

  afterEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    consoleErrorSpy.mockRestore();
    jest.clearAllMocks();
  });

  describe('Unit Tests', () => {
    describe('Execution Order', () => {
      it('should call __markDidMountCalled before didMount', () => {
        const callOrder: string[] = [];

        mockComponent.__markDidMountCalled = jest.fn(() => {
          callOrder.push('markDidMountCalled');
        });

        mockComponent.didMount = jest.fn(() => {
          callOrder.push('didMount');
        });

        executeDidMount(mockComponent);

        expect(callOrder).toEqual(['markDidMountCalled', 'didMount']);
      });

      it('should call __markMounted after didMount', () => {
        const callOrder: string[] = [];

        mockComponent.didMount = jest.fn(() => {
          callOrder.push('didMount');
        });

        mockComponent.__markMounted = jest.fn(() => {
          callOrder.push('markMounted');
        });

        mockComponent.__markDidMountCalled = jest.fn(() => {
          callOrder.push('markDidMountCalled');
        });

        executeDidMount(mockComponent);

        expect(callOrder).toEqual([
          'markDidMountCalled',
          'didMount',
          'markMounted'
        ]);
      });

      it('should only execute if __canInvokeDidMount returns true', () => {
        mockComponent.__canInvokeDidMount = jest.fn(() => false);

        executeDidMount(mockComponent);

        expect(mockComponent.didMount).not.toHaveBeenCalled();
        expect(mockComponent.__markDidMountCalled).not.toHaveBeenCalled();
        expect(mockComponent.__markMounted).not.toHaveBeenCalled();
      });

      it('should execute if __canInvokeDidMount is undefined but didMount exists', () => {
        delete mockComponent.__canInvokeDidMount;

        executeDidMount(mockComponent);

        expect(mockComponent.didMount).toHaveBeenCalled();
        expect(mockComponent.__markDidMountCalled).toHaveBeenCalled();
        expect(mockComponent.__markMounted).toHaveBeenCalled();
      });

      it('should not execute if didMount is undefined and __canInvokeDidMount is undefined', () => {
        delete mockComponent.__canInvokeDidMount;
        delete mockComponent.didMount;

        executeDidMount(mockComponent);

        expect(mockComponent.__markDidMountCalled).not.toHaveBeenCalled();
        expect(mockComponent.__markMounted).not.toHaveBeenCalled();
      });
    });

    describe('DOM Access & State Modifications', () => {
      it('should allow synchronous DOM manipulation in didMount', () => {
        const domElement = document.createElement('div');
        domElement.id = 'test-element';
        document.body.appendChild(domElement);

        mockComponent.didMount = jest.fn(() => {
          const element = document.getElementById('test-element');
          expect(element).toBeTruthy();
          if (element) {
            element.textContent = 'Modified in didMount';
          }
        });

        executeDidMount(mockComponent);

        expect(domElement.textContent).toBe('Modified in didMount');

        // Cleanup
        document.body.removeChild(domElement);
      });

      it('should handle state modifications in didMount', () => {
        let componentState = { mounted: false };

        mockComponent.didMount = jest.fn(() => {
          componentState.mounted = true;
        });

        executeDidMount(mockComponent);

        expect(componentState.mounted).toBe(true);
        expect(mockComponent.didMount).toHaveBeenCalled();
      });
    });

    describe('Error Handling', () => {
      it('should catch errors in synchronous didMount and continue execution', () => {
        mockComponent.didMount = jest.fn(() => {
          throw new Error('Sync didMount error');
        });

        expect(() => executeDidMount(mockComponent)).not.toThrow();

        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'didMount() error:',
          expect.any(Error)
        );
        expect(mockComponent.__markMounted).toHaveBeenCalled();
      });

      it('should handle errors in __markDidMountCalled gracefully', () => {
        mockComponent.__markDidMountCalled = jest.fn(() => {
          throw new Error('markDidMountCalled error');
        });

        expect(() => executeDidMount(mockComponent)).not.toThrow();

        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'didMount() error:',
          expect.any(Error)
        );
        expect(mockComponent.__markMounted).toHaveBeenCalled();
      });

      it('should handle errors in __markMounted gracefully', () => {
        mockComponent.__markMounted = jest.fn(() => {
          throw new Error('markMounted error');
        });

        expect(() => executeDidMount(mockComponent)).not.toThrow();

        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'didMount() error:',
          expect.any(Error)
        );
      });

      it('should handle errors in __canInvokeDidMount gracefully', () => {
        mockComponent.__canInvokeDidMount = jest.fn(() => {
          throw new Error('canInvokeDidMount error');
        });

        expect(() => executeDidMount(mockComponent)).not.toThrow();

        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'didMount() error:',
          expect.any(Error)
        );
        expect(mockComponent.__markMounted).toHaveBeenCalled();
      });
    });

    describe('Async Operations', () => {
      it('should handle async didMount without blocking', async () => {
        let asyncCompleted = false;

        mockComponent.didMount = jest.fn(async () => {
          await new Promise((resolve) => setTimeout(resolve, 100));
          asyncCompleted = true;
        });

        executeDidMount(mockComponent);

        // Should not block - async execution continues in background
        expect(asyncCompleted).toBe(false);
        expect(mockComponent.__markMounted).toHaveBeenCalled();

        // Wait for async operation to complete
        await new Promise((resolve) => setTimeout(resolve, 150));
        expect(asyncCompleted).toBe(true);
      });

      it('should catch errors in async didMount', async () => {
        mockComponent.didMount = jest.fn(async () => {
          await new Promise((resolve) => setTimeout(resolve, 10));
          throw new Error('Async didMount error');
        });

        executeDidMount(mockComponent);

        // Wait for async error to be caught
        await new Promise((resolve) => setTimeout(resolve, 50));

        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Async didMount() error:',
          expect.any(Error)
        );
      });

      it('should not await async didMount return value', () => {
        const mockPromise = Promise.resolve();
        mockComponent.didMount = jest.fn(() => mockPromise);

        const result = executeDidMount(mockComponent);

        expect(result).toBeUndefined();
        expect(mockComponent.__markMounted).toHaveBeenCalled();
      });

      it('should handle non-thenable return values', () => {
        mockComponent.didMount = jest.fn(() => {}) as any;

        expect(() => executeDidMount(mockComponent)).not.toThrow();
        expect(mockComponent.__markMounted).toHaveBeenCalled();
      });
    });
  });

  describe('hasDidMountSupport Function', () => {
    it('should return true for components with __canInvokeDidMount', () => {
      const component = { __canInvokeDidMount: () => true };
      expect(hasDidMountSupport(component)).toBe(true);
    });

    it('should return true for components with didMount method', () => {
      const component = { didMount: () => {} };
      expect(hasDidMountSupport(component)).toBe(true);
    });

    it('should return true for components with both methods', () => {
      const component = {
        __canInvokeDidMount: () => true,
        didMount: () => {}
      };
      expect(hasDidMountSupport(component)).toBe(true);
    });

    it('should return false for null or undefined', () => {
      expect(hasDidMountSupport(null)).toBe(false);
      expect(hasDidMountSupport(undefined)).toBe(false);
    });

    it('should return false for non-objects', () => {
      expect(hasDidMountSupport('string')).toBe(false);
      expect(hasDidMountSupport(123)).toBe(false);
      expect(hasDidMountSupport(true)).toBe(false);
    });

    it('should return false for objects without didMount support', () => {
      expect(hasDidMountSupport({})).toBe(false);
      expect(hasDidMountSupport({ someMethod: () => {} })).toBe(false);
    });
  });

  describe('safeExecuteDidMount Function', () => {
    it('should execute didMount for supported components', () => {
      safeExecuteDidMount(mockComponent);

      expect(mockComponent.didMount).toHaveBeenCalled();
      expect(mockComponent.__markMounted).toHaveBeenCalled();
    });

    it('should not execute for unsupported components', () => {
      const unsupportedComponent = { someMethod: () => {} };

      expect(() => safeExecuteDidMount(unsupportedComponent)).not.toThrow();
      // No expectations on method calls since component doesn't have them
    });

    it('should not execute for null/undefined', () => {
      expect(() => safeExecuteDidMount(null)).not.toThrow();
      expect(() => safeExecuteDidMount(undefined)).not.toThrow();
    });

    it('should handle errors in supported components', () => {
      mockComponent.didMount = jest.fn(() => {
        throw new Error('Safe execute error');
      });

      expect(() => safeExecuteDidMount(mockComponent)).not.toThrow();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'didMount() error:',
        expect.any(Error)
      );
    });
  });

  describe('Integration Tests', () => {
    describe('DOM Integration', () => {
      it('should allow third-party library initialization in didMount', () => {
        const mockLibrary = {
          init: jest.fn(),
          destroy: jest.fn()
        };

        mockComponent.didMount = jest.fn(() => {
          mockLibrary.init();
        });

        executeDidMount(mockComponent);

        expect(mockLibrary.init).toHaveBeenCalled();
      });

      it('should support event listener registration in didMount', () => {
        const eventHandler = jest.fn();
        const element = document.createElement('button');
        document.body.appendChild(element);

        mockComponent.didMount = jest.fn(() => {
          element.addEventListener('click', eventHandler);
        });

        executeDidMount(mockComponent);

        // Simulate click
        element.click();
        expect(eventHandler).toHaveBeenCalled();

        // Cleanup
        document.body.removeChild(element);
      });

      it('should support focus management in didMount', () => {
        const input = document.createElement('input');
        document.body.appendChild(input);

        mockComponent.didMount = jest.fn(() => {
          input.focus();
        });

        executeDidMount(mockComponent);

        expect(document.activeElement).toBe(input);

        // Cleanup
        document.body.removeChild(input);
      });
    });

    describe('API Integration', () => {
      it('should handle successful API calls in async didMount', async () => {
        const mockApiResponse = { id: 1, name: 'Test User' };
        const mockFetch = jest.fn<typeof fetch>().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(mockApiResponse),
          headers: undefined,
          redirected: false,
          status: 0,
          statusText: '',
          type: 'error',
          url: '',
          clone: function (): Response {
            throw new Error('Function not implemented.');
          },
          body: undefined,
          bodyUsed: false,
          arrayBuffer: function (): Promise<ArrayBuffer> {
            throw new Error('Function not implemented.');
          },
          blob: function (): Promise<Blob> {
            throw new Error('Function not implemented.');
          },
          bytes: function (): Promise<Uint8Array<ArrayBuffer>> {
            throw new Error('Function not implemented.');
          },
          formData: function (): Promise<FormData> {
            throw new Error('Function not implemented.');
          },
          text: function (): Promise<string> {
            throw new Error('Function not implemented.');
          }
        });

        (global as any).fetch = mockFetch;

        let apiData = null;
        mockComponent.didMount = jest.fn(async () => {
          const response = await fetch('/api/user');
          apiData = await response.json();
        });

        executeDidMount(mockComponent);

        // Wait for async operation
        await new Promise((resolve) => setTimeout(resolve, 10));

        expect(mockFetch).toHaveBeenCalledWith('/api/user');
        expect(apiData).toEqual(mockApiResponse);
      });

      it('should handle API call failures in async didMount', async () => {
        const mockFetch = jest
          .fn<typeof fetch>()
          .mockRejectedValue(new Error('API Error'));
        global.fetch = mockFetch;

        mockComponent.didMount = jest.fn(async () => {
          await fetch('/api/user');
        });

        executeDidMount(mockComponent);

        // Wait for async error to be caught
        await new Promise((resolve) => setTimeout(resolve, 10));

        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Async didMount() error:',
          expect.any(Error)
        );
      });
    });

    describe('Animation and Visual Effects', () => {
      it('should support animation initialization in didMount', () => {
        const element = document.createElement('div');
        element.style.opacity = '0';
        document.body.appendChild(element);

        mockComponent.didMount = jest.fn(() => {
          element.style.transition = 'opacity 0.3s';
          element.style.opacity = '1';
        });

        executeDidMount(mockComponent);

        expect(element.style.opacity).toBe('1');
        expect(element.style.transition).toBe('opacity 0.3s');

        // Cleanup
        document.body.removeChild(element);
      });

      it('should support Intersection Observer setup in didMount', () => {
        const mockObserver = {
          observe: jest.fn(),
          unobserve: jest.fn(),
          disconnect: jest.fn()
        };

        const mockIntersectionObserver = jest
          .fn()
          .mockImplementation(() => mockObserver);
        (global as any).IntersectionObserver = mockIntersectionObserver;

        const targetElement = document.createElement('div');
        document.body.appendChild(targetElement);

        mockComponent.didMount = jest.fn(() => {
          const observer = new IntersectionObserver(() => {});
          observer.observe(targetElement);
        });

        executeDidMount(mockComponent);

        expect(mockIntersectionObserver).toHaveBeenCalled();
        expect(mockObserver.observe).toHaveBeenCalledWith(targetElement);

        // Cleanup
        document.body.removeChild(targetElement);
      });

      it('should support scroll position management in didMount', () => {
        const scrollableElement = document.createElement('div');
        scrollableElement.style.height = '100px';
        scrollableElement.style.overflowY = 'scroll';

        const contentElement = document.createElement('div');
        contentElement.style.height = '500px';
        scrollableElement.appendChild(contentElement);

        document.body.appendChild(scrollableElement);

        mockComponent.didMount = jest.fn(() => {
          scrollableElement.scrollTop = 200;
        });

        executeDidMount(mockComponent);

        expect(scrollableElement.scrollTop).toBe(200);

        // Cleanup
        document.body.removeChild(scrollableElement);
      });
    });
  });
});
