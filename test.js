/* global describe, test, expect, jest, beforeEach */

import { CrossKV, CrossDO } from './cross-cf.js'
import realFetch from 'cross-fetch'

// this illustrates how you can hit a real service for integration-tests, or mock for fast network-free unit-tests
if (process.env.TEST_MODE !== 'integration') {
  global.fetch = jest.fn(async (url, options) => {
    return {
      status: 200,
      async json () {
        return { test: true }
      }
    }
  })
  process.env.CF_EMAIL = 'test@test.com'
  process.env.CF_TOKEN = 'XXX_TOKEN'
  process.env.CF_ACCOUNTID = 'XXX_ACCOUNT'
} else {
  global.fetch = jest.fn(realFetch)
}

const testKV = '0caac01eaf724a108c78075288ceddc2'

beforeEach(() => {
  jest.clearAllMocks()
})

describe('CrossKV', () => {
  test('has tests', () => {
    expect(1 + 1).toBe(2)
  })

  describe('Local', () => {
    const MYDB = new CrossKV('MYDB', { target: 'local' })

    test('should be able to put', async () => {
      await MYDB.put('TEST', JSON.stringify({ test: true }))
      expect(global.fetch).toHaveBeenCalledTimes(0)
    })

    test('should be able to get', async () => {
      const r = await MYDB.get('TEST', { type: 'json' })
      expect(r?.test).toBeDefined()
      expect(global.fetch).toHaveBeenCalledTimes(0)
    })
  })

  describe('Remote', () => {
    const MYDB = new CrossKV('MYDB', { target: 'remote', kvID: testKV })

    test('should be able to put', async () => {
      await MYDB.put('TEST', JSON.stringify({ test: true }))
    })

    test('should be able to get', async () => {
      const r = await MYDB.get('TEST', { type: 'json' })
      expect(r?.test).toBeDefined()
      expect(global.fetch).toHaveBeenCalledTimes(1)
      expect(global.fetch).toHaveBeenCalledWith(
        `https://api.cloudflare.com/client/v4/accounts/${process.env.CF_ACCOUNTID}/storage/kv/namespaces/${testKV}/values/TEST`,
        {
          headers: {
            Accepts: 'application/json',
            'Content-Type': 'application/json',
            'X-Auth-Email': process.env.CF_EMAIL,
            'X-Auth-Key': process.env.CF_TOKEN
          }
        }
      )
    })

    test('should throw with no kvID', () => {
      const t = () => new CrossKV('MYDB', { target: 'remote' })
      expect(t).toThrow()
    })

    test('namespaces', async () => {
    })
  })
})

describe('CrossDO', () => {
  test('has tests', () => {
    expect(1 + 1).toBe(2)
  })
})
