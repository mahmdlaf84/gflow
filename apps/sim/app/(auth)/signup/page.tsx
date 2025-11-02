import { env, isTruthy } from '@/lib/env'
import SignupForm from '@/app/(auth)/signup/signup-form'

export const dynamic = 'force-dynamic'

export default function SignupPage() {
  if (isTruthy(env.DISABLE_REGISTRATION)) {
    return <div>Registration is disabled, please contact your admin.</div>
  }

  return <SignupForm />
}
