This is an example worker/DO project that you can use with the remote-DO/KV stuff.

Additionally, I track remote KV I use, for testing cross-cf's remote KV handling. You will need to set all your own IDs in wrangler.toml.

My worker is deployed [here](https://do-example.dkonsumer-gummicube.workers.dev/).

The features of this demo-project are:

- a graphql server that runs on CF edge-worker
- a graphql playground to mess around with API
- a node library that wraps generareated "mega queries" so users can just get all the data without having to make graphql requests
- complete local mock /dev server (using same data & scripts to manage data)
- good testing: integration (run off real worker) and unit (no network requests, no touching worker)
- migration: local data can be sent to remote and vice-versa
- example build for easy-to-manage setup

To run it yourself, edit wrangler.toml and set up your own IDs for things.

```sh
npm start                 # run a local dev-server
npm test                  # run unit-tests
npm run integration       # run integration-tests (same as unit-tests, but on remote)
npm run deploy            # deploy on cloudflare
npm run mock              # generate mock KV from pokemon.json file
npm run migrate:tolocal   # copy remote database into local
npm run migrate:toremote  # copy local database into remote
```

This has been adapted & improved, originally from [graphql-pokemon](https://github.com/lucasbento/graphql-pokemon). I could have just run directly off the JSON file, but I wanted to make a demo of using KV, so I insert all records into KV:

```
npm run mock
npm run migrate:toremote
```