// Custom Modules
import { Component } from './Component';

export type ElementType<P = any> = string | (new (props: P) => Component<P>);
