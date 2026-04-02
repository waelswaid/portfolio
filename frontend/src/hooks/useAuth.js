import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function useAuth({ requireAdmin = false } = {}) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      navigate('/login')
      return
    }

    fetch('/api/users/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) {
          localStorage.removeItem('access_token')
          navigate('/login')
          return null
        }
        return res.json()
      })
      .then((data) => {
        if (data) {
          if (requireAdmin && data.role !== 'admin') {
            navigate('/')
            return
          }
          setUser(data)
        }
      })
      .finally(() => setLoading(false))
  }, [navigate, requireAdmin])

  return { user, setUser, loading }
}
