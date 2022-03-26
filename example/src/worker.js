/* global Response */

export class PokemonDurableObject {}

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

    return new Response('<h1>Nothing to see here.</h1>', {
      headers: {
        'content-type': 'text/html'
      }
    })
  }
}
