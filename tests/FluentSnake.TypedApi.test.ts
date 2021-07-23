import { assertEquals } from "https://deno.land/std@0.101.0/testing/asserts.ts";
import { FluentSnake } from '../FluentSnake.ts'

interface todo {
  id: number
  userId: number
  title: string
  completed: boolean
}

interface user {
  id: number
  phone: string
  name: string
  username: string
  email: string
  address: {
    street: string
  }
}

function todos (user: user | undefined = undefined) {
  return window.fetch(`https://jsonplaceholder.typicode.com/todos${user !== undefined ? `?userId=${user.id}` : ''}`)
  .then(response => response.json()) as unknown as Array<todo> 
}

function users (id: number): user
function users (id?: undefined): Array<user>
function users (id: number | undefined = undefined) {
  return window.fetch(`https://jsonplaceholder.typicode.com/users${id !== undefined ? `?id=${id}` : ''}`)
  .then(response => response.json())
  .then(results => id !== undefined ? results[0] : results) as unknown
}

const settings = { users, todos }

const api = <typeof settings>FluentSnake(settings)

Deno.test('Fetch users, find one', async () => {
  /** @ts-ignore */
  const streets = await api.users().map(async user => await user.phone)

  console.log(streets)
})

// Deno.test('Fetch users, get all streets', async () => {
//   const streets = await api.users().map(async user => {
//     return await user.address.street
//   })

//   assertEquals(streets, [
//     "Kulas Light",
//     "Victor Plains",
//     "Douglas Extension",
//     "Hoeger Mall",
//     "Skiles Walks",
//     "Norberto Crossing",
//     "Rex Trail",
//     "Ellsworth Summit",
//     "Dayna Park",
//     "Kattie Turnpike",
//   ])
// })

// Deno.test('Fetch users, get all streets', async () => {
//   const filteredUsers = await api.users()
//   .filter(async user => {
//     return [3, 4].includes(await user.id)
//   })

//   const streets = await Promise.all(filteredUsers.map(async user => await user.address.street))

//   assertEquals(streets, [
//     "Douglas Extension",
//     "Hoeger Mall",
//   ])
// })

// // Deno.test('Fetch users, find one, get todos', async () => {
// //   const todos = await api.users(9)
// //   console.log(todos)

// //   // assertEquals(todos?.length, 20)
// // })
