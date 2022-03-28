/* global Response */

import { getClient } from './schema.js'
import playground from './playground.html'

// let everyone request from this in a browser or whatever
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,HEAD,POST,OPTIONS',
  'Access-Control-Max-Age': '86400',
  'Access-Control-Allow-Headers': 'Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers'
}

export class PokemonDurableObject {
  constructor (state, env) {
    this.state = state
    this.env = env
    this.state.blockConcurrencyWhile(async () => {
      this.q = await getClient({ env, state })
    })
  }

  async fetch (request) {
    const { query, variables } = await request.json()
    const r = await this.q(query, variables)
    return new Response(JSON.stringify(r), {
      headers: {
        'content-type': 'application/json',
        ...corsHeaders
      }
    })
  }
}

export default {
  async fetch (request, env) {
    // only service application/json requests, like graphql
    if (request.headers.get('content-type') === 'application/json') {
      // get an instance of the DO for this region, and run the user's graphql query on it
      if (!env?.POKEMON) {
        console.error('DurableObject bindings have broken.')
      }
      const pokemon = env.MYDO.get(env.POKEMON.idFromName(request.cf.colo))
      return pokemon.fetch(request)
    }

    return new Response(playground, {
      headers: {
        'content-type': 'text/html',
        ...corsHeaders
      }
    })
  }
}
