import { Link, useLocation } from 'react-router-dom'
import useLogout from '../hooks/useLogout'

export default function Layout({ user, title, backTo, maxWidth = 'max-w-3xl', children }) {
  const logout = useLogout()
  const location = useLocation()

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/chat', label: 'Chat' },
    { to: '/profile', label: 'Profile' },
    ...(user?.role === 'admin' ? [{ to: '/admin', label: 'Admin' }] : []),
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      <header className="bg-gray-900/80 backdrop-blur-md border-b border-gray-800/50">
        <div className={`${maxWidth} mx-auto px-4 py-3 flex items-center justify-between`}>
          <div className="flex items-center gap-4">
            {backTo && (
              <Link to={backTo} className="text-sm text-cyan-400 hover:text-cyan-300 font-medium transition-colors">
                &larr; Back
              </Link>
            )}
            <h1 className="text-lg font-bold text-gray-100">{title}</h1>
          </div>

          <div className="flex items-center gap-1">
            <nav className="hidden md:flex items-center gap-1 mr-3">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    location.pathname === link.to
                      ? 'bg-gray-800 text-white font-medium'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <button
              onClick={logout}
              className="text-sm text-red-400 hover:text-red-300 font-medium transition-colors px-3 py-1.5"
            >
              Sign out
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        <nav className="md:hidden flex border-t border-gray-800/50">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`flex-1 text-center py-2.5 text-xs font-medium transition-colors ${
                location.pathname === link.to
                  ? 'text-cyan-400 border-b-2 border-cyan-400'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </header>

      {children}
    </div>
  )
}
