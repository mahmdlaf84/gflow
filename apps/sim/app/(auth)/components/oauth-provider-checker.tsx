'use server'

import { getEnv } from '@/lib/env'
import { isProd } from '@/lib/environment'

export async function getOAuthProviderStatus() {
  const githubClientId = getEnv('GITHUB_CLIENT_ID')
  const githubClientSecret = getEnv('GITHUB_CLIENT_SECRET')
  const githubAvailable = Boolean(githubClientId && githubClientSecret)

  const googleClientId = getEnv('GOOGLE_CLIENT_ID')
  const googleClientSecret = getEnv('GOOGLE_CLIENT_SECRET')
  const googleAvailable = Boolean(googleClientId && googleClientSecret)

  return { githubAvailable, googleAvailable, isProduction: isProd }
}
