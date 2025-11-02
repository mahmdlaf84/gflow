import { promises as fs } from 'fs'
import path from 'path'

type ApiLogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR'

type ApiLogPayload = {
  level: ApiLogLevel
  module?: string
  message: string
  status?: number
  method?: string
  url?: string
  args?: unknown[]
}

const PRIMARY_LOG_DIRECTORY = '/var/log/sim'
const FALLBACK_LOG_DIRECTORY = path.join(process.cwd(), 'var', 'log', 'sim')

let logDirectory = PRIMARY_LOG_DIRECTORY

let ensureDirectoryPromise: Promise<void> | null = null

const getLogFilePath = () => path.join(logDirectory, 'api.log')

const isSerializableObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null
}

const serializeValue = (value: unknown, seen = new WeakSet()): unknown => {
  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack,
      ...Object.fromEntries(Object.entries(value).filter(([, v]) => typeof v !== 'function')),
    }
  }

  if (typeof value === 'bigint') {
    return value.toString()
  }

  if (typeof value === 'function') {
    return value.name || '[Function]'
  }

  if (!isSerializableObject(value)) {
    return value
  }

  if (seen.has(value)) {
    return '[Circular]'
  }

  seen.add(value)

  const serializedEntries: Record<string, unknown> = {}

  for (const [key, entryValue] of Object.entries(value)) {
    serializedEntries[key] = serializeValue(entryValue, seen)
  }

  seen.delete(value)

  return serializedEntries
}

const ensureDirectoryExists = async () => {
  if (ensureDirectoryPromise) {
    return ensureDirectoryPromise
  }

  const createDirectory = async (directory: string) => {
    await fs.mkdir(directory, { recursive: true })
  }

  ensureDirectoryPromise = (async () => {
    try {
      await createDirectory(logDirectory)
      return
    } catch (error) {
      if (logDirectory === FALLBACK_LOG_DIRECTORY) {
        throw error
      }

      logDirectory = FALLBACK_LOG_DIRECTORY
      await createDirectory(logDirectory)
    }
  })().catch((error) => {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Failed to prepare API log directory', error)
    }
  })

  return ensureDirectoryPromise
}

const appendLogEntry = async (entry: string) => {
  const attemptWrite = async () => {
    await fs.appendFile(getLogFilePath(), entry, 'utf8')
  }

  try {
    await attemptWrite()
  } catch (error) {
    if (logDirectory === FALLBACK_LOG_DIRECTORY) {
      throw error
    }

    logDirectory = FALLBACK_LOG_DIRECTORY
    ensureDirectoryPromise = null
    await ensureDirectoryExists()
    await attemptWrite()
  }
}

export const persistApiLog = async (payload: ApiLogPayload) => {
  if (typeof process === 'undefined' || process.env.DISABLE_API_FILE_LOGGING === '1') {
    return
  }

  try {
    await ensureDirectoryExists()

    const entry: Record<string, unknown> = {
      timestamp: new Date().toISOString(),
      level: payload.level,
      module: payload.module,
      message: payload.message,
    }

    if (payload.status !== undefined) {
      entry.status = payload.status
    }

    if (payload.method) {
      entry.method = payload.method
    }

    if (payload.url) {
      entry.url = payload.url
    }

    if (payload.args?.length) {
      entry.context = payload.args.map((value) => serializeValue(value))
    }

    await appendLogEntry(`${JSON.stringify(entry)}\n`)
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Failed to persist API log entry', error)
    }
  }
}
