// Custom Modules
import { Children } from '../utils/types/Children';
import { Component } from '../utils/types/Component';
import { IntrinsicVNode } from '../utils/types/IntrinsicVNode';
import { PrimitiveChild } from '../utils/types/PrimitiveChild';

function isClassComponentVNode(
  x: unknown
): x is { type: new (props: any) => Component; props?: any } {
  return (
    typeof x === 'object' &&
    x !== null &&
    'type' in x &&
    typeof (x as { type?: unknown }).type === 'function'
  );
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
    const result = instance.render();
    return createDOMNode(result);
  }

  // fallback for unknown objects
  return document.createTextNode('');
}

export { createDOMNode };
