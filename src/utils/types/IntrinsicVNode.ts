// Custom Modules
import { Children } from './Children';
import { VNode } from '../interfaces/VNode';

export type IntrinsicVNode = VNode & {
  type: string;
  props?: (Record<string, unknown> & { children?: Children }) | undefined;
};
