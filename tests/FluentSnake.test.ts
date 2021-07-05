import { DOMParser, Element } from 'https://deno.land/x/deno_dom/deno-dom-wasm.ts'
import { assertEquals } from 'https://deno.land/std@0.100.0/testing/asserts.ts'
import { FluentSnake } from '../FluentSnake.ts'
import { FluentApi } from '../types.ts'

const settings = {

  fetch: async function (url: string, previousResult: Array<[string, Array<unknown>, unknown]>) {
    const response = await fetch(url)
    return await response.text()
  },

  querySelector: async function (text: string, source: string, previousResult: Array<[string, Array<unknown>, unknown]>) {
    const document = await new DOMParser().parseFromString(source, 'text/html')
    if (!document) return
    return document.querySelector(text)
  },

  href: async function (element: Element, previousResult: Array<[string, Array<unknown>, unknown]>) {
    let baseUrl = null
    let index = await previousResult.length - 1

    while (!baseUrl && index > -1) {
      index--
      const currentItem = previousResult[index]
      if (currentItem[0] === 'fetch') {
        const url = currentItem[1][0] as string
        baseUrl = new URL(url)
      }
    }

    return (baseUrl?.origin ?? '') + element.getAttribute('href')
  },

  text: async function (element: Element, previousResult: Array<[string, Array<unknown>, unknown]>) {
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

console.log(response)

Deno.test('Using FluentSnake on WikiPedia', () => {
  assertEquals(response, 'Unix-like')
});