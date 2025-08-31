// Custom Modules
import { AtomComponent } from './Component';
import { Component as LegacyComponent } from '../utils/types/Component';
import { Children } from '../utils/types/Children';
import { IntrinsicVNode } from '../utils/types/IntrinsicVNode';
import { PrimitiveChild } from '../utils/types/PrimitiveChild';

function isClassComponentVNode(
  x: unknown
): x is { type: new (props: any) => AtomComponent<any, any>; props?: any } {
  if (typeof x !== 'object' || x === null) return false;

  const maybe = x as { type?: unknown };
  const t = maybe.type;

  // must be a constructor
  if (typeof t !== 'function') return false;

  // safely access prototype without using `any`
  const ctor: { prototype?: unknown } = t as { prototype?: unknown };
  const proto = ctor.prototype;
  if (typeof proto !== 'object' || proto === null) return false;

  const isAtom = proto instanceof AtomComponent;
  const isLegacy =
    typeof LegacyComponent === 'function' && proto instanceof LegacyComponent;

  // duck type: has a render() on prototype
  const hasRender =
    typeof (proto as { render?: unknown }).render === 'function';

  return isAtom || isLegacy || hasRender;
}

function isIntrinsicVNode(x: unknown): x is IntrinsicVNode {
  return (
    typeof x === 'object' &&
    x !== null &&
    'type' in x &&
    typeof (x as { type?: unknown }).type === 'string'
  );
}

function isPrimitive(x: unknown): x is PrimitiveChild {
  return typeof x === 'string' || typeof x === 'number';
}

// ---- Implementation ----
function createDOMNode(element: Children): Node {
  // null/undefined/booleans render nothing
  if (element == null || element === false || element === true) {
    return document.createTextNode('');
  }

  // primitives
  if (isPrimitive(element)) {
    return document.createTextNode(String(element));
  }

  // arrays
  if (Array.isArray(element)) {
    const fragment = document.createDocumentFragment();
    for (const child of element) {
      fragment.appendChild(createDOMNode(child));
    }
    return fragment;
  }

  // Intrinsic VNode (guaranteed string tag here)
  if (isIntrinsicVNode(element)) {
    const tagName = element.type as string; // satisfy createElement overload 3
    const props = element.props as
      | (Record<string, unknown> & { children?: Children })
      | undefined;

    const domEl = document.createElement(tagName);

    if (props) {
      // iterate safely over props (typed as Record<string, unknown>)
      const entries = Object.entries(props as Record<string, unknown>);
      for (const [key, value] of entries) {
        if (key === 'children') continue;

        if (key.startsWith('on') && typeof value === 'function') {
          const eventName = key.slice(2).toLowerCase();
          domEl.addEventListener(eventName, value as EventListener);
          continue;
        }

        domEl.setAttribute(key, String(value));
      }

      // children
      const children = props.children;
      if (children !== undefined) {
        if (Array.isArray(children)) {
          for (const child of children) {
            domEl.appendChild(createDOMNode(child));
          }
        } else {
          domEl.appendChild(createDOMNode(children));
        }
      }
    }

    return domEl;
  }

  // Class Component handling
  if (isClassComponentVNode(element)) {
    const ComponentClass = element.type;
    const instance = new ComponentClass(element.props || {});

    // Mount-phase (after ctor, before first render)
    const mountAware = instance as unknown as {
      __enterMountPhase?: () => void;
      __exitMountPhase?: () => void;
      __canInvokeBeforeMount?: () => boolean;
      __markBeforeMountCalled?: () => void;
      beforeMount?: () => void;
      render: () => any;
    };

    // Signal "we are mounting" so setState is allowed but non-scheduling
    if (typeof mountAware.__enterMountPhase === 'function') {
      mountAware.__enterMountPhase();
    }

    try {
      // Prefer the internal guard; otherwise, if user defined beforeMount(), call it once here.
      const canInvoke =
        typeof mountAware.__canInvokeBeforeMount === 'function'
          ? mountAware.__canInvokeBeforeMount()
          : typeof mountAware.beforeMount === 'function';

      if (canInvoke) {
        if (typeof mountAware.__markBeforeMountCalled === 'function') {
          mountAware.__markBeforeMountCalled();
        }
        // Synchronous call; do not await
        mountAware.beforeMount?.();
      }
    } catch (err) {
      // Don’t break mounting if user code throws
      // eslint-disable no-console
      console.error('beforeMount() error:', err);
      // (Intentionally avoid setState here: it may be disallowed depending on phase/impl.)
    } finally {
      if (typeof mountAware.__exitMountPhase === 'function') {
        mountAware.__exitMountPhase();
      }
    }

    // First render AFTER beforeMount()
    const result = instance.render();
    return createDOMNode(result);
  }

  // fallback for unknown objects
  return document.createTextNode('');
}

export { createDOMNode };
