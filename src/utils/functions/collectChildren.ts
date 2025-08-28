// Custom Modules
import { Children } from '../types/Children';
import { Child } from '../types/Child';

export function collectChildren(
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
