// Custom Modules
import { createElement } from '../core/createElement';
import { collectChildren } from '../utils/functions/collectChildren';
import VNode from '../utils/interfaces/VNode';
import { Children } from '../utils/types/Children';
import { ElementType } from '../utils/types/ElementType';
import { Key } from '../utils/types/Key';
import { Props } from '../utils/types/Props';
import { Source } from '../utils/types/Source';
export { Fragment } from './jsx-runtime';

export function jsxDEV<P = Props>(
  type: ElementType<P>,
  props?: P & Props,
  key?: Key,
  _isStaticChildren?: boolean,
  source?: Source,
  self?: unknown
): VNode<P> {
  const src = (props ?? {}) as Props;
  const children = (src as { children?: Children }).children;

  const baseWithDev = {
    ...src,
    ...(key === undefined ? {} : { key }),
    __source: source,
    __self: self
  } as unknown as P & Props;

  if (children === undefined) {
    return createElement<P>(type, baseWithDev);
  }

  // Remove children from props to avoid passing it twice
  const { children: _dropChildren, ...withoutChildren } =
    baseWithDev as unknown as Props & { children?: Children };
  void _dropChildren;

  const flat = collectChildren(children);

  return createElement<P>(
    type,
    withoutChildren as unknown as P & Props,
    ...flat
  );
}
