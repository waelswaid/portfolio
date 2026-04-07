import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import parseError from '../utils/parseError'
import AuthLayout from '../components/ui/AuthLayout'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import Alert from '../components/ui/Alert'

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
    <AuthLayout
      title="Set new password"
      subtitle={codeFromUrl ? 'Enter your new password.' : 'Enter the reset code from your email and your new password.'}
    >
      <Alert type="error">{error}</Alert>
      <Alert type="success">{success}</Alert>

      <form onSubmit={handleSubmit} className="space-y-5">
        {!codeFromUrl && (
          <Input
            id="code"
            label="Reset code"
            type="text"
            required
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Paste the code from your email"
          />
        )}

        <Input
          id="new-password"
          label="New password"
          type="password"
          required
          minLength={8}
          maxLength={128}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="Min 8 characters"
        />

        <Button type="submit" disabled={loading} full>
          {loading ? 'Resetting...' : 'Reset password'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-400">
        <Link to="/login" className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors">
          Back to sign in
        </Link>
      </p>
    </AuthLayout>
  )
}
