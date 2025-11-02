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
