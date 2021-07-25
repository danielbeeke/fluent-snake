import { assertEquals } from "https://deno.land/std@0.101.0/testing/asserts.ts";
import { api } from './TypedApi.ts'

Deno.test('Fetch users, get all streets', async () => {
  const streets = await api.users().map(async user => {
    return await user.address.street
  })

  assertEquals(streets, [
    "Kulas Light",
    "Victor Plains",
    "Douglas Extension",
    "Hoeger Mall",
    "Skiles Walks",
    "Norberto Crossing",
    "Rex Trail",
    "Ellsworth Summit",
    "Dayna Park",
    "Kattie Turnpike",
  ])
})

Deno.test('Fetch users, get all streets', async () => {
  const filteredUsers = await api.users()
  .filter(async user => [3, 4].includes(await user.id))

  const streets = await Promise.all(filteredUsers.map(async user => await user.address.street))

  assertEquals(streets, [
    "Douglas Extension",
    "Hoeger Mall",
  ])
})

Deno.test('Fetch users, find one, get todos', async () => {
  const todos = await api.users(9).todos()
  assertEquals(todos?.length, 20)
})
