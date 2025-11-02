import LoginForm from '@/app/(auth)/login/login-form'

// Force dynamic rendering to avoid prerender errors with search params
export const dynamic = 'force-dynamic'

export default function LoginPage() {
  return <LoginForm />
}
