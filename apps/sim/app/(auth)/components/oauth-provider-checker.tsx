'use server'

import { auth } from '@/lib/auth'
import { env } from '@/lib/env'
import { isProd } from '@/lib/environment'

export async function getOAuthProviderStatus() {
  const socialProviders = auth.options?.socialProviders as
    | Record<string, { clientId?: string; clientSecret?: string; enabled?: boolean }>
    | undefined

  const githubFromConfig = socialProviders?.github
  const googleFromConfig = socialProviders?.google

  const githubAvailable =
    Boolean(
      githubFromConfig &&
        githubFromConfig.enabled !== false &&
        githubFromConfig.clientId &&
        githubFromConfig.clientSecret
    ) || !!(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET)

  const googleAvailable =
    Boolean(
      googleFromConfig &&
        googleFromConfig.enabled !== false &&
        googleFromConfig.clientId &&
        googleFromConfig.clientSecret
    ) || !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET)

  return { githubAvailable, googleAvailable, isProduction: isProd }
}
