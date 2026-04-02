import { useState, useEffect, useCallback } from 'react'
import useAuth from '../hooks/useAuth'
import Layout from '../components/Layout'
import parseError from '../utils/parseError'

export default function Admin() {
  const { user: currentUser, loading: authLoading } = useAuth({ requireAdmin: true })
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [skip, setSkip] = useState(0)
  const limit = 50

  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteSuccess, setInviteSuccess] = useState('')
  const [actionLoading, setActionLoading] = useState({})

  const token = localStorage.getItem('access_token')

  const fetchUsers = useCallback(() => {
    setError('')
    setLoading(true)

    const params = new URLSearchParams({ skip: String(skip), limit: String(limit) })
    if (roleFilter) params.set('role', roleFilter)

    fetch(`/api/admin/users/?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch users')
        return res.json()
      })
      .then((data) => setUsers(data))
      .catch(() => setError('Failed to load users.'))
      .finally(() => setLoading(false))
  }, [token, skip, roleFilter])

  useEffect(() => {
    if (currentUser) fetchUsers()
  }, [currentUser, fetchUsers])

  async function handleRoleChange(userId, newRole) {
    setSuccess('')
    const key = `${userId}-role`
    setActionLoading((prev) => ({ ...prev, [key]: true }))
    try {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: newRole }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(parseError(data, 'Role update failed'))
        return
      }

      fetchUsers()
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setActionLoading((prev) => ({ ...prev, [key]: false }))
    }
  }

  async function handleToggleDisable(userId, currentlyDisabled) {
    setSuccess('')
    const key = `${userId}-disable`
    setActionLoading((prev) => ({ ...prev, [key]: true }))
    try {
      const res = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ is_disabled: !currentlyDisabled }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(parseError(data, 'Status update failed'))
        return
      }

      fetchUsers()
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setActionLoading((prev) => ({ ...prev, [key]: false }))
    }
  }

  async function handleForceReset(userId) {
    setSuccess('')
    const key = `${userId}-reset`
    setActionLoading((prev) => ({ ...prev, [key]: true }))
    try {
      const res = await fetch(`/api/admin/users/${userId}/force-password-reset`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) {
        const data = await res.json()
        setError(parseError(data, 'Force reset failed'))
        return
      }

      setError('')
      setSuccess('Password reset email sent')
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setActionLoading((prev) => ({ ...prev, [key]: false }))
    }
  }

  async function handleInviteUser(e) {
    e.preventDefault()
    setError('')
    setInviteSuccess('')
    setSuccess('')
    setInviteLoading(true)
    try {
      const res = await fetch('/api/admin/users/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email: inviteEmail }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(parseError(data, 'Invite failed'))
        return
      }

      setInviteSuccess('Invitation sent!')
      setInviteEmail('')
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setInviteLoading(false)
    }
  }

  if (authLoading || !currentUser) {
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
    <Layout user={currentUser} title="Admin Panel" backTo="/" maxWidth="max-w-5xl">
      <main className="max-w-5xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 text-red-400 ring-1 ring-red-500/20 text-sm">{error}</div>
        )}

        {success && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20 text-sm">{success}</div>
        )}

        {/* Invite User */}
        <div className="mb-6 bg-gray-800/60 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-6 card-glow">
          <h2 className="text-lg font-bold text-gray-100 mb-4">Invite User</h2>
          {inviteSuccess && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20 text-sm">{inviteSuccess}</div>
          )}
          <form onSubmit={handleInviteUser} className="flex items-end gap-3">
            <div className="flex-1">
              <label htmlFor="invite-email" className="block text-sm font-medium text-gray-300 mb-1">
                Email address
              </label>
              <input
                id="invite-email"
                type="email"
                required
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-700/50 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 transition-colors"
                placeholder="user@example.com"
              />
            </div>
            <button
              type="submit"
              disabled={inviteLoading}
              className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-blue-500/20"
            >
              {inviteLoading ? 'Sending...' : 'Send invite'}
            </button>
          </form>
        </div>

        {/* Filter */}
        <div className="mb-6 flex items-center gap-3">
          <label htmlFor="role-filter" className="text-sm font-medium text-gray-300">
            Filter by role:
          </label>
          <select
            id="role-filter"
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value)
              setSkip(0)
            }}
            className="px-3 py-2 bg-gray-800/60 border border-gray-700/50 rounded-lg text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 text-sm transition-colors"
          >
            <option value="">All</option>
            <option value="user">Users</option>
            <option value="admin">Admins</option>
          </select>
        </div>

        {/* User Table */}
        <div className="bg-gray-800/60 backdrop-blur-xl rounded-2xl border border-gray-700/50 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="flex items-center justify-center gap-3">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" />
              </div>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700/50 bg-gray-900/40">
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Name</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Email</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Role</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-gray-700/30 last:border-0 hover:bg-gray-700/20 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-200">{u.first_name} {u.last_name}</td>
                    <td className="px-6 py-4 text-sm text-gray-400">{u.email}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          u.role === 'admin'
                            ? 'bg-purple-500/10 text-purple-400 ring-1 ring-purple-500/20'
                            : 'bg-gray-500/10 text-gray-400 ring-1 ring-gray-500/20'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          u.is_disabled
                            ? 'bg-red-500/10 text-red-400 ring-1 ring-red-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20'
                        }`}
                      >
                        {u.is_disabled ? 'Disabled' : 'Active'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {u.id !== currentUser.id && (
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() =>
                              handleRoleChange(u.id, u.role === 'admin' ? 'user' : 'admin')
                            }
                            disabled={actionLoading[`${u.id}-role`]}
                            className="text-sm text-blue-400 hover:text-blue-300 font-medium disabled:opacity-50 transition-colors"
                          >
                            Make {u.role === 'admin' ? 'user' : 'admin'}
                          </button>
                          <button
                            onClick={() => handleToggleDisable(u.id, u.is_disabled)}
                            disabled={actionLoading[`${u.id}-disable`]}
                            className={`text-sm font-medium disabled:opacity-50 transition-colors ${
                              u.is_disabled
                                ? 'text-emerald-400 hover:text-emerald-300'
                                : 'text-amber-400 hover:text-amber-300'
                            }`}
                          >
                            {u.is_disabled ? 'Enable' : 'Disable'}
                          </button>
                          <button
                            onClick={() => handleForceReset(u.id)}
                            disabled={actionLoading[`${u.id}-reset`]}
                            className="text-sm text-gray-400 hover:text-gray-300 font-medium disabled:opacity-50 transition-colors"
                          >
                            Reset password
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500 text-sm">
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        <div className="mt-4 flex items-center justify-between">
          <button
            onClick={() => setSkip(Math.max(0, skip - limit))}
            disabled={skip === 0}
            className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-800/60 border border-gray-700/50 rounded-lg hover:bg-gray-700/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <span className="text-sm text-gray-400">
            Showing {skip + 1}–{skip + users.length}
          </span>
          <button
            onClick={() => setSkip(skip + limit)}
            disabled={users.length < limit}
            className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-800/60 border border-gray-700/50 rounded-lg hover:bg-gray-700/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      </main>
    </Layout>
  )
}
