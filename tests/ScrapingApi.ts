import { DOMParser, Element, Node } from 'https://deno.land/x/deno_dom@v0.1.3-alpha2/deno-dom-wasm.ts'
import { FluentSnake, apiSingleResponse as apiSingleResponseBase, apiArrayResponse as apiArrayResponseBase, PreviousCall } from '../FluentSnake.ts'


type apiSingleResponse<T = unknown> = apiSingleResponseBase<typeof settings.methods & typeof settings.getters, T, typeof settings.state>
type apiArrayResponse<T = unknown> = apiArrayResponseBase<typeof settings.methods & typeof settings.getters, T, typeof settings.state>


export const fetch = function (url = '') {
  return globalThis.fetch(url).then(response => response.text()) as unknown as apiSingleResponse<string>
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
  state: {},
  methods: { fetch, querySelector, querySelectorAll, href, text },
  getters: {},
  pluckables: []
}

export const api = <apiSingleResponse>FluentSnake(settings)
