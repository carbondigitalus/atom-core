// Custom Modules
import { VNode } from '../utils/interfaces/VNode';
import { Child } from '../utils/types/Child';
import { Children } from '../utils/types/Children';
import { ElementType } from '../utils/types/ElementType';
import { Key } from '../utils/types/Key';
import { Props } from '../utils/types/Props';

function normalizeChildren(
  input: Children | undefined,
  rest: Child[]
): Children | undefined {
  // If JSX transform passed children via props, prefer that, otherwise use rest args.
  if (input !== undefined) return input;
  return rest.length === 0 ? undefined : rest;
}

export function createElement<P = Props>(
  type: ElementType<P>,
  rawProps: P | Props | null | undefined,
  ...spreadChildren: Child[]
): VNode<P> {
  const base = rawProps ?? {};
  const { key, children, ...rest } = base;

  const finalChildren = normalizeChildren(children, spreadChildren);

  // Build props explicitly to avoid "unsafe-assignment"
  const nextProps =
    finalChildren === undefined
      ? ({ ...rest, key } as P & { key?: Key })
      : ({ ...rest, key, children: finalChildren } as P & {
          key?: Key;
          children?: Children;
        });

  return { type, props: nextProps };
}
