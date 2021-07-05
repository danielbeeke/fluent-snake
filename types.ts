export type FluentApi<Type> = {
  [Property in keyof Type]: (...args: Array<unknown>) => FluentApi<Type>;
}