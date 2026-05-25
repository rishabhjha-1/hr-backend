import type { RequestHandler } from 'express'
import rateLimit from 'express-rate-limit'

function isRateLimitEnabled() {
  return process.env.RATE_LIMIT_ENABLED !== 'false'
}

function windowMs() {
  return Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60_000)
}

function passthrough(): RequestHandler {
  return (_req, _res, next) => next()
}

export function createApiRateLimiter(): RequestHandler {
  if (!isRateLimitEnabled()) {
    return passthrough()
  }

  return rateLimit({
    windowMs: windowMs(),
    max: Number(process.env.RATE_LIMIT_MAX ?? 100),
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later' },
  })
}

export function createWriteRateLimiter(): RequestHandler {
  if (!isRateLimitEnabled()) {
    return passthrough()
  }

  return rateLimit({
    windowMs: windowMs(),
    max: Number(process.env.RATE_LIMIT_WRITE_MAX ?? 30),
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many write requests, please try again later' },
  })
}
