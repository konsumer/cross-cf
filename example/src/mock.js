// this will fill the local database with pokemons
// it's run from `npm run mock`

import { CrossKV } from 'cross-cf'
import pokemons from './pokemons.json' assert { type: 'json' }
import crypto from 'crypto'

async function main () {
  const MYDB = new CrossKV('MYDB')
  await MYDB.bulkput(pokemons.map(value => {
    const record = {
      value: JSON.stringify(value),
      key: value.name
    }
    return record
  }))
}

main()
