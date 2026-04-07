import { useState, useEffect, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import parseError from '../utils/parseError'
import AuthLayout from '../components/ui/AuthLayout'
import Button from '../components/ui/Button'

export default function VerifyEmail() {
  const [searchParams] = useSearchParams()
  const code = searchParams.get('code')
  const [status, setStatus] = useState(code ? 'loading' : 'error')
  const [error, setError] = useState(code ? '' : 'No verification code provided.')
  const calledRef = useRef(false)

  useEffect(() => {
    if (!code || calledRef.current) return
    calledRef.current = true

    fetch(`/api/auth/verify-email?code=${encodeURIComponent(code)}`)
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (!ok) {
          setError(parseError(data, 'Verification failed'))
          setStatus('error')
        } else {
          setStatus('success')
        }
      })
      .catch(() => {
        setError('Network error. Please try again.')
        setStatus('error')
      })
  }, [code])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 px-4">
      <div className="w-full max-w-md bg-gray-800/60 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-8 text-center card-glow animate-fade-in-up">
        {status === 'loading' && (
          <>
            <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-400">Verifying your email...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <StatusIcon type="success" />
            <h1 className="text-2xl font-bold text-gray-100 mb-2">Email verified!</h1>
            <p className="text-sm text-gray-400 mb-6">
              Your email has been verified. You can now sign in.
            </p>
            <Link to="/login">
              <Button>Sign in</Button>
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <StatusIcon type="error" />
            <h1 className="text-2xl font-bold text-gray-100 mb-2">Verification failed</h1>
            <div className="mb-6 p-3 rounded-lg bg-red-500/10 text-red-400 ring-1 ring-red-500/20 text-sm">
              {error}
            </div>
            <Link to="/resend-verification" className="text-blue-400 hover:text-blue-300 font-medium text-sm transition-colors">
              Resend verification email
            </Link>
          </>
        )}
      </div>
    </div>
  )
}

function StatusIcon({ type }) {
  const isSuccess = type === 'success'
  return (
    <div className={`w-14 h-14 rounded-full ${isSuccess ? 'bg-emerald-500/10 ring-1 ring-emerald-500/20' : 'bg-red-500/10 ring-1 ring-red-500/20'} flex items-center justify-center mx-auto mb-4`}>
      <svg className={`w-7 h-7 ${isSuccess ? 'text-emerald-400' : 'text-red-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        {isSuccess
          ? <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          : <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
        }
      </svg>
    </div>
  )
}
