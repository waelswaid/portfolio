import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import parseError from '../utils/parseError'
import AuthLayout from '../components/ui/AuthLayout'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import Alert from '../components/ui/Alert'

export default function AcceptInvite() {
  const [searchParams] = useSearchParams()
  const code = searchParams.get('code') || ''
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/accept-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, first_name: firstName, last_name: lastName, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(parseError(data, 'Failed to accept invitation'))
        return
      }

      setSuccess('Account activated! Redirecting to sign in...')
      setTimeout(() => navigate('/login'), 2000)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!code) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 px-4">
        <div className="w-full max-w-md bg-gray-800/60 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-8 text-center card-glow animate-fade-in-up">
          <div className="w-14 h-14 rounded-full bg-red-500/10 ring-1 ring-red-500/20 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-100 mb-4">Invalid invitation link</h1>
          <p className="text-sm text-gray-400 mb-6">
            This link is missing the invitation code. Please check the link in your email.
          </p>
          <Link to="/login" className="text-blue-400 hover:text-blue-300 font-medium text-sm transition-colors">
            Back to sign in
          </Link>
        </div>
      </div>
    )
  }

  return (
    <AuthLayout title="Accept invitation" subtitle="Complete your account setup.">
      <Alert type="error">{error}</Alert>
      <Alert type="success">{success}</Alert>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          id="first-name"
          label="First name"
          type="text"
          required
          maxLength={255}
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          placeholder="First name"
        />

        <Input
          id="last-name"
          label="Last name"
          type="text"
          required
          maxLength={255}
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          placeholder="Last name"
        />

        <Input
          id="password"
          label="Password"
          type="password"
          required
          minLength={8}
          maxLength={128}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Min 8 characters"
        />

        <Button type="submit" disabled={loading} full>
          {loading ? 'Activating...' : 'Activate account'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-400">
        Already have an account?{' '}
        <Link to="/login" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  )
}
