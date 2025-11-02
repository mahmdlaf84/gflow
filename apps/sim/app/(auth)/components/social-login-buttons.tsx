'use client'

import { useEffect, useMemo, useState } from 'react'
import { GithubIcon, GoogleIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { client } from '@/lib/auth-client'
import { getEnv, isTruthy } from '@/lib/env'
import { SSOLoginButton } from '@/app/(auth)/components/sso-login-button'
import { inter } from '@/app/fonts/inter'

interface SocialLoginButtonsProps {
  githubAvailable: boolean
  googleAvailable: boolean
  callbackURL?: string
  isProduction: boolean
  /** When true, renders the SSO login option to match other social providers */
  showSSOOption?: boolean
  /**
   * Allows callers to override the SSO button variant when they want to surface
   * the SSO option alongside the primary action (e.g. when email login is
   * disabled and SSO should appear as the prominent CTA).
   */
  ssoPrimaryClassName?: string
}

export function SocialLoginButtons({
  githubAvailable,
  googleAvailable,
  callbackURL = '/workspace',
  isProduction,
  showSSOOption,
  ssoPrimaryClassName,
}: SocialLoginButtonsProps) {
  const [isGithubLoading, setIsGithubLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Set mounted state to true on client-side
  useEffect(() => {
    setMounted(true)
  }, [])

  // Only render on the client side to avoid hydration errors
  if (!mounted) return null

  const ssoEnabled = useMemo(() => {
    if (typeof window === 'undefined') return false
    if (typeof showSSOOption === 'boolean') return showSSOOption
    return isTruthy(getEnv('NEXT_PUBLIC_SSO_ENABLED'))
  }, [showSSOOption])

  async function signInWithGithub() {
    if (!githubAvailable) return

    setIsGithubLoading(true)
    try {
      await client.signIn.social({ provider: 'github', callbackURL })
    } catch (err: any) {
      let errorMessage = 'Failed to sign in with GitHub'

      if (err.message?.includes('account exists')) {
        errorMessage = 'An account with this email already exists. Please sign in instead.'
      } else if (err.message?.includes('cancelled')) {
        errorMessage = 'GitHub sign in was cancelled. Please try again.'
      } else if (err.message?.includes('network')) {
        errorMessage = 'Network error. Please check your connection and try again.'
      } else if (err.message?.includes('rate limit')) {
        errorMessage = 'Too many attempts. Please try again later.'
      }
    } finally {
      setIsGithubLoading(false)
    }
  }

  async function signInWithGoogle() {
    if (!googleAvailable) return

    setIsGoogleLoading(true)
    try {
      await client.signIn.social({ provider: 'google', callbackURL })
    } catch (err: any) {
      let errorMessage = 'Failed to sign in with Google'

      if (err.message?.includes('account exists')) {
        errorMessage = 'An account with this email already exists. Please sign in instead.'
      } else if (err.message?.includes('cancelled')) {
        errorMessage = 'Google sign in was cancelled. Please try again.'
      } else if (err.message?.includes('network')) {
        errorMessage = 'Network error. Please check your connection and try again.'
      } else if (err.message?.includes('rate limit')) {
        errorMessage = 'Too many attempts. Please try again later.'
      }
    } finally {
      setIsGoogleLoading(false)
    }
  }

  const githubButton = (
    <Button
      type='button'
      variant='outline'
      className='w-full rounded-[10px] shadow-sm hover:bg-gray-50'
      disabled={!githubAvailable || isGithubLoading}
      onClick={signInWithGithub}
    >
      <GithubIcon className='!h-[18px] !w-[18px] mr-1' />
      {isGithubLoading ? 'Connecting...' : 'GitHub'}
    </Button>
  )

  const googleButton = (
    <Button
      type='button'
      variant='outline'
      className='w-full rounded-[10px] shadow-sm hover:bg-gray-50'
      disabled={!googleAvailable || isGoogleLoading}
      onClick={signInWithGoogle}
    >
      <GoogleIcon className='!h-[18px] !w-[18px] mr-1' />
      {isGoogleLoading ? 'Connecting...' : 'Google'}
    </Button>
  )

  const hasAnyOAuthProvider = githubAvailable || googleAvailable

  if (!hasAnyOAuthProvider && !ssoEnabled) {
    return null
  }

  return (
    <div className={`${inter.className} grid gap-3 font-light`}>
      {googleAvailable && googleButton}
      {githubAvailable && githubButton}
      {ssoEnabled && (
        <SSOLoginButton
          callbackURL={callbackURL}
          variant={hasAnyOAuthProvider ? 'outline' : 'primary'}
          primaryClassName={ssoPrimaryClassName}
        />
      )}
    </div>
  )
}
