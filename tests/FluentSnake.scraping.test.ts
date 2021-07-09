import { assertEquals } from 'https://deno.land/std@0.100.0/testing/asserts.ts'
import { FluentSnake } from '../FluentSnake.ts'
import { FluentApi } from '../types.ts'
import * as settings from '../scales/scraping.ts'

type apiResponse = FluentApi<typeof settings>

const api = FluentSnake(settings) as apiResponse

Deno.test('Using FluentSnake with scraping scale on Wikipedia', async () => {
  const response = await api
  .fetch('https://en.wikipedia.org/wiki/Linux')
  .querySelector('.infobox tr:nth-child(4) td a')
  .href()
  .fetch()
  .querySelector('#firstHeading')
  .text()
  
  assertEquals(response, 'Unix-like')
});

Deno.test('Using FluentSnake with arrays scraping scale on Wikipedia', async () => {
  const responses = await api
  .fetch('https://en.wikipedia.org/wiki/Linux')
  .querySelectorAll('.infobox tr:nth-child(3) td a')
  .map((item: apiResponse) => item
    .href()
    .fetch()
    .querySelector('#firstHeading')
    .text()
  )

  assertEquals(responses, ['C (programming language)', 'Assembly language'])
});