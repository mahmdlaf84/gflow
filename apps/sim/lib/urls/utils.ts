import { getEnv } from '@/lib/env'
import { isProd } from '@/lib/environment'
import { buildSystemUrl, getSystemIPAddress } from '@/lib/network'

export { buildSystemUrl, getSystemIPAddress } from '@/lib/network'

const LOCAL_HOSTNAME_PATTERNS = [
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '[::1]',
  'simstudio',
  'realtime',
]

function isLikelyLoopback(hostname: string): boolean {
  const normalized = hostname.trim().toLowerCase()

  if (!normalized) {
    return false
  }

  if (LOCAL_HOSTNAME_PATTERNS.includes(normalized)) {
    return true
  }

  if (normalized.endsWith('.local')) {
    return true
  }

  if (normalized.startsWith('127.')) {
    return true
  }

  return false
}

function normalizeUrl(url: URL): string {
  const stringified = url.toString()
  return stringified.endsWith('/') ? stringified.slice(0, -1) : stringified
}

/**
 * Returns the base URL of the application from NEXT_PUBLIC_APP_URL
 * This ensures webhooks, callbacks, and other integrations always use the correct public URL
 * @returns The base URL string (e.g., 'http://localhost:3000' or 'https://example.com')
 */
export function getBaseUrl(): string {
  const configuredUrl = getEnv('NEXT_PUBLIC_APP_URL')

  if (configuredUrl) {
    if (configuredUrl.startsWith('http://') || configuredUrl.startsWith('https://')) {
      return configuredUrl
    }

    const protocol = isProd ? 'https://' : 'http://'
    return `${protocol}${configuredUrl}`
  }

  const fallbackPort = process.env.PORT ? String(process.env.PORT) : '3000'
  const fallbackUrl = buildSystemUrl(fallbackPort)

  if (!process.env.NEXT_PUBLIC_APP_URL) {
    process.env.NEXT_PUBLIC_APP_URL = fallbackUrl
  }

  return fallbackUrl
}

/**
 * Returns the base URL that should be used from the browser context.
 * Falls back to the current window location when the configured base URL
 * points to localhost or another loopback hostname.
 */
export function getClientBaseUrl(): string {
  if (typeof window === 'undefined') {
    return getBaseUrl()
  }

  const configuredUrl = getEnv('NEXT_PUBLIC_APP_URL')

  if (!configuredUrl) {
    return window.location.origin
  }

  try {
    const parsed = new URL(configuredUrl)
    if (isLikelyLoopback(parsed.hostname)) {
      return window.location.origin
    }
    return normalizeUrl(parsed)
  } catch {
    return window.location.origin
  }
}

/**
 * Returns just the domain and port part of the application URL
 * @returns The domain with port if applicable (e.g., 'localhost:3000' or 'sim.ai')
 */
export function getBaseDomain(): string {
  try {
    const url = new URL(getBaseUrl())
    return url.host // host includes port if specified
  } catch (_e) {
    const fallbackUrl = getEnv('NEXT_PUBLIC_APP_URL') || buildSystemUrl('3000')
    try {
      return new URL(fallbackUrl).host
    } catch {
      return isProd ? 'sim.ai' : `${getSystemIPAddress()}:3000`
    }
  }
}

/**
 * Derives the socket server URL that should be used in the browser. When the
 * configured socket URL resolves to localhost we instead reuse the current
 * window location and swap in the configured port.
 */
export function getClientSocketUrl(): string {
  const configuredSocketUrl = getEnv('NEXT_PUBLIC_SOCKET_URL')

  if (typeof window === 'undefined') {
    return configuredSocketUrl || buildSystemUrl('3002')
  }

  const windowOrigin = new URL(window.location.origin)

  if (!configuredSocketUrl) {
    windowOrigin.port = '3002'
    return normalizeUrl(windowOrigin)
  }

  try {
    const parsed = new URL(configuredSocketUrl)

    if (!isLikelyLoopback(parsed.hostname)) {
      return normalizeUrl(parsed)
    }

    const port = parsed.port || '3002'
    const derived = new URL(windowOrigin.toString())
    derived.port = port
    derived.protocol = parsed.protocol || derived.protocol
    return normalizeUrl(derived)
  } catch {
    windowOrigin.port = '3002'
    return normalizeUrl(windowOrigin)
  }
}

/**
 * Returns the domain for email addresses, stripping www subdomain for Resend compatibility
 * @returns The email domain (e.g., 'sim.ai' instead of 'www.sim.ai')
 */
export function getEmailDomain(): string {
  try {
    const baseDomain = getBaseDomain()
    return baseDomain.startsWith('www.') ? baseDomain.substring(4) : baseDomain
  } catch (_e) {
    return isProd ? 'sim.ai' : `${getSystemIPAddress()}:3000`
  }
}

export function isLocalHostname(hostname: string): boolean {
  return isLikelyLoopback(hostname)
}
