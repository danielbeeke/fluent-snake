export type FluentApi<Type> = {
  [Property in keyof Type | 'map']: (...args: Array<unknown>) => FluentApi<Type>
}

export type PreviousCall = [string, Array<unknown>, unknown]