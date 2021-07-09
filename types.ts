export type FluentApi<Type> = {
  [Property in keyof Type | 'map' | 'find' | 'filter']: (...args: Array<unknown>) => FluentApi<Type>
}

export type PreviousCall = [string, Array<unknown>, unknown]