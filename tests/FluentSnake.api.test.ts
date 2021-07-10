import { assertEquals } from 'https://deno.land/std@0.100.0/testing/asserts.ts'
import { FluentSnake } from '../FluentSnake.ts'
import { FluentApi } from '../types.ts'
import * as settings from '../scales/api.ts'

type user = {
  phone: string
  name: string
  username: string
  email: string
  address: {
    street: string
  }
}

type apiResponse = FluentApi<typeof settings & user>

const api = FluentSnake(settings) as apiResponse

Deno.test('Using FluentSnake with api that returns a phone number', async () => {
  const phone = await api
  .fetch('https://jsonplaceholder.typicode.com/users')
  .find(async (user: { id: number }) => await user.id === 9)
  .phone
  
  assertEquals(phone, '1-770-736-8031 x56442')
});

Deno.test('Using FluentSnake with api that returns a nested value', async () => {
  const street = await api
  .fetch('https://jsonplaceholder.typicode.com/users')
  .find(async (user: { id: number }) => await user.id === 9)
  /** @ts-ignore */ // How to let typescript know about this nested value?
  .address.street
  
  assertEquals(street, 'Kulas Light')
});