import { FluentSnake, apiSingleResponse as apiSingleResponseBase, apiArrayResponse as apiArrayResponseBase } from '../FluentSnake.ts'

type apiSingleResponse<T = unknown> = apiSingleResponseBase<typeof settings.methods & typeof settings.getters, T>
type apiArrayResponse<T = unknown> = apiArrayResponseBase<typeof settings.methods & typeof settings.getters, T>

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

function todos (user: user | undefined = undefined) {
  return globalThis.fetch(`https://jsonplaceholder.typicode.com/todos${user !== undefined ? `?userId=${user.id}` : ''}`)
  .then(response => response.json()) as unknown as apiArrayResponse<todo>
}

function users (id: number): apiSingleResponse<user>
function users (id?: never): apiArrayResponse<user>
function users (id: number | undefined = undefined) {
  return globalThis.fetch(`https://jsonplaceholder.typicode.com/users${id !== undefined ? `?id=${id}` : ''}`)
  .then(response => response.json())
  .then(results => id !== undefined ? results[0] : results) as unknown
}

function trail (...args: Array<unknown>) {
  return args[1]
}

const settings = { 
  methods: { users, todos, trail },
  getters: {},
}

export const api = <apiSingleResponse>FluentSnake(settings)
