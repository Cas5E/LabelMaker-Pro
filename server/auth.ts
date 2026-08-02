import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'
import type { Context, Next } from 'hono'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'

const COOKIE = 'lm_session'
const MAX_AGE_SEC = 60 * 60 * 24 * 30 // 30 dagen

function env(name: string, fallback = '') {
  return (process.env[name] ?? fallback).trim()
}

export function authConfigured() {
  return Boolean(env('AUTH_EMAIL') && env('AUTH_PASSWORD'))
}

function secret() {
  const s = env('AUTH_SECRET')
  if (s) return s
  // Dev fallback — zet AUTH_SECRET in .env voor productie
  return 'labelmaker-dev-secret-change-me'
}

function sign(payload: string) {
  return createHmac('sha256', secret()).update(payload).digest('base64url')
}

function makeToken(email: string) {
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE_SEC
  const body = Buffer.from(JSON.stringify({ email, exp }), 'utf8').toString('base64url')
  return `${body}.${sign(body)}`
}

function readToken(token: string): { email: string; exp: number } | null {
  const [body, sig] = token.split('.')
  if (!body || !sig) return null
  const expect = sign(body)
  const a = Buffer.from(sig)
  const b = Buffer.from(expect)
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null
  try {
    const data = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as {
      email?: string
      exp?: number
    }
    if (!data.email || !data.exp || data.exp < Math.floor(Date.now() / 1000)) return null
    return { email: data.email, exp: data.exp }
  } catch {
    return null
  }
}

function safeEqual(a: string, b: string) {
  const ba = Buffer.from(a)
  const bb = Buffer.from(b)
  if (ba.length !== bb.length) {
    // toch vergelijken om timing leaks te dempen
    timingSafeEqual(ba, ba)
    return false
  }
  return timingSafeEqual(ba, bb)
}

export function verifyCredentials(email: string, password: string) {
  const wantEmail = env('AUTH_EMAIL')
  const wantPass = env('AUTH_PASSWORD')
  if (!wantEmail || !wantPass) return false
  return (
    safeEqual(email.trim().toLowerCase(), wantEmail.toLowerCase()) &&
    safeEqual(password, wantPass)
  )
}

export function sessionEmail(c: Context): string | null {
  const token = getCookie(c, COOKIE)
  if (!token) return null
  const data = readToken(token)
  return data?.email ?? null
}

export function setSession(c: Context, email: string) {
  const secure =
    env('COOKIE_SECURE').toLowerCase() === 'true' ||
    c.req.header('x-forwarded-proto') === 'https'
  setCookie(c, COOKIE, makeToken(email), {
    httpOnly: true,
    path: '/',
    sameSite: 'Lax',
    secure,
    maxAge: MAX_AGE_SEC,
  })
}

export function clearSession(c: Context) {
  deleteCookie(c, COOKIE, { path: '/' })
}

/** Publieke auth-routes + health; rest van /api vereist login. */
export async function requireAuth(c: Context, next: Next) {
  const path = c.req.path
  if (
    path === '/api/health' ||
    path === '/api/auth/login' ||
    path === '/api/auth/me' ||
    path === '/api/auth/logout'
  ) {
    return next()
  }
  if (!path.startsWith('/api/')) return next()

  if (!authConfigured()) {
    return c.json(
      { error: 'Auth niet geconfigureerd — zet AUTH_EMAIL en AUTH_PASSWORD in .env' },
      503,
    )
  }

  if (!sessionEmail(c)) return c.json({ error: 'Niet ingelogd' }, 401)
  return next()
}

export function newAuthSecret() {
  return randomBytes(32).toString('hex')
}
