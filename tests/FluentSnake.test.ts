import { DOMParser, Element } from 'https://deno.land/x/deno_dom/deno-dom-wasm.ts'
import { assertEquals } from 'https://deno.land/std@0.100.0/testing/asserts.ts'
import { FluentSnake } from '../FluentSnake.ts'
import { FluentApi } from '../types.ts'

const settings = {

  fetch: async function (url: string, previousResults: Array<[string, Array<unknown>, unknown]>) {
    const response = await fetch(url)
    return await response.text()
  },

  querySelector: async function (text: string, source: string, previousResults: Array<[string, Array<unknown>, unknown]>) {
    const document = await new DOMParser().parseFromString(source, 'text/html')
    if (!document) return
    return document.querySelector(text)
  },

  href: async function (element: Element, previousResults: Array<[string, Array<unknown>, unknown]>) {
    let baseUrl = null

    for (const previousResult of await previousResults.reverse()) {
      const [method, args]: [method: string, args: Array<unknown>, result: unknown] = previousResult
      if (method === 'fetch') {
        baseUrl = new URL(args[0] as string)
        break;
      }
    }

    return (baseUrl?.origin ?? '') + element.getAttribute('href')
  },

  text: async function (element: Element, previousResults: Array<[string, Array<unknown>, unknown]>) {
    return await element.textContent
  }
}

const api = FluentSnake(settings) as FluentApi<typeof settings>

const response = await api
.fetch('https://en.wikipedia.org/wiki/Linux')
.querySelector('.infobox tr:nth-child(4) td a')
.href()
.fetch()
.querySelector('#firstHeading')
.text()

Deno.test('Using FluentSnake on WikiPedia', () => {
  assertEquals(response, 'Unix-like')
});