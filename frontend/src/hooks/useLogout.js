import { useNavigate } from 'react-router-dom'

export default function useLogout() {
  const navigate = useNavigate()

  return function logout() {
    const token = localStorage.getItem('access_token')
    fetch('/api/auth/logout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }).finally(() => {
      localStorage.removeItem('access_token')
      navigate('/login')
    })
  }
}
