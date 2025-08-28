import { VNode } from '../interfaces/VNode';

declare global {
  namespace JSX {
    // What a JSX expression evaluates to:
    type Element = VNode<any>;

    // Which prop name carries children:
    interface ElementChildrenAttribute {
      children: object;
    }

    // Start permissive (tighten later with real attributes)
    interface IntrinsicElements {
      [elemName: string]: Record<string, unknown>;
    }
  }
}
export {};
