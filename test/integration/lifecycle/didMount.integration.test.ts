/** @jest-environment jsdom */

// NPM Modules
import { expect, jest } from '@jest/globals';

// Custom Modules
import { executeDidMount } from '@atomdev/core/core/lifecycle/didMount';
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
        const mockFetch = jest.fn<typeof fetch>().mockRejectedValue(new Error('API Error'));
        global.fetch = mockFetch;

        mockComponent.didMount = jest.fn(async () => {
          await fetch('/api/user');
        });

        executeDidMount(mockComponent);

        // Wait for async error to be caught
        await new Promise((resolve) => setTimeout(resolve, 10));

        expect(consoleErrorSpy).toHaveBeenCalledWith('Async didMount() error:', expect.any(Error));
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

        const mockIntersectionObserver = jest.fn().mockImplementation(() => mockObserver);
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
