import { Link } from 'react-router-dom'
import useAuth from '../hooks/useAuth'
import Layout from '../components/Layout'

export default function Home() {
  const { user, loading } = useAuth()

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

  return (
    <Layout user={user} title="Dashboard">
      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-gray-800/60 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-8 card-glow">
          <h2 className="text-xl font-bold text-gray-100 mb-6">Your Profile</h2>

          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Name</p>
              <p className="text-gray-200 font-medium">{user.first_name} {user.last_name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="text-gray-200 font-medium">{user.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">User ID</p>
              <p className="text-gray-400 font-mono text-sm">{user.id}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Account created</p>
              <p className="text-gray-200 font-medium">
                {new Date(user.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/profile"
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-500 transition-colors shadow-lg shadow-blue-500/20"
            >
              Edit profile
            </Link>
            <Link
              to="/chat"
              className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-500/20"
            >
              Chat
            </Link>
            {user.role === 'admin' && (
              <Link
                to="/admin"
                className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-500 transition-colors shadow-lg shadow-purple-500/20"
              >
                Admin panel
              </Link>
            )}
          </div>
        </div>
      </main>
    </Layout>
  )
}
