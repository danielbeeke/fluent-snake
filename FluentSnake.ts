export type PreviousCall = [string, Array<unknown>, unknown]

/**
 * A developer should make sure their given methods to FluentSnake have return types that are not promises although they should be in a JavaScript sense.
 * There is no simple way to let typescript understand a chain of promises as FluentSnake.
 * 
 * These types simplify the process of returning correct types.
 */
type base<S> = {
}

export type apiSingleResponse<M = unknown, T = unknown, S = unknown> = M & T & base<S>
export type apiArrayResponse<M = unknown, T = unknown, S = unknown> = M & Array<M & T> & base<S>

const defaultSettings = {
  methods: {}, 
  getters: {},
}

export const FluentSnake = (settings: {
  methods?: { [key: string]: Function }, 
  getters?: { [key: string]: any }, 
} = {
  methods: {}, 
  getters: {}, 
}, data: Promise<unknown> = Promise.resolve() as any, previousResults: Array<PreviousCall> = [], ignoreOneAwait = false, parentIsProperty = false): any => {
  const { methods, getters } = Object.assign(defaultSettings, settings)
  const recurse = (data: any, ignoreOneAwait = false, parentIsProperty = false) => FluentSnake(settings, data, [...previousResults], ignoreOneAwait, parentIsProperty)

  /**
   * Data may be objects but also primitives. Proxy does not work on primitives.
   * We need promises to chain all the parts together so you are able to use only one await.
   * For these two reasons we wrap the data with a promise.
   */
  const isPromise = typeof data === 'object' && 'then' in data && typeof data?.then === 'function'
  const promisyfiedData = new Promise(resolve => resolve(data))

  const proxy: any = new Proxy(isPromise ? data : promisyfiedData as Promise<{[key: string]: unknown}>, {
    get: function(target: Promise<{[key: string]: unknown}>, prop: string | symbol) {
      /**
       * Using await calls 'then()' until a false is returned.
       * If we want to return Proxy objects that have a then method we need a mechanism that will protect the promise from bein unwrapped when returning the proxy.
       * For that reason we have this 'ignoreOneAwait'.
       */
      if (prop === 'then') return ignoreOneAwait ? null : (resolve: (thing: unknown) => unknown) => resolve(target)

      /**
       * Allows for the usage of Array methods.
       * The method are used a bit different, they are all async. You might want to fetch something.
       * For that reason: const user9 = api.users().find(async user => await user.id === 9)
       */
      if (prop in Array.prototype && !(prop in methods)) {
        const boundMethod = (...args: Array<unknown>) => target.then((resolved: unknown) => {
          const cleanedArgs = [...args.filter(item => item), resolved, previousResults] as [callback: (item: Promise<unknown>) => unknown, elements: unknown[]]

          const targetProperty = async function (callback: (item: Promise<unknown>) => unknown, elements: Array<unknown>) {
            const mappedResults = await Promise.all(elements.map(async item => await callback(recurse(item))))
            const propIndex = (prop.toString() as unknown as number)
            return elements.map((item => recurse(item, true)))[propIndex]((_item: unknown, index: number) => mappedResults[index])
          }

          const appliedMethod = targetProperty.apply(target, cleanedArgs)

          return appliedMethod.then((currentResolved: unknown) => {
            previousResults.push([prop.toString(), args.filter(item => item), currentResolved])
            return currentResolved
          })
        })

        return (args: Array<unknown>) => FluentSnake(settings, boundMethod(args), previousResults)
      }

      /**
       * Allow for given methods to be executed.
       * See options.methods
       */
      if (prop in methods) {
        const boundMethod = (...args: Array<unknown>) => target.then((resolved: unknown) => {
          const cleanedArgs = [...args.filter(item => item), resolved, previousResults]
          const targetProperty = methods[prop.toString()]
          const appliedMethod = typeof targetProperty === 'function' ? targetProperty.apply(target, cleanedArgs) : targetProperty

          return appliedMethod.then ? appliedMethod.then((currentResolved: unknown) => {
            previousResults.push([prop.toString(), args.filter(item => item), currentResolved])
            return currentResolved
          }) : appliedMethod
        })

        return (args: Array<unknown>) => FluentSnake(settings, boundMethod(args), previousResults)
      }

      /**
       * This makes it possible to show up as FluentSnake in the CLI.
       */
      if (prop === 'name') return 'FluentSnake'

      /**
       * Deeper proxy function.. do a pluck on an array
       */
      if (parentIsProperty) {
        return recurse(target.then((resolved) => {
          if (Array.isArray(resolved)) return recurse(resolved.find(item => item.includes(prop)))
        }))
      }

      /**
       * If the prop is inside the getters.
       */
      if (prop.toString() in getters) {
        const getterDefinition = Object.getOwnPropertyDescriptor(getters, prop.toString())

        if (getterDefinition?.get) {
          return getterDefinition.get.apply(settings)
        }
      }

      /**
       * If the prop was not found here it may be a dynamicly loaded property
       */
      const boundProperty = target.then((resolved) => recurse(resolved[prop.toString()]))
      return recurse(boundProperty)
    }
  })
  
  return proxy as unknown
}