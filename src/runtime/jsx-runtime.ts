// Custom Modules
import { createElement } from '../core/createElement';
import { collectChildren } from '../utils/functions/collectChildren';
import VNode from '../utils/interfaces/VNode';
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

  const rest = Object.fromEntries(
    Object.entries(src).filter(([k]) => k !== 'children')
  ) as P & Props;

  const nextProps = key === undefined ? rest : ({ ...rest, key } as P & Props);

  if (children === undefined) {
    return createElement<P>(type, nextProps);
  }

  // ✅ flatten children before spreading
  const flat = collectChildren(children);
  return createElement<P>(type, nextProps, ...flat);
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
