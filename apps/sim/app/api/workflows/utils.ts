import { NextResponse } from 'next/server'
import { createLogger } from '@/lib/logs/console/logger'
import { getUserEntityPermissions } from '@/lib/permissions/utils'
import { persistApiLog } from '@/logs/api'

const logger = createLogger('WorkflowUtils')

type ApiResponseLogOptions = {
  request?: Request
  status?: number
  details?: unknown
  module?: string
}

const logApiResponse = (
  level: 'INFO' | 'ERROR',
  message: string,
  fallbackStatus: number,
  options?: ApiResponseLogOptions
) => {
  if (typeof window !== 'undefined') {
    return
  }

  const request = options?.request
  const status = options?.status ?? fallbackStatus

  void persistApiLog({
    level,
    module: options?.module ?? 'WorkflowUtils',
    message,
    status,
    method: request?.method,
    url: request?.url,
    args: options?.details !== undefined ? [options.details] : undefined,
  })
}

export function createErrorResponse(
  error: string,
  status: number,
  code?: string,
  options?: ApiResponseLogOptions
) {
  logApiResponse('ERROR', error, status, options)

  return NextResponse.json(
    {
      error,
      code: code || error.toUpperCase().replace(/\s+/g, '_'),
    },
    { status }
  )
}

export function createSuccessResponse(data: any, options?: ApiResponseLogOptions) {
  logApiResponse('INFO', 'Request completed successfully', 200, options)

  const responseStatus = options?.status ?? 200

  return NextResponse.json(data, { status: responseStatus })
}

/**
 * Verifies user's workspace permissions using the permissions table
 * @param userId User ID to check
 * @param workspaceId Workspace ID to check
 * @returns Permission type if user has access, null otherwise
 */
export async function verifyWorkspaceMembership(
  userId: string,
  workspaceId: string
): Promise<string | null> {
  try {
    const permission = await getUserEntityPermissions(userId, 'workspace', workspaceId)

    return permission
  } catch (error) {
    logger.error(`Error verifying workspace permissions for ${userId} in ${workspaceId}:`, error)
    return null
  }
}
