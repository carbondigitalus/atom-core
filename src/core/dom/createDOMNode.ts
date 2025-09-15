// Custom Modules
import { AtomComponent } from '../Component';
import { applyPropsToElement, createTextNode, createElement, attachComponentToNode } from '../dom/DOMUtils';
import { executeBeforeMount } from '../lifecycle/beforeMount';
import { executeDidMount } from '../lifecycle/didMount';
import AfterMountCapableComponent from '../../utils/interfaces/AfterMountCapableComponent';
import BeforeMountCapableComponent from '../../utils/interfaces/BeforeMountCapableComponent';
import DidMountCapableComponent from '../../utils/interfaces/DidMountCapableComponent';
import VNode from '../../utils/interfaces/VNode';
import { Component as LegacyComponent } from '../../utils/types/Component';
import { Children } from '../../utils/types/Children';
import { IntrinsicVNode } from '../../utils/types/IntrinsicVNode';
import { PrimitiveChild } from '../../utils/types/PrimitiveChild';

/**
 * Type guard for class component VNodes - more specific than generic VNode
 */
function isClassComponentVNode(x: unknown): x is VNode & { type: new (props: any) => AtomComponent<any, any> } {
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
  const isLegacy = typeof LegacyComponent === 'function' && proto instanceof LegacyComponent;

  // duck type: has a render() on prototype
  const hasRender = typeof (proto as { render?: unknown }).render === 'function';

  return isAtom || isLegacy || hasRender;
}

function isIntrinsicVNode(x: unknown): x is IntrinsicVNode {
  return typeof x === 'object' && x !== null && 'type' in x && typeof (x as { type?: unknown }).type === 'string';
}

function isPrimitive(x: unknown): x is PrimitiveChild {
  return typeof x === 'string' || typeof x === 'number';
}

// ---- Implementation ----
function createDOMNode(element: Children): Node {
  // null/undefined/booleans render nothing
  if (element == null || element === false || element === true) {
    return createTextNode('');
  }

  // primitives
  if (isPrimitive(element)) {
    return createTextNode(String(element));
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
    const tagName = element.type as string;
    const props = element.props as (Record<string, unknown> & { children?: Children }) | undefined;

    const domEl = createElement(tagName);

    if (props) {
      // Use DOMUtils to apply props (handles refs, events, attributes)
      applyPropsToElement(domEl, props as Record<string, unknown>);

      // Handle children
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
    // Use any casting to bypass TypeScript inference issues
    const classElement = element as any;
    const ComponentClass = classElement.type as new (props: any) => AtomComponent<any, any>;
    const instance = new ComponentClass(classElement.props || {});

    // Execute beforeMount lifecycle using the dedicated module
    executeBeforeMount(instance as BeforeMountCapableComponent);

    // First render AFTER beforeMount()
    const result = instance.render();
    const domNode = createDOMNode(result);

    // Execute didMount lifecycle
    executeDidMount(instance as DidMountCapableComponent);

    // Attach component instance to DOM node for afterMount processing
    // This will be used by render.ts to call afterMount() after DOM insertion
    attachComponentToNode(domNode, instance as AfterMountCapableComponent);

    return domNode;
  }

  // fallback for unknown objects
  return createTextNode('');
}

export { createDOMNode };
