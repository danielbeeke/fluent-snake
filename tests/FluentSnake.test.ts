import { DOMParser, Element } from 'https://deno.land/x/deno_dom/deno-dom-wasm.ts'
import { assertEquals } from 'https://deno.land/std@0.100.0/testing/asserts.ts'
import { FluentSnake } from '../FluentSnake.ts'
import { FluentApi, PreviousCall } from '../types.ts'

type apiResponse = FluentApi<typeof settings>

const settings = {

  fetch: async function (url: string) {
    const response = await fetch(url)
    return await response.text()  
  },

  querySelector: async function (text: string, source: string) {
    const document = await new DOMParser().parseFromString(source, 'text/html')
    if (!document) return  
    return document.querySelector(text)
  },

  querySelectorAll: async function (text: string, source: string) {
    const document = await new DOMParser().parseFromString(source, 'text/html')
    if (!document) return  
    return document.querySelectorAll(text)
  },

  href: async function (element: Element, previousResults: Array<PreviousCall>) {
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

  text: async function (element: Element) {
    return await element.textContent
  },

}

const api = FluentSnake(settings) as apiResponse

Deno.test('Using FluentSnake on WikiPedia', async () => {
  const response = await api
  .fetch('https://en.wikipedia.org/wiki/Linux')
  .querySelector('.infobox tr:nth-child(4) td a')
  .href()
  .fetch()
  .querySelector('#firstHeading')
  .text()
  
  assertEquals(response, 'Unix-like')
});

Deno.test('Using FluentSnake in with arrays on WikiPedia', async () => {
  const responses = await api
  .fetch('https://en.wikipedia.org/wiki/Linux')
  .querySelectorAll('.infobox tr:nth-child(3) td a')
  .map((item: apiResponse) => item
    .href()
    .fetch()
    .querySelector('#firstHeading')
    .text()
  )

  assertEquals(responses, ["C (programming language)", "Assembly language"])
});