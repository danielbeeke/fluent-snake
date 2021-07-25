import { DOMParser, Element, Node } from 'https://deno.land/x/deno_dom@v0.1.3-alpha2/deno-dom-wasm.ts'
import { FluentSnake, PreviousCall } from '../FluentSnake.ts'

/**
 * A developer should make sure their given methods to FluentSnake have return types that are not promises although they should be in a JavaScript sense.
 * There is no simple way to let typescript understand a chain of promises as FluentSnake.
 * 
 * These types simplify the process of returning correct types.
 */
export type apiSingleResponse<T> = typeof settings & T
export type apiArrayResponse<T> = typeof settings & Array<typeof settings & T>

const originalFetch = window.fetch
export const fetch = function (url = '') {
  return originalFetch(url).then(response => response.text()) as unknown as apiSingleResponse<string>
}

export const querySelector = function (text: string, source = '') {
  const document = new DOMParser().parseFromString(source, 'text/html')
  if (!document) throw new Error('Could not read the document')
  return (document.querySelector(text) ?? '') as unknown as apiSingleResponse<Element>
}

export const querySelectorAll = function (text: string, source = '') {
  const document = new DOMParser().parseFromString(source, 'text/html')
  if (!document) throw new Error('Could not read the document')
  const nodes = [...document.querySelectorAll(text)].map(node => (node as unknown as apiArrayResponse<Node>))
  return nodes ?? [] as unknown as apiArrayResponse<Node>
}

export const href = function (element: Element = new Element('', null, []), previousResults: Array<PreviousCall> = []) {
  let baseUrl = null

  for (const previousResult of previousResults.reverse()) {
    const [method, args]: [method: string, args: Array<unknown>, result: unknown] = previousResult
    if (method === 'fetch') {
      baseUrl = new URL(args[0] as string)
      break;
    }
  }

  return (baseUrl?.origin ?? '') + element.getAttribute('href') as unknown as apiSingleResponse<string>
}

export const text = function (element: Element = new Element('', null, [])) {
  return element.textContent as unknown as apiSingleResponse<string>
}

const settings = { fetch, querySelector, querySelectorAll, href, text }
export const api = <typeof settings>FluentSnake(settings)