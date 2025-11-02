import { env } from '@/env'
import { getEmailDomain } from '@/urls/utils'

/**
 * Get the from email address, preferring FROM_EMAIL_ADDRESS over EMAIL_DOMAIN
 */
export function getFromEmailAddress(): string {
  if (env.FROM_EMAIL_ADDRESS?.trim()) {
    return env.FROM_EMAIL_ADDRESS
  }
  // Fallback to constructing from EMAIL_DOMAIN
  return `noreply@${env.EMAIL_DOMAIN || getEmailDomain()}`
}
