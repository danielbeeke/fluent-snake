import { FluentApi, PreviousCall } from './types.ts'

export const FluentSnake = (settings: Record<string, Function>, data: Promise<unknown> | any = Promise.resolve(), previousResults: Array<PreviousCall> = []): FluentApi<typeof settings> => {

  const isPromise = typeof data === 'object' && typeof data?.then === 'function'
  const promisyfiedData = new Promise(resolve => resolve(data))
  const targetWrap = isPromise ? () => data : () => promisyfiedData

  return (new Proxy(targetWrap, {
    get: function(_target, prop) {
      const target = targetWrap()

      if (prop === 'then') return (resolve: (thing: Promise<unknown>) => unknown) => resolve(target)

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
              return await Promise.all([...elements][prop.toString()]((item: unknown) => callback(FluentSnake(settings, item, [...previousResults]))))
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
    }
  }) as unknown) as FluentApi<typeof settings>
}