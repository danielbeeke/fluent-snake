import { FluentSnake } from '../FluentSnake.ts'

/**
 * These are types that are used with https://jsonplaceholder.typicode.com
 * This just shows how to use FluentSnake.
 */
type todo = {
  id: number
  userId: number
  title: string
  completed: boolean
}

type user = {
  id: number
  phone: string
  name: string
  username: string
  email: string
  address: {
    street: string,
    suite: string,
    city: string,
    zipcode: string,
    geo: { lat: string, lng: string }
  }
}

/**
 * A developer should make sure their given methods to FluentSnake have return types that are not promises although they should be in a JavaScript sense.
 * There is no simple way to let typescript understand a chain of promises as FluentSnake.
 * 
 * These types simplify the process of returning correct types.
 */
export type apiSingleResponse<T> = typeof settings & T
export type apiArrayResponse<T> = typeof settings & Array<typeof settings & T>

function todos (user: user | undefined = undefined) {
  return window.fetch(`https://jsonplaceholder.typicode.com/todos${user !== undefined ? `?userId=${user.id}` : ''}`)
  .then(response => response.json()) as unknown as apiArrayResponse<todo>
}

function users (id: number): apiSingleResponse<user>
function users (id?: undefined): apiArrayResponse<user>
function users (id: number | undefined = undefined) {
  return window.fetch(`https://jsonplaceholder.typicode.com/users${id !== undefined ? `?id=${id}` : ''}`)
  .then(response => response.json())
  .then(results => id !== undefined ? results[0] : results) as unknown
}

function trail (...args: Array<unknown>) {
  return args[1]
}

const settings = { users, todos, trail }
export const api = <typeof settings>FluentSnake(settings)