// Custom Modules
import { Children } from './Children';
import { Key } from './Key';

export type Props = Record<string, unknown> & {
  key?: Key;
  children?: Children;
};
