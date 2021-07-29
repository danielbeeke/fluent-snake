import { DOMParser, Element, Node } from 'https://deno.land/x/deno_dom@v0.1.3-alpha2/deno-dom-wasm.ts'
import { FluentSnake, apiSingleResponse as apiSingleResponseBase, apiArrayResponse as apiArrayResponseBase, PreviousCall } from '../FluentSnake.ts'

type apiSingleResponse<T = unknown> = apiSingleResponseBase<typeof settings.methods, T>
type apiArrayResponse<T = unknown> = apiArrayResponseBase<typeof settings.methods, T>


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

const settings = {
  methods: { fetch, querySelector, querySelectorAll, href, text },
  pluckables: []
}

export const api = <apiSingleResponse>FluentSnake(settings)