'use client'

import { type ReactNode, useEffect, useState } from 'react'
import { GithubIcon, GoogleIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { client } from '@/lib/auth-client'
import { SSOLoginButton } from '@/app/(auth)/components/sso-login-button'
import { inter } from '@/app/fonts/inter'

type AuthFlow = 'sign-in' | 'sign-up'

interface SocialLoginButtonsProps {
  githubAvailable: boolean
  googleAvailable: boolean
  ssoEnabled?: boolean
  callbackURL?: string
  isProduction: boolean
  ssoLabel?: string
  children?: ReactNode
  flow?: AuthFlow
}

export function SocialLoginButtons({
  githubAvailable,
  googleAvailable,
  ssoEnabled = false,
  callbackURL = '/workspace',
  isProduction,
  ssoLabel,
  children,
  flow = 'sign-in',
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

  const isSignUpFlow = flow === 'sign-up'

  const buildErrorCallbackUrl = () => {
    const basePath = isSignUpFlow ? '/signup' : '/login'
    const params = new URLSearchParams()
    if (callbackURL) {
      params.set('callbackUrl', callbackURL)
    }
    if (isSignUpFlow) {
      params.set('requestSignUp', 'true')
    }
    return params.size > 0 ? `${basePath}?${params.toString()}` : basePath
  }

  async function signInWithGithub() {
    if (!githubAvailable) return

    setIsGithubLoading(true)
    try {
      await client.signIn.social({
        provider: 'github',
        callbackURL,
        ...(isSignUpFlow
          ? {
              requestSignUp: true,
              newUserCallbackURL: callbackURL,
            }
          : {}),
        errorCallbackURL: buildErrorCallbackUrl(),
      })
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
      await client.signIn.social({
        provider: 'google',
        callbackURL,
        ...(isSignUpFlow
          ? {
              requestSignUp: true,
              newUserCallbackURL: callbackURL,
            }
          : {}),
        errorCallbackURL: buildErrorCallbackUrl(),
      })
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
      variant='outline'
      className='w-full rounded-[10px] shadow-sm hover:bg-gray-50'
      disabled={!googleAvailable || isGoogleLoading}
      onClick={signInWithGoogle}
    >
      <GoogleIcon className='!h-[18px] !w-[18px] mr-1' />
      {isGoogleLoading ? 'Connecting...' : 'Google'}
    </Button>
  )

  const hasAnyOAuthProvider = githubAvailable || googleAvailable || ssoEnabled

  if (!hasAnyOAuthProvider && !children) {
    return null
  }

  return (
    <div className={`${inter.className} grid gap-3 font-light`}>
      {googleAvailable && googleButton}
      {githubAvailable && githubButton}
      {ssoEnabled && (
        <SSOLoginButton
          callbackURL={callbackURL}
          variant='outline'
          label={ssoLabel}
          requestSignUp={isSignUpFlow}
        />
      )}
      {children}
    </div>
  )
}
