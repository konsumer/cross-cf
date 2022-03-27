/* global describe, test, expect, jest, beforeEach */

import { CrossKV, CrossDO } from './cross-cf.js'
import realFetch from 'cross-fetch'

// set this to your own
const testKV = '0caac01eaf724a108c78075288ceddc2'

// this illustrates how you can hit a real service for integration-tests, or mock for fast network-free unit-tests
if (process.env.TEST_MODE !== 'integration') {
  global.fetch = jest.fn(async (url, options) => {
    return {
      status: 200,

      // only get-text asks for this
      async text () {
        return JSON.stringify({ test: true })
      },

      // json() could be get/getWithMetadata/list
      async json () {
        // meta
        if (url.endsWith('/metadata/TEST')) {
          return { result: null, success: true, errors: [], messages: [] }
        }

        // list
        if (url.endsWith('/keys?')) {
          return {
            result: [{ name: 'TEST' }],
            success: true,
            errors: [],
            messages: [],
            result_info: { count: 1, cursor: '' }
          }
        }

        // get
        return { test: true }
      },

      // these don't have tests yet
      async arrayBuffer () {},

      body: {
        getReader () {}
      }
    }
  })
  process.env.CF_TOKEN = 'XXX_TOKEN'
  process.env.CF_ACCOUNTID = 'XXX_ACCOUNT'
} else {
  global.fetch = jest.fn(realFetch)
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe('CrossKV', () => {
  test('has tests', () => {
    expect(1 + 1).toBe(2)
  })

  describe('Local', () => {
    const MYDB = new CrossKV('MYDB', { target: 'local' })

    test('put', async () => {
      await MYDB.put('TEST', JSON.stringify({ test: true }))
      expect(global.fetch).toHaveBeenCalledTimes(0)
    })

    test('get text', async () => {
      const r = await MYDB.get('TEST')
      expect(global.fetch).toHaveBeenCalledTimes(0)
      expect(r).toEqual(JSON.stringify({ test: true }))
    })

    test('get JSON', async () => {
      const r = await MYDB.get('TEST', { type: 'json' })
      expect(global.fetch).toHaveBeenCalledTimes(0)
      expect(r).toEqual({ test: true })
    })

    test('getWithMetadata', async () => {
      const r = await MYDB.getWithMetadata('TEST', { type: 'json' })
      expect(r.value).toEqual({ test: true })
      expect(r.metadata).toBe(null)
    })

    test('list', async () => {
      const r = await MYDB.list()
      expect(r.keys.length).toBe(1)
      expect(r.keys[0].name).toBe('TEST')
    })
  })

  describe('Remote', () => {
    const MYDB = new CrossKV('MYDB', { target: 'remote', kvID: testKV })

    test('throw with no kvID', () => {
      const t = () => new CrossKV('MYDB', { target: 'remote' })
      expect(t).toThrow()
    })

    test('put', async () => {
      const body = JSON.stringify({ test: true })
      await MYDB.put('TEST', body)
      expect(global.fetch).toHaveBeenCalledTimes(1)
      expect(global.fetch).toHaveBeenCalledWith(
        `https://api.cloudflare.com/client/v4/accounts/${process.env.CF_ACCOUNTID}/storage/kv/namespaces/${testKV}/values/TEST?`,
        {
          body,
          headers: {
            Authorization: `Bearer ${process.env.CF_TOKEN}`
          },
          method: 'PUT'
        }
      )
    })

    test('get text', async () => {
      const r = await MYDB.get('TEST')
      expect(r).toEqual(JSON.stringify({ test: true }))
      expect(global.fetch).toHaveBeenCalledTimes(1)
      expect(global.fetch).toHaveBeenCalledWith(
        `https://api.cloudflare.com/client/v4/accounts/${process.env.CF_ACCOUNTID}/storage/kv/namespaces/${testKV}/values/TEST?`,
        {
          body: undefined,
          headers: {
            Authorization: `Bearer ${process.env.CF_TOKEN}`
          },
          method: 'GET'
        }
      )
    })

    test('get JSON', async () => {
      const r = await MYDB.get('TEST', { type: 'json' })
      expect(r).toEqual({ test: true })
      expect(global.fetch).toHaveBeenCalledTimes(1)
      expect(global.fetch).toHaveBeenCalledWith(
        `https://api.cloudflare.com/client/v4/accounts/${process.env.CF_ACCOUNTID}/storage/kv/namespaces/${testKV}/values/TEST?`,
        {
          body: undefined,
          headers: {
            Authorization: `Bearer ${process.env.CF_TOKEN}`
          },
          method: 'GET'
        }
      )
    })

    test('getWithMetadata', async () => {
      const r = await MYDB.getWithMetadata('TEST', { type: 'json' })
      expect(r.value).toEqual({ test: true })
      expect(r.metadata).toBe(null)
    })

    test('list', async () => {
      const r = await MYDB.list()
      expect(r.keys.length).toBe(1)
      expect(r.keys[0].name).toBe('TEST')
    })
  })
})

describe('CrossDO', () => {
  test('has tests', () => {
    expect(1 + 1).toBe(2)
  })
})
