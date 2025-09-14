// Custom Modules
import { Children } from '../types/Children';
import { ElementType } from '../types/ElementType';
import { Key } from '../types/Key';

export default interface VNode<P = any> {
  readonly type: ElementType<P>;
  readonly props: P & { key?: Key; children?: Children };
}
