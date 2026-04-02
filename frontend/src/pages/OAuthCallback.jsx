import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

export default function OAuthCallback() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  useEffect(() => {
    const token = searchParams.get('token')
    if (token) {
      localStorage.setItem('access_token', token)
      navigate('/', { replace: true })
    } else {
      navigate('/login', { replace: true })
    }
  }, [searchParams, navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      <p className="text-gray-400">Signing you in...</p>
    </div>
  )
}
