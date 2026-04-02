import { useState, useEffect } from 'react'
import useAuth from '../hooks/useAuth'
import Layout from '../components/Layout'
import parseError from '../utils/parseError'

export default function Profile() {
  const { user, setUser, loading } = useAuth()

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileError, setProfileError] = useState('')
  const [profileSuccess, setProfileSuccess] = useState('')

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [pwLoading, setPwLoading] = useState(false)
  const [pwError, setPwError] = useState('')
  const [pwSuccess, setPwSuccess] = useState('')

  const [deletePassword, setDeletePassword] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const token = localStorage.getItem('access_token')

  useEffect(() => {
    if (user) {
      setFirstName(user.first_name)
      setLastName(user.last_name)
    }
  }, [user])

  async function handleProfileSubmit(e) {
    e.preventDefault()
    setProfileError('')
    setProfileSuccess('')
    setProfileLoading(true)

    try {
      const res = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ first_name: firstName, last_name: lastName }),
      })

      const data = await res.json()

      if (!res.ok) {
        setProfileError(parseError(data, 'Update failed'))
        return
      }

      setUser(data)
      setProfileSuccess('Profile updated!')
    } catch {
      setProfileError('Network error. Please try again.')
    } finally {
      setProfileLoading(false)
    }
  }

  async function handlePasswordSubmit(e) {
    e.preventDefault()
    setPwError('')
    setPwSuccess('')
    setPwLoading(true)

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
      })

      const data = await res.json()

      if (!res.ok) {
        setPwError(parseError(data, 'Password change failed'))
        return
      }

      setPwSuccess('Password changed!')
      setCurrentPassword('')
      setNewPassword('')
    } catch {
      setPwError('Network error. Please try again.')
    } finally {
      setPwLoading(false)
    }
  }

  async function handleDeleteAccount(e) {
    e.preventDefault()
    setDeleteError('')
    setDeleteLoading(true)

    try {
      const res = await fetch('/api/users/me', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ password: deletePassword }),
      })

      if (!res.ok) {
        const data = await res.json()
        setDeleteError(parseError(data, 'Account deletion failed'))
        return
      }

      localStorage.removeItem('access_token')
      window.location.href = '/login'
    } catch {
      setDeleteError('Network error. Please try again.')
    } finally {
      setDeleteLoading(false)
    }
  }

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
    <Layout user={user} title="Edit Profile" backTo="/">
      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Edit Name */}
        <div className="bg-gray-800/60 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-8 card-glow">
          <h2 className="text-xl font-bold text-gray-100 mb-6">Edit Profile</h2>

          {profileError && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 text-red-400 ring-1 ring-red-500/20 text-sm">{profileError}</div>
          )}
          {profileSuccess && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20 text-sm">{profileSuccess}</div>
          )}

          <form onSubmit={handleProfileSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full px-4 py-2.5 bg-gray-900/30 border border-gray-800 rounded-lg text-gray-500 cursor-not-allowed"
              />
            </div>

            <div>
              <label htmlFor="first-name" className="block text-sm font-medium text-gray-300 mb-1">
                First name
              </label>
              <input
                id="first-name"
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-700/50 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 transition-colors"
              />
            </div>

            <div>
              <label htmlFor="last-name" className="block text-sm font-medium text-gray-300 mb-1">
                Last name
              </label>
              <input
                id="last-name"
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-700/50 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={profileLoading}
              className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-blue-500/20"
            >
              {profileLoading ? 'Saving...' : 'Save'}
            </button>
          </form>
        </div>

        {/* Change Password */}
        <div className="bg-gray-800/60 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-8 card-glow">
          <h2 className="text-xl font-bold text-gray-100 mb-6">Change Password</h2>

          {pwError && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 text-red-400 ring-1 ring-red-500/20 text-sm">{pwError}</div>
          )}
          {pwSuccess && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20 text-sm">{pwSuccess}</div>
          )}

          <form onSubmit={handlePasswordSubmit} className="space-y-5">
            <div>
              <label htmlFor="current-password" className="block text-sm font-medium text-gray-300 mb-1">
                Current password
              </label>
              <input
                id="current-password"
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-700/50 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 transition-colors"
                placeholder="Enter current password"
              />
            </div>

            <div>
              <label htmlFor="new-password" className="block text-sm font-medium text-gray-300 mb-1">
                New password
              </label>
              <input
                id="new-password"
                type="password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-700/50 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 transition-colors"
                placeholder="Min 8 characters"
              />
            </div>

            <button
              type="submit"
              disabled={pwLoading}
              className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-blue-500/20"
            >
              {pwLoading ? 'Changing...' : 'Change password'}
            </button>
          </form>
        </div>

        {/* Delete Account */}
        <div className="bg-gray-800/60 backdrop-blur-xl rounded-2xl border border-red-500/20 p-8">
          <h2 className="text-xl font-bold text-red-400 mb-2">Delete Account</h2>
          <p className="text-sm text-gray-400 mb-6">
            This action is permanent and cannot be undone. All your data will be erased.
          </p>

          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-6 py-2.5 bg-transparent text-red-400 font-medium rounded-lg border border-red-500/30 hover:bg-red-500/10 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:ring-offset-2 focus:ring-offset-gray-900 transition-colors"
            >
              Delete my account
            </button>
          ) : (
            <>
              {deleteError && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/10 text-red-400 ring-1 ring-red-500/20 text-sm">{deleteError}</div>
              )}

              <form onSubmit={handleDeleteAccount} className="space-y-5">
                <div>
                  <label htmlFor="delete-password" className="block text-sm font-medium text-gray-300 mb-1">
                    Enter your password to confirm
                  </label>
                  <input
                    id="delete-password"
                    type="password"
                    required
                    minLength={8}
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-700/50 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-red-500/50 focus:border-red-500/50 transition-colors"
                    placeholder="Enter your password"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={deleteLoading}
                    className="px-6 py-2.5 bg-red-600 text-white font-medium rounded-lg hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-red-500/20"
                  >
                    {deleteLoading ? 'Deleting...' : 'Permanently delete'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowDeleteConfirm(false)
                      setDeletePassword('')
                      setDeleteError('')
                    }}
                    className="px-6 py-2.5 bg-gray-700/50 text-gray-300 font-medium rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500/50 focus:ring-offset-2 focus:ring-offset-gray-900 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </main>
    </Layout>
  )
}
