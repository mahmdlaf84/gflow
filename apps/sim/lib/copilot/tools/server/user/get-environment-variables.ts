import { createPermissionError, verifyWorkflowAccess } from '@/copilot/auth/permissions'
import type { BaseServerTool } from '@/copilot/tools/server/base-tool'
import { getEnvironmentVariableKeys } from '@/environment/utils'
import { createLogger } from '@/logs/console/logger'

interface GetEnvironmentVariablesParams {
  userId?: string
  workflowId?: string
}

export const getEnvironmentVariablesServerTool: BaseServerTool<GetEnvironmentVariablesParams, any> =
  {
    name: 'get_environment_variables',
    async execute(
      params: GetEnvironmentVariablesParams,
      context?: { userId: string }
    ): Promise<any> {
      const logger = createLogger('GetEnvironmentVariablesServerTool')

      if (!context?.userId) {
        logger.error(
          'Unauthorized attempt to access environment variables - no authenticated user context'
        )
        throw new Error('Authentication required')
      }

      const authenticatedUserId = context.userId

      if (params?.workflowId) {
        const { hasAccess } = await verifyWorkflowAccess(authenticatedUserId, params.workflowId)

        if (!hasAccess) {
          const errorMessage = createPermissionError('access environment variables in')
          logger.error('Unauthorized attempt to access environment variables', {
            workflowId: params.workflowId,
            authenticatedUserId,
          })
          throw new Error(errorMessage)
        }
      }

      const userId = authenticatedUserId

      logger.info('Getting environment variables for authenticated user', {
        userId,
        hasWorkflowId: !!params?.workflowId,
      })

      const result = await getEnvironmentVariableKeys(userId)
      logger.info('Environment variable keys retrieved', { userId, variableCount: result.count })
      return {
        variableNames: result.variableNames,
        count: result.count,
      }
    },
  }
