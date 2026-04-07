import { useState, useEffect } from 'react'
import useAuth from '../hooks/useAuth'
import Layout from '../components/Layout'
import LoadingScreen from '../components/ui/LoadingScreen'
import Card from '../components/ui/Card'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import Alert from '../components/ui/Alert'
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

  if (loading || !user) return <LoadingScreen />

  return (
    <Layout user={user} title="Edit Profile" backTo="/">
      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6 animate-fade-in-up">
        {/* Edit Name */}
        <Card>
          <h2 className="text-xl font-bold text-gray-100 mb-6">Edit Profile</h2>
          <Alert type="error">{profileError}</Alert>
          <Alert type="success">{profileSuccess}</Alert>

          <form onSubmit={handleProfileSubmit} className="space-y-5">
            <Input
              type="email"
              label="Email"
              disabled
              value={user?.email || ''}
            />
            <Input
              id="first-name"
              label="First name"
              type="text"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
            <Input
              id="last-name"
              label="Last name"
              type="text"
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
            <Button type="submit" disabled={profileLoading}>
              {profileLoading ? 'Saving...' : 'Save'}
            </Button>
          </form>
        </Card>

        {/* Change Password */}
        <Card>
          <h2 className="text-xl font-bold text-gray-100 mb-6">Change Password</h2>
          <Alert type="error">{pwError}</Alert>
          <Alert type="success">{pwSuccess}</Alert>

          <form onSubmit={handlePasswordSubmit} className="space-y-5">
            <Input
              id="current-password"
              label="Current password"
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
            />
            <Input
              id="new-password"
              label="New password"
              type="password"
              required
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Min 8 characters"
            />
            <Button type="submit" disabled={pwLoading}>
              {pwLoading ? 'Changing...' : 'Change password'}
            </Button>
          </form>
        </Card>

        {/* Delete Account */}
        <Card danger>
          <h2 className="text-xl font-bold text-red-400 mb-2">Delete Account</h2>
          <p className="text-sm text-gray-400 mb-6">
            This action is permanent and cannot be undone. All your data will be erased.
          </p>

          {!showDeleteConfirm ? (
            <Button variant="ghost" onClick={() => setShowDeleteConfirm(true)}>
              Delete my account
            </Button>
          ) : (
            <>
              <Alert type="error">{deleteError}</Alert>

              <form onSubmit={handleDeleteAccount} className="space-y-5">
                <Input
                  id="delete-password"
                  label="Enter your password to confirm"
                  type="password"
                  required
                  minLength={8}
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="Enter your password"
                />
                <div className="flex gap-3">
                  <Button type="submit" variant="danger" disabled={deleteLoading}>
                    {deleteLoading ? 'Deleting...' : 'Permanently delete'}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setShowDeleteConfirm(false)
                      setDeletePassword('')
                      setDeleteError('')
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </>
          )}
        </Card>
      </main>
    </Layout>
  )
}
