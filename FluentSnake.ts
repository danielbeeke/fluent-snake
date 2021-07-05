import { FluentApi, PreviousCall } from './types.ts'

export const FluentSnake = (settings: Record<string, Function>, data: Promise<unknown> | any = Promise.resolve(), previousResults: Array<PreviousCall> = []): FluentApi<typeof settings> => {

  const isPromise = typeof data === 'object' && typeof data?.then === 'function'
  const promisyfiedData = new Promise(resolve => resolve(data))
  const targetWrap = isPromise ? () => data : () => promisyfiedData

  return (new Proxy(targetWrap, {
    get: function(_target, prop) {
      const target = targetWrap()

      if (prop === 'then') return (resolve: (thing: Promise<unknown>) => unknown) => resolve(target)

      if (prop in settings) {
        const boundMethod = (...args: Array<unknown>) => targetWrap().then((resolved: unknown) => {
          const cleanedArgs = [...args.filter(item => item), resolved, previousResults]
          return settings[prop.toString()].apply(target, cleanedArgs).then((currentResolved: unknown) => {
            previousResults.push([prop.toString(), args.filter(item => item), currentResolved])
            return currentResolved
          })
        })

        return (args: Array<unknown>) => FluentSnake(settings, boundMethod(args), previousResults)
      }
    }
  }) as unknown) as FluentApi<typeof settings>
}