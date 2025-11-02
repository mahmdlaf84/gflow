import { getEnv } from '@/lib/env'
import { isProd } from '@/lib/environment'

type NetworkInterfaceInfo = {
  address: string
  family: string
  internal?: boolean
}

let cachedHostIp: string | null = null

type NodeOsModule = {
  networkInterfaces: () => Record<string, NetworkInterfaceInfo[] | undefined>
}

function loadNodeOsModule(): NodeOsModule | null {
  if (typeof window !== 'undefined') {
    return null
  }

  if (typeof process === 'undefined' || !process.versions?.node) {
    return null
  }

  try {
    // biome-ignore lint/security/noGlobalEval: required to access Node modules without bundler static analysis
    const req = eval('require') as (moduleId: string) => unknown
    return req('node:os') as typeof import('node:os')
  } catch {
    return null
  }
}

function isPrivateIPv4(address: string): boolean {
  if (address.startsWith('10.')) return true
  if (address.startsWith('192.168.')) return true
  if (address.startsWith('172.')) {
    const secondOctet = Number.parseInt(address.split('.')[1] ?? '0', 10)
    return secondOctet >= 16 && secondOctet <= 31
  }
  if (address.startsWith('169.254.')) return true
  return false
}

export function getSystemIPAddress(): string {
  if (cachedHostIp) {
    return cachedHostIp
  }

  if (typeof window !== 'undefined') {
    cachedHostIp = window.location.hostname || '127.0.0.1'
    return cachedHostIp
  }

  const osModule = loadNodeOsModule()

  if (!osModule) {
    cachedHostIp = '127.0.0.1'
    return cachedHostIp
  }

  const interfaces = osModule.networkInterfaces()
  const publicIps: string[] = []
  const privateIps: string[] = []

  for (const net of Object.values(interfaces)) {
    if (!net) continue
    for (const info of net as NetworkInterfaceInfo[]) {
      if (!info || info.family !== 'IPv4') continue
      if (info.internal) continue

      if (isPrivateIPv4(info.address)) {
        privateIps.push(info.address)
      } else {
        publicIps.push(info.address)
      }
    }
  }

  cachedHostIp = publicIps[0] || privateIps[0] || '127.0.0.1'
  return cachedHostIp
}

export function buildSystemUrl(port: string, protocol: 'http' | 'https' = 'http'): string {
  const host = getSystemIPAddress()
  return `${protocol}://${host}:${port}`
}

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
 * @throws Error if NEXT_PUBLIC_APP_URL is not configured
 */
export function getBaseUrl(): string {
  const baseUrl = getEnv('NEXT_PUBLIC_APP_URL')

  if (!baseUrl) {
    throw new Error(
      'NEXT_PUBLIC_APP_URL must be configured for webhooks and callbacks to work correctly'
    )
  }

  if (baseUrl.startsWith('http://') || baseUrl.startsWith('https://')) {
    return baseUrl
  }

  const protocol = isProd ? 'https://' : 'http://'
  return `${protocol}${baseUrl}`
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
