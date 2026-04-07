import { useState, useEffect, useCallback } from 'react'
import useAuth from '../hooks/useAuth'
import Layout from '../components/Layout'
import LoadingScreen, { LoadingDots } from '../components/ui/LoadingScreen'
import Card from '../components/ui/Card'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import Alert from '../components/ui/Alert'
import Badge from '../components/ui/Badge'
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

  async function handleAction(userId, key, action) {
    setSuccess('')
    setActionLoading((prev) => ({ ...prev, [key]: true }))
    try {
      await action()
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setActionLoading((prev) => ({ ...prev, [key]: false }))
    }
  }

  async function handleRoleChange(userId, newRole) {
    await handleAction(userId, `${userId}-role`, async () => {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ role: newRole }),
      })
      if (!res.ok) {
        setError(parseError(await res.json(), 'Role update failed'))
        return
      }
      fetchUsers()
    })
  }

  async function handleToggleDisable(userId, currentlyDisabled) {
    await handleAction(userId, `${userId}-disable`, async () => {
      const res = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ is_disabled: !currentlyDisabled }),
      })
      if (!res.ok) {
        setError(parseError(await res.json(), 'Status update failed'))
        return
      }
      fetchUsers()
    })
  }

  async function handleForceReset(userId) {
    await handleAction(userId, `${userId}-reset`, async () => {
      const res = await fetch(`/api/admin/users/${userId}/force-password-reset`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        setError(parseError(await res.json(), 'Force reset failed'))
        return
      }
      setError('')
      setSuccess('Password reset email sent')
    })
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
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
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

  if (authLoading || !currentUser) return <LoadingScreen />

  return (
    <Layout user={currentUser} title="Admin Panel" backTo="/" maxWidth="max-w-5xl">
      <main className="max-w-5xl mx-auto px-4 py-8 animate-fade-in-up">
        <Alert type="error">{error}</Alert>
        <Alert type="success">{success}</Alert>

        {/* Invite User */}
        <Card className="mb-6">
          <h2 className="text-lg font-bold text-gray-100 mb-4">Invite User</h2>
          <Alert type="success">{inviteSuccess}</Alert>
          <form onSubmit={handleInviteUser} className="flex items-end gap-3">
            <div className="flex-1">
              <Input
                id="invite-email"
                label="Email address"
                type="email"
                required
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="user@example.com"
              />
            </div>
            <Button type="submit" disabled={inviteLoading}>
              {inviteLoading ? 'Sending...' : 'Send invite'}
            </Button>
          </form>
        </Card>

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
            <div className="p-8 flex justify-center">
              <LoadingDots />
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
                      <Badge variant={u.role}>{u.role}</Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={u.is_disabled ? 'disabled' : 'active'}>
                        {u.is_disabled ? 'Disabled' : 'Active'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      {u.id !== currentUser.id && (
                        <div className="flex items-center gap-3">
                          <ActionLink
                            onClick={() => handleRoleChange(u.id, u.role === 'admin' ? 'user' : 'admin')}
                            disabled={actionLoading[`${u.id}-role`]}
                            className="text-blue-400 hover:text-blue-300"
                          >
                            Make {u.role === 'admin' ? 'user' : 'admin'}
                          </ActionLink>
                          <ActionLink
                            onClick={() => handleToggleDisable(u.id, u.is_disabled)}
                            disabled={actionLoading[`${u.id}-disable`]}
                            className={u.is_disabled ? 'text-emerald-400 hover:text-emerald-300' : 'text-amber-400 hover:text-amber-300'}
                          >
                            {u.is_disabled ? 'Enable' : 'Disable'}
                          </ActionLink>
                          <ActionLink
                            onClick={() => handleForceReset(u.id)}
                            disabled={actionLoading[`${u.id}-reset`]}
                            className="text-gray-400 hover:text-gray-300"
                          >
                            Reset password
                          </ActionLink>
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
          <Button variant="secondary" onClick={() => setSkip(Math.max(0, skip - limit))} disabled={skip === 0}>
            Previous
          </Button>
          <span className="text-sm text-gray-400">
            Showing {skip + 1}–{skip + users.length}
          </span>
          <Button variant="secondary" onClick={() => setSkip(skip + limit)} disabled={users.length < limit}>
            Next
          </Button>
        </div>
      </main>
    </Layout>
  )
}

function ActionLink({ onClick, disabled, className, children }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`text-sm font-medium disabled:opacity-50 transition-colors ${className}`}
    >
      {children}
    </button>
  )
}
