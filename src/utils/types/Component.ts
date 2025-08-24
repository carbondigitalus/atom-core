// Custom Modules
import { VNode } from '../interfaces/VNode';
import { Children } from './Children';

export type Component<P = object> = (
  props: P & { children?: Children }
) => VNode<any> | null;
