import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import parseError from '../utils/parseError'

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
        <div className="w-full max-w-md bg-gray-800/60 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-8 text-center card-glow">
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 px-4">
      <div className="w-full max-w-md bg-gray-800/60 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-8 card-glow">
        <h1 className="text-2xl font-bold text-gray-100 text-center mb-2">
          Accept invitation
        </h1>
        <p className="text-sm text-gray-400 text-center mb-8">
          Complete your account setup.
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 text-red-400 ring-1 ring-red-500/20 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20 text-sm">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="first-name" className="block text-sm font-medium text-gray-300 mb-1">
              First name
            </label>
            <input
              id="first-name"
              type="text"
              required
              maxLength={255}
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-700/50 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 transition-colors"
              placeholder="First name"
            />
          </div>

          <div>
            <label htmlFor="last-name" className="block text-sm font-medium text-gray-300 mb-1">
              Last name
            </label>
            <input
              id="last-name"
              type="text"
              required
              maxLength={255}
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-700/50 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 transition-colors"
              placeholder="Last name"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              maxLength={128}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-700/50 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 transition-colors"
              placeholder="Min 8 characters"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-blue-500/20"
          >
            {loading ? 'Activating...' : 'Activate account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-400">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
