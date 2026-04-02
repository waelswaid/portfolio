import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import parseError from '../utils/parseError'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(parseError(data, 'Login failed'))
        return
      }

      localStorage.setItem('access_token', data.access_token)
      navigate('/')
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 px-4">
      <div className="w-full max-w-md bg-gray-800/60 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-8 card-glow">
        <h1 className="text-2xl font-bold text-gray-100 text-center mb-8">
          Sign in to your account
        </h1>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 text-red-400 ring-1 ring-red-500/20 text-sm">
            {error}
            {error.toLowerCase().includes('verif') && (
              <div className="mt-2">
                <Link to="/resend-verification" className="text-red-300 underline hover:text-red-200 font-medium">
                  Resend verification email
                </Link>
              </div>
            )}
          </div>
        )}

        <a
          href="/api/auth/google"
          className="w-full flex items-center justify-center gap-3 py-2.5 bg-gray-900/50 border border-gray-700/50 rounded-lg text-gray-200 font-medium hover:bg-gray-700/50 transition-colors"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Continue with Google
        </a>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-700/50"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-gray-800/60 text-gray-500">or</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-700/50 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 transition-colors"
              placeholder="you@example.com"
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-700/50 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 transition-colors"
              placeholder="Enter your password"
            />
          </div>

          <div className="flex justify-end">
            <Link to="/forgot-password" className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-blue-500/20"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-400">
          Don't have an account?{' '}
          <Link to="/register" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
            Create one
          </Link>
        </p>
      </div>
    </div>
  )
}
