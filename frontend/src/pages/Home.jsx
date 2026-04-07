import { Link } from 'react-router-dom'
import useAuth from '../hooks/useAuth'
import Layout from '../components/Layout'
import LoadingScreen from '../components/ui/LoadingScreen'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'

export default function Home() {
  const { user, loading } = useAuth()

  if (loading || !user) return <LoadingScreen />

  return (
    <Layout user={user} title="Dashboard">
      <main className="max-w-3xl mx-auto px-4 py-8 animate-fade-in-up">
        <Card>
          <h2 className="text-xl font-bold text-gray-100 mb-6">Your Profile</h2>

          <div className="space-y-4">
            <ProfileField label="Name" value={`${user.first_name} ${user.last_name}`} />
            <ProfileField label="Email" value={user.email} />
            <ProfileField label="User ID" value={user.id} mono />
            <ProfileField
              label="Account created"
              value={new Date(user.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            />
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/profile">
              <Button>Edit profile</Button>
            </Link>
            <Link to="/chat">
              <Button variant="emerald">Chat</Button>
            </Link>
            {user.role === 'admin' && (
              <Link to="/admin">
                <Button variant="purple">Admin panel</Button>
              </Link>
            )}
          </div>
        </Card>
      </main>
    </Layout>
  )
}

function ProfileField({ label, value, mono }) {
  return (
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`font-medium ${mono ? 'text-gray-400 font-mono text-sm' : 'text-gray-200'}`}>
        {value}
      </p>
    </div>
  )
}
