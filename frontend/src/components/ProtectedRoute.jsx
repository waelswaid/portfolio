import useAuth from '../hooks/useAuth'
import LoadingScreen from './ui/LoadingScreen'

export default function ProtectedRoute({ children, requireAdmin = false }) {
  const { user, loading } = useAuth({ requireAdmin })

  if (loading || !user) return <LoadingScreen />

  return typeof children === 'function' ? children({ user }) : children
}
