import { graphql } from 'graphql/index.js'
import { makeExecutableSchema } from '@graphql-tools/schema'

import typeDefs from './typeDefs.gql'

// KV-based resolvers for pokemon graphql API
export const resolvers = {
  Query: {
    async pokemons (_, args, { env: { MYDB } }) {
      const { keys } = await MYDB.list()
      // TODO: check if they want more than name, if not skip this
      return Promise.all(keys.map(({ name }) => MYDB.get(name, { type: 'json' })))
    },
    pokemon (_, { name }, { env: { MYDB } }) {
      return MYDB.get(name, { type: 'json' })
    }
  }
}

// get the graphql schema for the store
export const getSchema = () => makeExecutableSchema({ resolvers, typeDefs })

// get an in-memory client for the graphql resolvers
export const getClient = async (context = {}) => {
  if (!getClient.schema) {
    getClient.schema = getSchema()
  }

  return (query, variables = {}) => graphql({
    schema: getClient.schema,
    source: query,
    contextValue: context,
    variableValues: variables
  })
}
