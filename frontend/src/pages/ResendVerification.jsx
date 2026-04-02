import { useState } from 'react'
import { Link } from 'react-router-dom'
import parseError from '../utils/parseError'

export default function ResendVerification() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(parseError(data, 'Something went wrong'))
        return
      }

      setSuccess('Verification email sent! Check your inbox.')
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 px-4">
      <div className="w-full max-w-md bg-gray-800/60 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-8 card-glow">
        <h1 className="text-2xl font-bold text-gray-100 text-center mb-2">
          Resend verification email
        </h1>
        <p className="text-sm text-gray-400 text-center mb-8">
          Enter your email and we'll send a new verification link.
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

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-blue-500/20"
          >
            {loading ? 'Sending...' : 'Send verification email'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-400">
          <Link to="/login" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
