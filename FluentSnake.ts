export type PreviousCall = [string, Array<unknown>, unknown]

/**
 * A developer should make sure their given methods to FluentSnake have return types that are not promises although they should be in a JavaScript sense.
 * There is no simple way to let typescript understand a chain of promises as FluentSnake.
 * 
 * These types simplify the process of returning correct types.
 */
 export type apiSingleResponse<M, T> = M & T
 export type apiArrayResponse<M, T> = M & Array<M & T>
 export type apiPluckArray = Array<string> & {
   [key: string]: string
 }

export const FluentSnake = (settings: {
  methods: { [key: string]: Function }, 
  pluckables: Array<string>
}, data: Promise<unknown> = Promise.resolve() as any, previousResults: Array<PreviousCall> = [], ignoreOneAwait = false, parentIsProperty = false): any => {

    const { methods, pluckables } = settings

  /**
   * Data may be ay given type. We need to wrap it as a Promise though.
   * We need these promises to chain all the parts together so you can use only one await.
   * However you can't Proxy raw Promises, for that reason we wrap the Promise in a function. 
   */
  const isPromise = typeof data === 'object' && 'then' in data && typeof data?.then === 'function'
  const promisyfiedData = new Promise(resolve => resolve(data))
  const targetWrap = (isPromise ? () => data : () => promisyfiedData) as () => Promise<{[key: string]: unknown}>

  const recurse = (data: any, ignoreOneAwait = false, parentIsProperty = false) => FluentSnake(settings, data, [...previousResults], ignoreOneAwait, parentIsProperty)

  return new Proxy(targetWrap, {
    get: function(_target, prop: string | symbol) {
      const target = targetWrap()

      /**
       * Using await calls then until a false is returned.
       * If we want to return Proxy objects that have a then method we need a mechanism that will protect the promise from bein unwrapped when returning the proxy.
       * For that reason we have this 'ignoreOneAwait'.
       */
      if (prop === 'then') return ignoreOneAwait ? null : (resolve: (thing: unknown) => unknown) => resolve(target)

      if (prop in methods || prop in Array.prototype) {

        const boundMethod = (...args: Array<unknown>) => targetWrap().then((resolved: unknown) => {
          const cleanedArgs = [...args.filter(item => item), resolved, previousResults]

          let targetProperty

          /**
           * Allows for the usage of Array methods.
           * The method are used a bit differnt, they are all async. You might want to fetch something.
           * For that reason: const user9 = api.users().find(async user => await user.id === 9)
           */
          if (prop in Array.prototype && !(prop in methods)) {
            targetProperty = async function (callback: (item: Promise<unknown>) => unknown, elements: Array<unknown>) {
              const mappedResults = await Promise.all(elements.map(async item => await callback(recurse(item))))
              const propIndex = (prop.toString() as unknown as number)
              return elements.map((item => recurse(item, true)))[propIndex]((_item: unknown, index: number) => mappedResults[index])
            }
          }

          /**
           * Methods that the developer gave.
           */
          else {
            targetProperty = methods[prop.toString()]
          }

          const appliedMethod = typeof targetProperty === 'function' ? targetProperty.apply(target, cleanedArgs) : targetProperty

          return appliedMethod.then ? appliedMethod.then((currentResolved: unknown) => {
            previousResults.push([prop.toString(), args.filter(item => item), currentResolved])
            return currentResolved
          }) : appliedMethod
        })

        return (args: Array<unknown>) => FluentSnake(settings, boundMethod(args), previousResults)
      }

      /**
       * If it is a property we support we recurse into it and tell the next proxy to search for items inside arrays.
       */
      if (pluckables.includes(prop.toString())) {
        const boundProperty = targetWrap().then((resolved) => recurse(resolved[prop.toString()]))
        return recurse(boundProperty, false, true)
      }

      /**
       * This makes it possible to show up as FluentSnake in the CLI.
       */
      if (prop === 'name') return 'FluentSnake'

      if (parentIsProperty) {
        return recurse(targetWrap().then((resolved) => {
          if (Array.isArray(resolved)) return recurse(resolved.find(item => item.includes(prop)))
        }))
      }

      /**
       * If the prop was not found here it may be a dynamicly loaded property
       */
      const boundProperty = targetWrap().then((resolved) => recurse(resolved[prop.toString()]))
      return recurse(boundProperty)
    }
  }) as unknown
}