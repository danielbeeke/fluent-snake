export type PreviousCall = [string, Array<unknown>, unknown]

export const FluentSnake = <Settings extends { [key: string]: Function }, Data>
  (settings: Settings, data: Promise<Data> = Promise.resolve() as any, previousResults: Array<PreviousCall> = [], ignoreOneAwait = false): any => {

  /**
   * Data may be ay given type. We need to wrap it as a Promise though.
   * We need these promises to chain all the parts together so you can use only one await.
   * However you can Proxy raw Promises, for that reason we wrap the Promise in a function. 
   */
  const isPromise = typeof data === 'object' && 'then' in data && typeof data?.then === 'function'
  const promisyfiedData = new Promise(resolve => resolve(data))
  const targetWrap = (isPromise ? () => data : () => promisyfiedData) as () => Promise<{[key: string]: unknown}>

  return new Proxy(targetWrap, {
    get: function(_target: {}, prop: string | symbol) {
      const target = targetWrap()

      /**
       * Using await calls then until a false is returned.
       * If we want to return Proxy objects that have a then method we need a mechanism that will protect the promise from bein unwrapped when returning the proxy.
       * For that reason we have this 'ignoreOneAwait'.
       */
      if (prop === 'then') return ignoreOneAwait ? null : (resolve: (thing: unknown) => unknown) => resolve(target)

      if (prop in settings || prop in Array.prototype) {
        const boundMethod = (...args: Array<unknown>) => targetWrap().then((resolved: unknown) => {
          const cleanedArgs = [...args.filter(item => item), resolved, previousResults]


          let method

          /**
           * Allows for the usage of Array methods.
           * The method are used a bit differnt, they are all async. You might want to fetch something.
           * For that reason: const user9 = api.users().find(async user => await user.id === 9)
           */
          if (prop in Array.prototype && !(prop in settings)) {
            method = async function (callback: (item: Promise<unknown>) => unknown, elements: Array<unknown>, previousResults: Array<PreviousCall>) {
              const mappedResults = await Promise.all(elements.map(async item => await callback(FluentSnake(settings, (item as Promise<unknown>), [...previousResults]))))
              return elements.map((item => FluentSnake(settings, (item as Promise<unknown>), [...previousResults], true)))[(prop.toString() as unknown as number)]((_item: unknown, index: number) => mappedResults[index])
            }
          }

          /**
           * Methods that the developer gave.
           */
          else {
            method = settings[prop.toString()]
          }

          const appliedMethod = method.apply(target, cleanedArgs)

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
       * If the prop was not given as a function it may be a property of the object
       */
      const boundMethod = () => targetWrap().then((resolved) => {
        if (resolved[prop.toString()]) return resolved[prop.toString()]
      })

      return FluentSnake(settings, boundMethod(), previousResults)
    }
  }) as unknown
}