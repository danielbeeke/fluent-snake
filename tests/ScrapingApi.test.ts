import { assertEquals } from "https://deno.land/std@0.101.0/testing/asserts.ts";
import { api } from './ScrapingApi.ts'

Deno.test('Using FluentSnake with scraping API on Wikipedia', async () => {
  const response = await api
  .fetch('https://en.wikipedia.org/wiki/Linux')
  .querySelector('.infobox tr:nth-child(4) td a')
  .href()
  .fetch()
  .querySelector('#firstHeading')
  .text()
  
  assertEquals(response, 'Unix-like')
});

Deno.test('Using FluentSnake with arrays scraping API on Wikipedia', async () => {
  const responses = await api
  .fetch('https://en.wikipedia.org/wiki/Linux')
  .querySelectorAll('.infobox tr:nth-child(3) td a')
  .map((item: any) => item
    .href()
    .fetch()
    .querySelector('#firstHeading')
    .text()
  )

  assertEquals(responses, ['C (programming language)', 'Assembly language'])
});