'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { getEnv, isTruthy } from '@/lib/env'
import { cn } from '@/lib/utils'

interface SSOLoginButtonProps {
  callbackURL?: string
  className?: string
  // Visual variant for button styling and placement contexts
  // - 'primary' matches the main auth action button style
  // - 'outline' matches social provider buttons
  variant?: 'primary' | 'outline'
  // Optional class used when variant is primary to match brand/gradient
  primaryClassName?: string
  label?: string
  requestSignUp?: boolean
  enabled?: boolean
}

export function SSOLoginButton({
  callbackURL,
  className,
  variant = 'outline',
  primaryClassName,
  label = 'Sign in with SSO',
  requestSignUp = false,
  enabled,
}: SSOLoginButtonProps) {
  const router = useRouter()

  const resolvedEnabled =
    typeof enabled === 'boolean'
      ? enabled
      : isTruthy(getEnv('NEXT_PUBLIC_SSO_ENABLED') ?? getEnv('SSO_ENABLED'))

  if (!resolvedEnabled) {
    return null
  }

  const handleSSOClick = () => {
    const params = new URLSearchParams()
    if (callbackURL) {
      params.set('callbackUrl', callbackURL)
    }
    if (requestSignUp) {
      params.set('requestSignUp', 'true')
    }

    const query = params.toString()
    const ssoUrl = `/sso${query ? `?${query}` : ''}`
    router.push(ssoUrl)
  }

  const primaryBtnClasses = cn(
    primaryClassName || 'auth-button-gradient',
    'flex w-full items-center justify-center gap-2 rounded-[10px] border font-medium text-[15px] text-white transition-all duration-200'
  )

  const outlineBtnClasses = cn('w-full rounded-[10px] shadow-sm hover:bg-gray-50')

  return (
    <Button
      type='button'
      onClick={handleSSOClick}
      variant={variant === 'outline' ? 'outline' : undefined}
      className={cn(variant === 'outline' ? outlineBtnClasses : primaryBtnClasses, className)}
    >
      {label}
    </Button>
  )
}
