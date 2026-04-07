import { useState } from 'react'
import { Link } from 'react-router-dom'
import parseError from '../utils/parseError'
import AuthLayout from '../components/ui/AuthLayout'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import Alert from '../components/ui/Alert'

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
    <AuthLayout title="Resend verification email" subtitle="Enter your email and we'll send a new verification link.">
      <Alert type="error">{error}</Alert>
      <Alert type="success">{success}</Alert>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          id="email"
          label="Email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />

        <Button type="submit" disabled={loading} full>
          {loading ? 'Sending...' : 'Send verification email'}
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
