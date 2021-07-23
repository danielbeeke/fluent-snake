export interface FluentApi {
  new <T, H extends (object)>(target: T, handler: ProxyHandler<H>): H
}

export type PreviousCall = [string, Array<unknown>, unknown]