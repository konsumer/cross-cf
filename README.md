# cross-cf

> **WIP**: I am still working on this. It's not really usable right now.


Cross-environment Cloudflare [DO](https://developers.cloudflare.com/workers/runtime-apis/durable-objects/) and [KV](https://developers.cloudflare.com/workers/runtime-apis/kv) access.

I kept needing to inject things into my local (miniflare) or remote KV, or interact with my DO, in scripts or unit-tests that run in node. This lets you mess with them directly, and it keeps the same API in all environments.


## installation

```
npm i -D cross-cf
```

## usage

### KV

KV can be used remotely (if you have an API key and the ID of the KV) or locally (using miniflare filesystem, directly.)

#### basic setup

```js
import { CrossKV } from 'cross-cf'

const MYDB = new CrossKV('MYDB')

await MYDB.put('coolA', { cool: true }, { type: 'json' })
await MYDB.put('coolB', { cool: true }, { type: 'json' })
await MYDB.put('coolB', { cool: true }, { type: 'json' })

console.log(await MYDB.list())

```

#### local

This is the default `target`. It uses local miniflare perisitant file-system-based KV, so you can set things up for unit-tests, or mock-scripts, or whatever. You could also just use it as a general purpose, local JSON-based KV.

You can also set the path where your database is:

```js
const MYDB = new CrossKV('MYDB', {filepath: './some/other/place/where/I/keep/my/db'})
```

#### remote

This lets you use a KV id and API creds to interact with a remote KV.

Set these environment variables to get auth working automatically:

```sh
CF_EMAIL      # your cloudflare email
CF_TOKEN      # your auth-token
CF_ACCOUNTID  # your worker's accountID
```

```js
const MYDB = new CrossKV('MYDB', { target: 'remote', kvId: 'XXX' })
```

You can also setup auth, directly:

```js
const MYDB = new CrossKV('MYDB', {
  target: 'remote',
  accountEmail: 'konsumer@jetboystudio.com',
  kvID: 'XXX',
  accountToken: 'XXX',
  accountID: 'XXX'
})
```

#### cf

This `target` means that you want to use KV from actual cloudflare (or inside miniflare.) I'm not totally sure what the usecase is, but this will let you keep your code more similar in different environments, which is the overall goal of this library.

```js
// this will use the global KV MYDB
const MYDB = new CrossKV('MYDB', { target: 'cf' })

// this will use MYDB in env from esm worker request-handler
const MYDB2 = new CrossKV('MYDB', { target: 'cf', env})
```


#### examples

Here is an example migration script. I'm not paging in this example, so this will be limited to 1000 records, but you can page records too, if you want.


```js
import { CrossKV } from 'cross-cf'
// or const { CrossKV } = require('cross-cf')

// I also setup CF_EMAIL, CF_TOKEN, CF_ACCOUNTID for auth creds
const { CF_MYDB_ID } = process.env

const db = {
  local: new CrossKV('MYDB'),
  remote: new CrossKV('MYDB', { kvID: CF_MYDB_ID, target: 'remote' })
}

async function main() {
  const { keys } = await db.remote.list()
  for (const r of await db.remote.list()) {
    db.local.put(r.key, await db.remote.get(r.key))
  }
}
main()
```

### DO

#### remote

Durable Objects are not exposed in any way to external access by default, so you will need to mount the fetch of your DO onto a worker, to make it work. Here is example client code:

```js
import { CrossDO } from 'cross-cf'
// or const { CrossDO } = require('cross-cf')

const POKEMON = new CrossDO('https://mine.workers.dev')

const DEMO_QUERY = `
{
  pokemon {
    id
    name
  }
}
`

async function main() {
  // works just like CF DOs
  const pokemon = POKEMON.get(POKEMON.idFromName('test'))
  
  // on real DO, first arg should be user-request or new Request(new URL('YOUR_URL')) if you are in a cron-job or whatever. It will be ignored here.
  const pokemon = await pokemon.fetch(undefined, { headers: { 'content-type': 'application/json', body: JSON.stringify({ query: DEMO_QUERY }) } })
}
main()
```

Your worker code will look something like this:

```js
export default {
  async fetch (request, env) {
    // only service application/json requests, like graphql
    if (request.headers.get('content-type') === 'application/json') {
      // get an instance of the DO for this region, and run the user's graphql query on it
      if (!env?.POKEMON) {
        console.error('DurableObject bindings have broken.')
      }
      const pokemon = env.POKEMON.get(env.POKEMON.idFromName(request.cf.colo))
      return pokemon.fetch(request)
    }

    return new Response('<h1>Nothing to see here.</h1>', {
      headers: {
        'content-type': 'text/html',
      }
    })
  }
}
```

This is a simple API example that will pass user-requests on to the DO, if the content-type is JSON. You will of course need to bind `POKEMON` to your DO in your worker, [in the regular way](https://developers.cloudflare.com/workers/learning/using-durable-objects/). You can do anyhting else you want in your worker, like check for auth-tokens in headers, or throttle requests, etc.

You may ask yourself "Why should I do this instead of just using a regular fetch or a graphql client directly with my worker?" That is a fair question. Main thing I like about this style is I can swap out the DO and it works in both environments seemlessly, which is good for library-code (like if you wanted to wrap your DO/remote in a client-library that works in browser, node, other CF-workers, DOs, cron-jobs, etc.)


### testing

One handy side-effect of this stuff is you will get an interface that works the same as the real thing, but can do remote requests, that you can mock (like with [jest](https://jestjs.io/docs/mock-functions)) and then make your code do stuff. You can mock `cross-fetch` module or global fetch for remote requests (and make them local calls you can look at), or just mock the interface directly. For my stuff, I like unit-tests that could run on the real DO if I set it up (for instant integration tests.) It's also handy if you are copy/pasting text from some worker-code. See [test.js](test.js) for some examples. You can look at [example/](example) for an example worker project.


## todo

- read wrangler.toml for ability to use named KV, and use less config (ids, etc)

