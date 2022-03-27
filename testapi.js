import fetch from 'cross-fetch'

// these are set. CF_TOKEN is the token I added on my account page
// email/token combo should work according to docs here: https://api.cloudflare.com/#getting-started-requests
const { CF_TOKEN, CF_ACCOUNTID } = (process?.env || {})

const testKV = '0caac01eaf724a108c78075288ceddc2'

function api (url, headers = {}, fetchOptions) {
  return fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      Accepts: 'application/json',
      ...headers
    },
    ...fetchOptions
  })
    .then(async r => {
      if (r.status !== 200) {
        const e = new Error(`Error ${r.status}`)
        e.request = r
        throw e
      }
      return r
    })
    .then(r => r.json())
    .catch(async error => {
      if (error.request) {
        try {
          const o = await error.request.json()
          console.error(o.errors.map(e => e.message).join('\n'))
        } catch (e) {
          console.error('Error.')
        }
      }
    })
}

async function main () {
  // verify token
  console.log(await api('https://api.cloudflare.com/client/v4/user/tokens/verify', { Authorization: `Bearer ${CF_TOKEN}` }))

  // get list of KVs
  const { result } = await api(`https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNTID}/storage/kv/namespaces`, { Authorization: `Bearer ${CF_TOKEN}` })
  console.log(result)

  // list keys in 1st KV
  console.log(await api(`https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNTID}/storage/kv/namespaces/${testKV}/keys`, { Authorization: `Bearer ${CF_TOKEN}` }))

  // put a KV
  console.log(await api(`https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNTID}/storage/kv/namespaces/${testKV}/values/TEST`, { Authorization: `Bearer ${CF_TOKEN}` }, { method: 'PUT', body: JSON.stringify({ cool: true }) }))
}
main()
