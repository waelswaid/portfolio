import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import parseError from '../utils/parseError'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const codeFromUrl = searchParams.get('code') || ''
  const [code, setCode] = useState(codeFromUrl)
  const [newPassword, setNewPassword] = useState('')
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
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, new_password: newPassword }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(parseError(data, 'Reset failed'))
        return
      }

      setSuccess('Password updated! Redirecting to sign in...')
      setTimeout(() => navigate('/login'), 2000)
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
          Set new password
        </h1>
        <p className="text-sm text-gray-400 text-center mb-8">
          {codeFromUrl ? 'Enter your new password.' : 'Enter the reset code from your email and your new password.'}
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
          {!codeFromUrl && (
            <div>
              <label htmlFor="code" className="block text-sm font-medium text-gray-300 mb-1">
                Reset code
              </label>
              <input
                id="code"
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-700/50 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 transition-colors"
                placeholder="Paste the code from your email"
              />
            </div>
          )}

          <div>
            <label htmlFor="new-password" className="block text-sm font-medium text-gray-300 mb-1">
              New password
            </label>
            <input
              id="new-password"
              type="password"
              required
              minLength={8}
              maxLength={128}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-700/50 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 transition-colors"
              placeholder="Min 8 characters"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-blue-500/20"
          >
            {loading ? 'Resetting...' : 'Reset password'}
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
