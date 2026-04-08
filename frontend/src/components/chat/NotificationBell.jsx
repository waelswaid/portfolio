import { useState, useRef, useEffect } from 'react'

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const seconds = Math.floor((Date.now() - new Date(dateStr)) / 1000)
  if (isNaN(seconds) || seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function notificationText(notification, resolveEmail) {
  const { type, payload } = notification
  if (type === 'friend_request_received') {
    const email = payload.email || resolveEmail(payload.from_user)
    return { email, action: 'sent you a friend request', color: 'text-cyan-400' }
  }
  if (type === 'friend_request_accepted') {
    const email = payload.email || resolveEmail(payload.user_id)
    return { email, action: 'accepted your friend request', color: 'text-emerald-400' }
  }
  return { email: 'Unknown', action: 'sent a notification', color: 'text-slate-400' }
}

export default function NotificationBell({ notifications, onMarkRead, resolveEmail }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    function handleEscape(e) {
      if (e.key === 'Escape') setOpen(false)
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [open])

  const count = notifications.length

  function handleMarkAllRead() {
    if (count === 0) return
    onMarkRead(notifications.map((n) => n.id))
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((prev) => !prev)}
        aria-label={count > 0 ? `${count} unread notifications` : 'Notifications'}
        aria-haspopup="true"
        aria-expanded={open}
        className="relative p-2 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-slate-700/50"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
        </svg>
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full px-1">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-slate-800 border border-slate-700/50 rounded-xl shadow-xl shadow-black/30 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50">
            <span className="text-sm font-semibold text-white">Notifications</span>
            {count > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {count === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm text-slate-500">No notifications</p>
              </div>
            ) : (
              notifications.map((n) => {
                const { email, action, color } = notificationText(n, resolveEmail)
                return (
                  <div key={n.id} className="px-4 py-3 hover:bg-slate-700/30 transition-colors border-b border-slate-700/30 last:border-0">
                    <p className="text-sm text-slate-300">
                      <span className={`font-medium ${color}`}>{email}</span>{' '}
                      {action}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">{timeAgo(n.created_at)}</p>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
