// Custom Modules
import VNode from '../interfaces/VNode';
import { PrimitiveChild } from './PrimitiveChild';

export type Child = VNode<any> | PrimitiveChild | boolean | null | undefined;
