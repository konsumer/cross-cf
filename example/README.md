This is an example worker/DO project that you can use with the remote-DO/KV stuff.

Additionally, I track remote KV I use, for testing cross-cf's remote KV handling. You will need to set all your own IDs in wrangler.toml.

The features of this demo-project are:

- a graphql server that runs on CF edge-worker
- a node library that wraps generareated "mega queries" so users can just get all the data without having to make graphql requests
- complete local mock /dev server (using same data & scripts to manage data)
- migration: local data can be sent to remote and vice-versa

To run it yourself, look in wrangler.toml and set up your own IDs for things.

```sh
npm start                 # run a local dev-server
npm test                  # run unit-tests
npm run integration       # run integration-tests (unit-tests, but on remote)
npm run deploy            # deploy on cloudflare
npm run migrate:tolocal   # copy remote database into local
npm run migrate:toremote  # copy local database into remote
```