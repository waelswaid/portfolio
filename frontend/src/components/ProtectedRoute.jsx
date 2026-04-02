import useAuth from '../hooks/useAuth'

export default function ProtectedRoute({ children, requireAdmin = false }) {
  const { user, loading } = useAuth({ requireAdmin })

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" />
        </div>
      </div>
    )
  }

  return typeof children === 'function' ? children({ user }) : children
}
