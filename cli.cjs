#!/usr/bin/env node

global.fetch = require('cross-fetch')
const { CrossKV } = require('.')

const [, progname, name, from, to] = process.argv
if (!name || !from || !to) {
  console.error(`Usage: ${progname} NAME FROM:LOCATION TO:LOCATION`)
  console.error('')
  console.error('\tWhere targets look like "local:dir" or "remote:kvID"')
  console.error('')
  console.error('\tExamples:')
  console.error(`\t\t${progname} MYDB 'local:.mf/kv' 'remote:XXX'   # copy local miniflare KV "MYDB" to remote kvID XXX`)
  process.exit(1)
}

const [fromTarget, fromPath] = from.split(':')
const [toTarget, toPath] = to.split(':')

const db = {
  local: toTarget === 'local' ? new CrossKV(name, { filepath: toPath }) : new CrossKV(name, { target: 'remote', kvID: toPath }),
  remote: fromTarget === 'local' ? new CrossKV(name, { filepath: fromPath }) : new CrossKV(name, { target: 'remote', kvID: fromPath })
}

async function main () {
  const { keys } = await db.remote.list()
  const records = await Promise.all(keys.map(async ({ name }) => {
    const value = await db.remote.get(name)
    return { key: name, value }
  }))
  await db.local.bulkput(records)
}
main()
