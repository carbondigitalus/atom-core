// Custom Modules
import { createElement } from '../core/createElement';
import { VNode } from '../utils/interfaces/VNode';
import { Child } from '../utils/types/Child';
import { Children } from '../utils/types/Children';
import { ElementType } from '../utils/types/ElementType';
import { Key } from '../utils/types/Key';
import { Props } from '../utils/types/Props';

export const Fragment = (p: { children?: Children }): Children | null =>
  p.children ?? null;

export function jsx<P = Props>(
  type: ElementType<P>,
  props?: P & Props,
  key?: Key
): VNode<P> {
  const src = (props ?? {}) as Props;
  const children = (src as { children?: Children }).children;

  // Build props without `children`
  const rest = Object.fromEntries(
    Object.entries(src).filter(([k]) => k !== 'children')
  ) as P & Props;

  const nextProps = key === undefined ? rest : ({ ...rest, key } as P & Props);

  if (children === undefined) {
    return createElement<P>(type, nextProps);
  }
  return Array.isArray(children)
    ? createElement<P>(type, nextProps, ...children)
    : createElement<P>(type, nextProps, children);
}

// Helper: flatten children and remove falsey renderables (false|null|undefined)
function collectChildren(
  input: Children
): Array<Exclude<Child, false | null | undefined | Child[]>> {
  const out: Array<Exclude<Child, false | null | undefined | Child[]>> = [];

  const enqueue = (c: Children): void => {
    if (c == null || c === false) return;
    if (Array.isArray(c)) {
      for (const x of c) enqueue(x);
      return;
    }
    out.push(c as Exclude<Child, false | null | undefined | Child[]>);
  };

  enqueue(input);
  return out;
}

export function jsxs<P = Props>(
  type: ElementType<P>,
  props?: P & Props,
  key?: Key
): VNode<P> {
  const src = (props ?? {}) as Props;
  const children = (src as { children?: Children }).children;

  // Build props without `children`
  const rest = Object.fromEntries(
    Object.entries(src).filter(([k]) => k !== 'children')
  ) as P & Props;

  const nextProps = key === undefined ? rest : ({ ...rest, key } as P & Props);

  if (children === undefined) {
    return createElement<P>(type, nextProps);
  }

  const flat = collectChildren(children);
  return createElement<P>(type, nextProps, ...flat);
}
