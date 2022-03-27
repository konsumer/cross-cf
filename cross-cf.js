#!/usr/bin/env npx -y esno

// this will let you mess with KV & DO in different environments

// I use a global, so it's easier to mock in unit-tests, in ES6
/* global fetch */

import path from 'path'
import { KVNamespace } from '@miniflare/kv'
import { FileStorage } from '@miniflare/storage-file'
import 'cross-fetch'

function requiredOptions (needs, options) {
  for (const o of needs) {
    if (!options[o] || options[o] === '') {
      throw new Error(`${o} is required.`)
    }
  }
}

export class CrossKV {
  constructor (name, options = {}) {
    // these are default env-vars
    const { CF_TOKEN, CF_ACCOUNTID } = (process?.env || {})

    this.options = {
      ...options,
      target: options.target || 'local',
      filepath: path.resolve(options.filepath || './.mf/kv', name),
      accountToken: options.accountToken || CF_TOKEN,
      accountID: options.accountID || CF_ACCOUNTID,
      env: options.env || {},
      name
    }

    if (this.options.target === 'local') {
      requiredOptions(['filepath'], this.options)
      this._db = new KVNamespace(new FileStorage(this.options.filepath))
    } else if (this.options.target === 'cf') {
      this._db = this.options.env[name] || global[name]
      if (!this._db) {
        throw new Error(`You chose "cf" for target, but env does not have "${name}" KV.`)
      }
    } else if (this.options.target === 'remote') {
      requiredOptions(['kvID', 'accountToken', 'accountID'], this.options)
    }

    // bind all the methods to this object, if there is a db setup (miniflare or real)
    if (this._db) {
      this.get = this._db.get.bind(this._db)
      this.getWithMetadata = this._db.getWithMetadata.bind(this._db)
      this.list = this._db.list.bind(this._db)
      this.put = this._db.put.bind(this._db)
      this.delete = this._db.delete.bind(this._db)

      // this makes API match, but just calls regular function for each
      this.bulkdelete = (keys, paramsAll = {}) => {}
    }
  }

  // below here is implementations that hits remote KV

  async get (id, paramsAll = {}) {
    const { type, ...params } = paramsAll
    const o = new URLSearchParams(params).toString()

    const r = await this.api(`/storage/kv/namespaces/${this.options.kvID}/values/${id}?${o}`)
    if (type === 'json') {
      return r.json()
    } else if (type === 'arrayBuffer') {
      r.arrayBuffer()
    } else if (type === 'stream') {
      const reader = r.body.getReader()
      return reader
    } else {
      return r.text()
    }
  }

  async getWithMetadata (id, paramsAll = {}) {
    const value = await this.get(id, paramsAll)
    const m = await this.api(`/storage/kv/namespaces/${this.options.kvID}/metadata/${id}`).then(r => r.json())
    return { value, metadata: m.result }
  }

  async list (paramsAll = {}) {
    // TODO: look into cursor
    const o = new URLSearchParams(paramsAll).toString()
    const r = await this.api(`/storage/kv/namespaces/${this.options.kvID}/keys?${o}`).then(r => r.json())
    return {
      keys: r.result,
      cursor: r.result_info.cursor,
      list_complete: r.result.length === r.result_info.count
    }
  }

  put (id, value, paramsAll = {}) {
    const o = new URLSearchParams(paramsAll).toString()
    return this.api(`/storage/kv/namespaces/${this.options.kvID}/values/${id}?${o}`, 'PUT', { body: value }).then(r => r.json())
  }

  delete (id, paramsAll = {}) {
    const o = new URLSearchParams(paramsAll).toString()
    return this.api(`/storage/kv/namespaces/${this.options.kvID}/values/${id}?${o}`, 'DELETE').then(r => r.json())
  }

  // below here are some extra functions you are free to use, but they are not part of KV

  // call CF API: https://api.cloudflare.com/
  // UNDOCUMENTED
  api (endpoint, method = 'GET', paramsAll = {}) {
    const { headers = {}, body, ...fetchOptions } = paramsAll
    return fetch(`https://api.cloudflare.com/client/v4/accounts/${this.options.accountID}${endpoint}`, {
      headers: {
        Authorization: `Bearer ${this.options.accountToken}`,
        ...headers
      },
      ...fetchOptions,
      method,
      body
    })
      .then(r => {
        if (r.status !== 200) {
          throw new Error(`Error ${r.status}`)
        }
        return r
      })
  }

  // do a bulk put (for better efficientcy, up to 10,000)
  // https://api.cloudflare.com/#workers-kv-namespace-write-multiple-key-value-pairs
  // UNDOCUMENTED
  bulkput (records, paramsAll = {}) {

  }

  // do a bulk delete (for better efficientcy, up to 10,000)
  // https://api.cloudflare.com/#workers-kv-namespace-delete-multiple-key-value-pairs
  // UNDOCUMENTED
  bulkdelete (keys, paramsAll = {}) {
  }
}

export class CrossDO {
  constructor (url) {
    this.url = url

    // use the real one, if it's provided
    if (typeof url === 'object') {
      this.get = url.get.bind(url)
      this.idFromName = url.idFromName.bind(url)
    }
  }

  get (id) {
    return {
      fetch (r, opts) {
        return fetch(this.url, opts)
      }
    }
  }

  idFromName (name) {
    return name
  }
}
