import { FluentSnake, apiSingleResponse as apiSingleResponseBase, apiArrayResponse as apiArrayResponseBase, apiPluckArray } from '../FluentSnake.ts'

type apiSingleResponse<T = unknown> = apiSingleResponseBase<typeof settings.methods & typeof settings.getters, T, typeof settings.state>
type apiArrayResponse<T = unknown> = apiArrayResponseBase<typeof settings.methods & typeof settings.getters, T, typeof settings.state>

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

function info () {
  return {
    logo: ['http://example.com/mobile-logo.png', 'http://example.com/desktop-logo.png'] as apiPluckArray
  }
}

const settings = { 
  pluckables: [ 'logo' ],
  getters: {
    get stale () {
      settings.state.allowStale = true
      return api       
    }
  }, 
  methods: { users, todos, trail, info },
  state: {
    allowStale: false
  }
}

export const api = <apiSingleResponse>FluentSnake(settings)
