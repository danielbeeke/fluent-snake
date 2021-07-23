import { PreviousCall } from './types.ts'

export interface FluentSnakeInterface<T,S> extends Promise<T>, Array<T> {}

export const FluentSnake = <Settings extends { [key: string]: Function }, Data>
  (settings: Settings, data: Promise<Data> = Promise.resolve() as 
unknown as FluentSnakeInterface<Data,Settings>, previousResults: Array<PreviousCall> = [], ignoreOneAwait = false): any => {

  const isPromise = typeof data === 'object' && 'then' in data && typeof data?.then === 'function'
  const promisyfiedData = new Promise(resolve => resolve(data))
  const targetWrap = (isPromise ? () => data : () => promisyfiedData) as () => Promise<{[key: string]: unknown}>

  return new Proxy(targetWrap, {
    get: function(_target: {}, prop: string | symbol) {
      const target = targetWrap()

      if (prop === 'then') return ignoreOneAwait ? null : (resolve: (thing: unknown) => unknown) => resolve(target)

      if (prop in settings || prop in Array.prototype) {
        const boundMethod = (...args: Array<unknown>) => targetWrap().then((resolved: unknown) => {
          const cleanedArgs = [...args.filter(item => item), resolved, previousResults]


          let method

          /**
           * Allows for the usage of Array methods.
           */
          if (prop in Array.prototype && !(prop in settings)) {
            method = async function (callback: (item: unknown) => unknown, elements: Array<unknown>, previousResults: Array<PreviousCall>) {

              /** @ts-ignore */
              const mappedResults = await Promise.all(elements.map(async item => await callback(FluentSnake(settings, item, [...previousResults]))))

              /** @ts-ignore */
              return elements.map((item => FluentSnake(settings, item, [...previousResults], true)))[prop.toString()]((_item, index) => mappedResults[index])
            }
          }

          /**
           * Methods that the developer gave.
           */
          else {
            method = settings[prop.toString()]
          }

          return method.apply(target, cleanedArgs).then((currentResolved: unknown) => {
            previousResults.push([prop.toString(), args.filter(item => item), currentResolved])
            return currentResolved
          })
        })

        return (args: Array<unknown>) => FluentSnake(settings, boundMethod(args), previousResults)
      }

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