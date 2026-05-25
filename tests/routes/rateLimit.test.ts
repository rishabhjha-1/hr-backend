import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'
import { createApp } from '../../src/app.js'

describe('API rate limiting', () => {
  const previousEnv = { ...process.env }

  beforeEach(() => {
    process.env.RATE_LIMIT_ENABLED = 'true'
    process.env.RATE_LIMIT_MAX = '3'
    process.env.RATE_LIMIT_WRITE_MAX = '2'
    process.env.RATE_LIMIT_WINDOW_MS = '60000'
  })

  afterEach(() => {
    process.env = { ...previousEnv }
  })

  it('returns 429 after exceeding the read limit', async () => {
    const app = createApp()

    await request(app).get('/api/employees?page=1&pageSize=1')
    await request(app).get('/api/employees?page=1&pageSize=1')
    await request(app).get('/api/employees?page=1&pageSize=1')

    const limited = await request(app).get('/api/employees?page=1&pageSize=1')

    expect(limited.status).toBe(429)
    expect(limited.body.error).toMatch(/too many requests/i)
    expect(limited.headers['ratelimit-limit']).toBeDefined()
  })

  it('does not rate limit health checks', async () => {
    const app = createApp()

    for (let index = 0; index < 5; index += 1) {
      const response = await request(app).get('/health')
      expect(response.status).toBe(200)
    }
  })
})
