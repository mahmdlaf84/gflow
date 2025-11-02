'use server'

import { getEnv, isTruthy } from '@/lib/env'
import { isProd } from '@/lib/environment'

export async function getOAuthProviderStatus() {
  const githubClientId = getEnv('GITHUB_CLIENT_ID')
  const githubClientSecret = getEnv('GITHUB_CLIENT_SECRET')
  const githubAvailable = Boolean(githubClientId && githubClientSecret)

  const googleClientId = getEnv('GOOGLE_CLIENT_ID')
  const googleClientSecret = getEnv('GOOGLE_CLIENT_SECRET')
  const googleAvailable = Boolean(googleClientId && googleClientSecret)

  const ssoEnabled = isTruthy(getEnv('NEXT_PUBLIC_SSO_ENABLED') ?? getEnv('SSO_ENABLED'))

  return { githubAvailable, googleAvailable, isProduction: isProd, ssoEnabled }
}
