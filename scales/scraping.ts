import { DOMParser, Element } from 'https://deno.land/x/deno_dom/deno-dom-wasm.ts'
import { PreviousCall } from '../types.ts'

const originalFetch = window.fetch
export const fetch = async function (url: string): Promise<string> {
  const response = await originalFetch(url)
  return await response.text()  
}

export const querySelector = async function (text: string, source: string) {
  const document = await new DOMParser().parseFromString(source, 'text/html')
  if (!document) return  
  return document.querySelector(text)
}

export const querySelectorAll = async function (text: string, source: string) {
  const document = await new DOMParser().parseFromString(source, 'text/html')
  if (!document) return  
  return document.querySelectorAll(text)
}

export const href = async function (element: Element, previousResults: Array<PreviousCall>) {
  let baseUrl = null

  for (const previousResult of await previousResults.reverse()) {
    const [method, args]: [method: string, args: Array<unknown>, result: unknown] = previousResult
    if (method === 'fetch') {
      baseUrl = new URL(args[0] as string)
      break;
    }
  }

  return (baseUrl?.origin ?? '') + element.getAttribute('href')  
}

export const text = async function (element: Element) {
  return await element.textContent
}