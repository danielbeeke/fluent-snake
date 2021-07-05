import { FluentApi } from './types.ts'

export const FluentSnake = (settings: Record<string, Function>, data: Promise<unknown> = Promise.resolve(), previousResult: Array<[string, Array<unknown>, unknown]> = []): FluentApi<typeof settings> => {

  const isPromise = typeof data === 'object' && typeof data?.then === 'function'
  const promisyfiedData = new Promise(resolve => resolve(data))
  const targetWrap = isPromise ? () => data : () => promisyfiedData

  return (new Proxy(targetWrap, {
    get: function(_target, prop) {
      const target = targetWrap()

      if (prop === 'then') return (resolve: Function) => resolve(target)

      if (prop in settings) {
        const boundMethod = (...args: Array<unknown>) => targetWrap().then((resolved: unknown) => {
          const cleanedArgs = [...args.filter(item => item), resolved, previousResult]
          return settings[prop.toString()].apply(target, cleanedArgs).then((currentResolved: unknown) => {
            previousResult.push([prop.toString(), args.filter(item => item), currentResolved])
            return currentResolved
          })
        })

        return (args: Array<unknown>) => FluentSnake(settings, boundMethod(args), previousResult)
      }
    }
  }) as unknown) as FluentApi<typeof settings>
}