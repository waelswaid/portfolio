import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import ForgotPassword from './pages/ForgotPassword.jsx'
import ResetPassword from './pages/ResetPassword.jsx'
import VerifyEmail from './pages/VerifyEmail.jsx'
import ResendVerification from './pages/ResendVerification.jsx'
import Home from './pages/Home.jsx'
import Profile from './pages/Profile.jsx'
import Admin from './pages/Admin.jsx'
import AcceptInvite from './pages/AcceptInvite.jsx'
import Chat from './pages/Chat.jsx'
import OAuthCallback from './pages/OAuthCallback.jsx'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/resend-verification" element={<ResendVerification />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/accept-invite" element={<AcceptInvite />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="/chat" element={<Chat />} />
      <Route path="/oauth-callback" element={<OAuthCallback />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default App
