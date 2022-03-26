#!/usr/bin/env npx -y esno

// this will let you mess with KV in different environments

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
    const { CF_EMAIL, CF_TOKEN, CF_ACCOUNTID } = (process?.env || {})

    this.options = {
      ...options,
      target: options.target || 'local',
      filepath: path.resolve(options.filepath || './.mf/kv', name),
      accountEmail: options.accountEmail || CF_EMAIL,
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
      requiredOptions(['kvID', 'accountEmail', 'accountToken', 'accountID'], this.options)
    }

    // bind all the methods to this object, if there is a db setup (miniflare or real)
    if (this._db) {
      this.get = this._db.get.bind(this._db)
      this.getWithMetadata = this._db.getWithMetadata.bind(this._db)
      this.list = this._db.list.bind(this._db)
      this.put = this._db.put.bind(this._db)
      this.delete = this._db.delete.bind(this._db)
    }
  }

  // TODO: below here is implementations that hits remote KV

  async get (id, options) {
    return this.api(`/storage/kv/namespaces/${this.options.kvID}/values/${id}`)
  }

  async getWithMetadata (id, options) {}

  async list (options) {}

  async put (id, value, options) {}

  async delete (id, options) {}

  // below here are some extra functions you are free to use, but they are not part of KV

  // call CF API: https://api.cloudflare.com/
  // UNDOCUMENTED
  api (endpoint, method = 'GET', options = {}) {
    const { headers = {}, body, ...fetchOptions } = options
    if (body) {
      fetchOptions.body = JSON.stringify(body)
    }
    return fetch(`https://api.cloudflare.com/client/v4/accounts/${this.options.accountID}${endpoint}`, {
      headers: {
        'X-Auth-Email': this.options.accountEmail,
        'X-Auth-Key': this.options.accountToken,
        'Content-Type': 'application/json',
        Accepts: 'application/json',
        ...headers
      },
      ...fetchOptions
    })
      .then(r => {
        if (r.status !== 200) {
          throw new Error(`Error ${r.status}`)
        }
        return r
      })
      .then(r => r.json())
  }

  // get list of available KV namespaces
  // UNDOCUMENTED
  namespaces () {
    return this.api('/storage/kv/namespaces')
  }
}

export class CrossDO {
  constructor (url) {
    this.url = url
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
