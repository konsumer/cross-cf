import { graphql } from 'graphql/index.js'
import { makeExecutableSchema } from '@graphql-tools/schema'

import typeDefs from './typeDefs.gql'

// KV-based resolvers for pokemon graphql API
export const resolvers = {
  Query: {
    async pokemons (_, args, { env: { MYDB } }, info) {
      const { keys } = await MYDB.list()

      // check if they want more than just names, if not, return faster
      // https://www.prisma.io/blog/graphql-server-basics-demystifying-the-info-argument-in-graphql-resolvers-6f26249f613a
      const fields = info.fieldNodes.map(f => f.selectionSet.selections.map(s => s.name.value)).reduce((a, c) => [...a, ...c], [])
      if (fields.length === 1 && fields[0] === 'name') {
        return keys.map(({ name }) => ({ name }))
      }

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
