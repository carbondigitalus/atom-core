/** @jest-environment jsdom */

// NPM Modules
import { expect, jest } from '@jest/globals';

// Custom Modules
import { executeAfterMount } from '@atomdev/core/core/lifecycle/afterMount';
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

  describe('Integration Tests', () => {
    describe('DOM Integration', () => {
      it('should allow third-party library integration', async () => {
        const mockLibrary = {
          init: jest.fn(),
          configure: jest.fn(),
          destroy: jest.fn()
        };

        const element = document.createElement('div');
        element.id = 'chart-container';
        document.body.appendChild(element);

        mockComponent.afterMount = jest.fn(() => {
          mockLibrary.init('#chart-container');
          mockLibrary.configure({ theme: 'dark' });
        });

        await executeAfterMount(mockComponent);

        expect(mockLibrary.init).toHaveBeenCalledWith('#chart-container');
        expect(mockLibrary.configure).toHaveBeenCalledWith({ theme: 'dark' });

        // Cleanup
        document.body.removeChild(element);
      });

      it('should support DOM event listeners correctly', async () => {
        const eventHandler = jest.fn();
        const button = document.createElement('button');
        button.id = 'test-button';
        document.body.appendChild(button);

        mockComponent.afterMount = jest.fn(() => {
          button.addEventListener('click', eventHandler);
          button.addEventListener('mouseenter', eventHandler);
        });

        await executeAfterMount(mockComponent);

        // Simulate events
        button.click();
        button.dispatchEvent(new MouseEvent('mouseenter'));

        expect(eventHandler).toHaveBeenCalledTimes(2);

        // Cleanup
        document.body.removeChild(button);
      });

      it('should support focus management properly', async () => {
        const input = document.createElement('input');
        input.type = 'text';
        input.id = 'focus-input';
        document.body.appendChild(input);

        mockComponent.afterMount = jest.fn(() => {
          input.focus();
          input.select();
        });

        await executeAfterMount(mockComponent);

        expect(document.activeElement).toBe(input);

        // Cleanup
        document.body.removeChild(input);
      });
    });

    describe('API Integration', () => {
      it('should handle successful API calls', async () => {
        const mockApiResponse = { id: 1, name: 'Test User', status: 'active' };
        const mockFetch = jest.fn<typeof fetch>().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(mockApiResponse),
          headers: undefined,
          redirected: false,
          status: 200,
          statusText: 'OK',
          type: 'basic',
          url: '/api/user/1',
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
        } as Response);

        global.fetch = mockFetch as any;

        let apiData = null;
        let loadingState = false;

        mockComponent.afterMount = jest.fn(async () => {
          loadingState = true;
          const response = await fetch('/api/user/1');
          apiData = await response.json();
          loadingState = false;
        });

        await executeAfterMount(mockComponent);

        expect(mockFetch).toHaveBeenCalledWith('/api/user/1');
        expect(apiData).toEqual(mockApiResponse);
        expect(loadingState).toBe(false);
      });

      it('should handle loading states correctly during API calls', async () => {
        const mockFetch = jest.fn().mockImplementation(
          () =>
            new Promise((resolve) =>
              setTimeout(
                () =>
                  resolve({
                    ok: true,
                    json: () => Promise.resolve({ data: 'test' })
                  }),
                50
              )
            )
        );

        global.fetch = mockFetch as any;

        const stateChanges: string[] = [];

        mockComponent.afterMount = jest.fn(async () => {
          stateChanges.push('loading-start');
          const response = await fetch('/api/data');
          await response.json();
          stateChanges.push('loading-end');
        });

        await executeAfterMount(mockComponent);

        expect(stateChanges).toEqual(['loading-start', 'loading-end']);
      });

      it('should display error states properly for failed API calls', async () => {
        const mockFetch = jest
          .fn<typeof fetch>()
          .mockRejectedValue(new Error('Network error'));
        global.fetch = mockFetch as any;

        let errorState = null;

        mockComponent.afterMount = jest.fn(async () => {
          try {
            await fetch('/api/failing-endpoint');
          } catch (error) {
            errorState =
              error instanceof Error ? error.message : 'Unknown error';
          }
        });

        await executeAfterMount(mockComponent);

        expect(errorState).toBe('Network error');
      });
    });

    describe('Animation and Visual Effects', () => {
      it('should initialize animations correctly', async () => {
        const element = document.createElement('div');
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px)';
        document.body.appendChild(element);

        mockComponent.afterMount = jest.fn(() => {
          element.style.transition = 'all 0.3s ease';
          element.style.opacity = '1';
          element.style.transform = 'translateY(0)';
        });

        await executeAfterMount(mockComponent);

        expect(element.style.opacity).toBe('1');
        expect(element.style.transform).toBe('translateY(0)');
        expect(element.style.transition).toBe('all 0.3s ease');

        // Cleanup
        document.body.removeChild(element);
      });

      it('should setup Intersection Observer properly', async () => {
        const mockObserver = {
          observe: jest.fn(),
          unobserve: jest.fn(),
          disconnect: jest.fn()
        };

        const mockIntersectionObserver = jest
          .fn()
          .mockImplementation(() => mockObserver) as jest.MockedClass<
          typeof IntersectionObserver
        >;
        global.IntersectionObserver = mockIntersectionObserver;

        const targetElement = document.createElement('div');
        targetElement.className = 'lazy-load';
        document.body.appendChild(targetElement);

        mockComponent.afterMount = jest.fn(() => {
          const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                entry.target.classList.add('visible');
              }
            });
          });
          observer.observe(targetElement);
        });

        await executeAfterMount(mockComponent);

        expect(mockIntersectionObserver).toHaveBeenCalled();
        expect(mockObserver.observe).toHaveBeenCalledWith(targetElement);

        // Cleanup
        document.body.removeChild(targetElement);
      });

      it('should handle resize observers correctly', async () => {
        const mockResizeObserver = {
          observe: jest.fn(),
          unobserve: jest.fn(),
          disconnect: jest.fn()
        };

        const mockResizeObserverConstructor = jest
          .fn()
          .mockImplementation(() => mockResizeObserver) as jest.MockedClass<
          typeof ResizeObserver
        >;
        global.ResizeObserver = mockResizeObserverConstructor;

        const element = document.createElement('div');
        document.body.appendChild(element);

        mockComponent.afterMount = jest.fn(() => {
          const resizeObserver = new ResizeObserver((entries) => {
            entries.forEach((entry) => {
              console.log('Element resized:', entry.contentRect);
            });
          });
          resizeObserver.observe(element);
        });

        await executeAfterMount(mockComponent);

        expect(mockResizeObserverConstructor).toHaveBeenCalled();
        expect(mockResizeObserver.observe).toHaveBeenCalledWith(element);

        // Cleanup
        document.body.removeChild(element);
      });

      it('should manage scroll position correctly', async () => {
        const scrollContainer = document.createElement('div');
        scrollContainer.style.height = '200px';
        scrollContainer.style.overflowY = 'scroll';

        const content = document.createElement('div');
        content.style.height = '1000px';
        scrollContainer.appendChild(content);

        document.body.appendChild(scrollContainer);

        mockComponent.afterMount = jest.fn(() => {
          // Restore scroll position
          scrollContainer.scrollTop = 500;

          // Setup scroll listener
          scrollContainer.addEventListener('scroll', () => {
            localStorage.setItem(
              'scrollPosition',
              scrollContainer.scrollTop.toString()
            );
          });
        });

        await executeAfterMount(mockComponent);

        expect(scrollContainer.scrollTop).toBe(500);

        // Simulate scroll
        scrollContainer.scrollTop = 300;
        scrollContainer.dispatchEvent(new Event('scroll'));

        // Cleanup
        document.body.removeChild(scrollContainer);
      });
    });
  });
});
