import { useState, useEffect, useRef } from 'react'

let audioCtx = null
function playNotificationSound() {
  try {
    if (!audioCtx) audioCtx = new AudioContext()
    if (audioCtx.state === 'suspended') audioCtx.resume()
    const osc = audioCtx.createOscillator()
    const gain = audioCtx.createGain()
    osc.connect(gain)
    gain.connect(audioCtx.destination)
    osc.frequency.value = 880
    gain.gain.setValueAtTime(0.15, audioCtx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3)
    osc.start(audioCtx.currentTime)
    osc.stop(audioCtx.currentTime + 0.3)
  } catch {}
}

export default function useChatSocket(user) {
  const [onlineUsers, setOnlineUsers] = useState({})
  const [connectionStatus, setConnectionStatus] = useState('connecting')
  const [friendsList, setFriendsList] = useState([])
  const [pendingSent, setPendingSent] = useState([])
  const [pendingReceived, setPendingReceived] = useState([])
  const [messages, setMessages] = useState({})
  const [recentChats, setRecentChats] = useState([])
  const [notifications, setNotifications] = useState([])
  const wsRef = useRef(null)
  const connectionStatusRef = useRef(connectionStatus)
  const emailCache = useRef({})
  const messagesRef = useRef({})
  const notificationsRef = useRef([])
  useEffect(() => {
    connectionStatusRef.current = connectionStatus
  }, [connectionStatus])
  useEffect(() => {
    messagesRef.current = messages
  }, [messages])
  useEffect(() => {
    notificationsRef.current = notifications
  }, [notifications])

  function getDmKey(otherUserId) {
    const a = user.id, b = otherUserId
    return a < b ? `${a}:${b}` : `${b}:${a}`
  }

  useEffect(() => {
    if (!user) return

    let reconnectTimeout
    let intentionalClose = false
    let retryCount = 0

    function connectWs() {
      const token = localStorage.getItem('access_token')
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const ws = new WebSocket(`${protocol}//${window.location.host}/server/ws/?token=${token}`)
      wsRef.current = ws

      ws.onopen = () => {
        retryCount = 0
        setConnectionStatus('connected')
        ws.send(JSON.stringify({ type: 'friend_list' }))
        ws.send(JSON.stringify({ type: 'pending_list' }))
        ws.send(JSON.stringify({ type: 'chat_list' }))
        ws.send(JSON.stringify({ type: 'unread_notifications' }))
      }

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data)

        if (data.type === 'user_list') {
          const users = {}
          data.users.forEach((u) => {
            users[u.user_id] = u.email
            emailCache.current[u.user_id] = u.email
          })
          setOnlineUsers(users)
        } else if (data.type === 'user_joined') {
          setOnlineUsers((prev) => ({ ...prev, [data.user_id]: data.email }))
          emailCache.current[data.user_id] = data.email
        } else if (data.type === 'user_left') {
          setOnlineUsers((prev) => {
            const updated = { ...prev }
            delete updated[data.user_id]
            return updated
          })
          // user left - online status updates via onlineUsers state
        } else if (data.type === 'message') {
          playNotificationSound()
          const dmKey = getDmKey(data.from_id)
          setMessages((prev) => {
            const chat = prev[dmKey] || { history: [], loadingHistory: false, hasMore: true }
            return {
              ...prev,
              [dmKey]: {
                ...chat,
                history: [...chat.history, { message_id: Date.now(), from: data.from, message: data.message, isMine: false, timestamp: new Date().toISOString() }],
              },
            }
          })
        } else if (data.type === 'file_upload') {
          playNotificationSound()
          const dmKey = getDmKey(data.from_id)
          setMessages((prev) => {
            const chat = prev[dmKey] || { history: [], loadingHistory: false, hasMore: true }
            return {
              ...prev,
              [dmKey]: {
                ...chat,
                history: [...chat.history, { message_id: Date.now(), from: data.from, message: data.message, isMine: false, type: 'file_upload', timestamp: new Date().toISOString() }],
              },
            }
          })
        } else if (data.type === 'load_history') {
          const dmKey = data.dm_key
          const incoming = data.messages.map((m) => ({
            message_id: m.message_id,
            from: m.user_id === user.id ? 'You' : (emailCache.current[m.user_id] || m.user_id),
            message: m.message,
            isMine: m.user_id === user.id,
            type: m.type === 'message' ? undefined : m.type,
            timestamp: m.timestamp,
          }))
          setMessages((prev) => {
            const chat = prev[dmKey] || { history: [], loadingHistory: false, hasMore: true }
            const existingIds = new Set(chat.history.map((m) => m.message_id))
            const deduped = incoming.filter((m) => !existingIds.has(m.message_id))
            return {
              ...prev,
              [dmKey]: {
                history: [...deduped, ...chat.history],
                loadingHistory: false,
                hasMore: incoming.length >= 10,
              },
            }
          })
        } else if (data.type === 'chat_list') {
          setRecentChats(data.chats)
          data.chats.forEach((c) => {
            emailCache.current[c.other_user_id] = c.other_user_email
          })
        } else if (data.type === 'friend_list') {
          setFriendsList(data.friends)
        } else if (data.type === 'pending_list') {
          setPendingSent(data.sent)
          setPendingReceived(data.received)
        } else if (data.type === 'friend_request_sent') {
          setPendingSent((prev) => [...prev, { user_id: data.to }])
        } else if (data.type === 'friend_request_received') {
          playNotificationSound()
          setPendingReceived((prev) => [...prev, { user_id: data.from_user, email: data.email }])
          emailCache.current[data.from_user] = data.email
          ws.send(JSON.stringify({ type: 'unread_notifications' }))
        } else if (data.type === 'friend_request_accepted') {
          const friendId = data.user_id || data.from
          if (data.email) emailCache.current[friendId] = data.email
          setFriendsList((prev) => [...prev, { user_id: friendId }])
          setPendingSent((prev) => prev.filter((p) => p.user_id !== friendId))
          setPendingReceived((prev) => prev.filter((p) => p.user_id !== friendId))
          ws.send(JSON.stringify({ type: 'unread_notifications' }))
        } else if (data.type === 'friend_request_declined') {
          const declinedId = data.user_id || data.from
          setPendingSent((prev) => prev.filter((p) => p.user_id !== declinedId))
          setPendingReceived((prev) => prev.filter((p) => p.user_id !== declinedId))
        } else if (data.type === 'friend_removed') {
          setFriendsList((prev) => prev.filter((f) => f.user_id !== data.user_id))
        } else if (data.type === 'unread_notifications') {
          setNotifications(data.notifications ?? [])
        } else if (data.type === 'marked_read') {
          // already removed optimistically in markNotificationsRead
        } else if (data.type?.endsWith('_error')) {
          console.error(`[${data.type}]`, data.message)
        }
      }

      ws.onerror = (err) => {
        console.error('[WebSocket error]', err)
      }

      ws.onclose = () => {
        setConnectionStatus('disconnected')
        if (!intentionalClose) {
          const delay = Math.min(2000 * Math.pow(2, retryCount), 30000)
          retryCount++
          reconnectTimeout = setTimeout(connectWs, delay)
        }
      }
    }

    connectWs()

    return () => {
      intentionalClose = true
      clearTimeout(reconnectTimeout)
      wsRef.current?.close()
    }
  }, [user?.id])

  function sendMessage(to, message) {
    wsRef.current?.send(JSON.stringify({ type: 'message', to, message }))
    const dmKey = getDmKey(to)
    setMessages((prev) => {
      const chat = prev[dmKey] || { history: [], loadingHistory: false, hasMore: true }
      return {
        ...prev,
        [dmKey]: {
          ...chat,
          history: [...chat.history, { message_id: Date.now(), from: 'You', message, isMine: true, timestamp: new Date().toISOString() }],
        },
      }
    })
  }

  function sendFileMessage(to, url) {
    wsRef.current?.send(JSON.stringify({ type: 'file_upload', to, url }))
    const dmKey = getDmKey(to)
    setMessages((prev) => {
      const chat = prev[dmKey] || { history: [], loadingHistory: false, hasMore: true }
      return {
        ...prev,
        [dmKey]: {
          ...chat,
          history: [...chat.history, { message_id: Date.now(), from: 'You', message: url, isMine: true, type: 'file_upload', timestamp: new Date().toISOString() }],
        },
      }
    })
  }

  function loadHistory(otherUserId, force = false) {
    const dmKey = getDmKey(otherUserId)
    const chat = messagesRef.current[dmKey]
    if (chat?.loadingHistory) return
    if (!force && chat?.history?.length > 0) return

    const payload = { type: 'load_history', dm_key: dmKey }
    const oldestId = chat?.history?.[0]?.message_id
    if (oldestId) payload.before = oldestId

    wsRef.current?.send(JSON.stringify(payload))
    setMessages((prev) => ({
      ...prev,
      [dmKey]: { ...(prev[dmKey] || { history: [], hasMore: true }), loadingHistory: true },
    }))
  }

  function sendFriendRequest(userId) {
    wsRef.current?.send(JSON.stringify({ type: 'friend_request', to: userId }))
  }

  function acceptFriendRequest(userId) {
    wsRef.current?.send(JSON.stringify({ type: 'friend_accept', from_user: userId }))
    const matchingIds = notificationsRef.current
      .filter((n) => n.type === 'friend_request_received' && n.payload?.from_user === userId)
      .map((n) => n.id)
    if (matchingIds.length > 0) {
      markNotificationsRead(matchingIds)
    }
  }

  function declineFriendRequest(userId) {
    wsRef.current?.send(JSON.stringify({ type: 'friend_decline', from_user: userId }))
    const matchingIds = notificationsRef.current
      .filter((n) => n.type === 'friend_request_received' && n.payload?.from_user === userId)
      .map((n) => n.id)
    if (matchingIds.length > 0) {
      markNotificationsRead(matchingIds)
    }
  }

  function removeFriend(userId) {
    wsRef.current?.send(JSON.stringify({ type: 'friend_remove', user_id: userId }))
  }

  function resolveEmail(userId) {
    return onlineUsers[userId] || emailCache.current[userId] || userId
  }

  function waitForConnection(timeoutMs = 10000) {
    return new Promise((resolve, reject) => {
      if (connectionStatusRef.current === 'connected' && wsRef.current?.readyState === WebSocket.OPEN) {
        resolve()
        return
      }
      const start = Date.now()
      const interval = setInterval(() => {
        if (connectionStatusRef.current === 'connected' && wsRef.current?.readyState === WebSocket.OPEN) {
          clearInterval(interval)
          resolve()
        } else if (Date.now() - start > timeoutMs) {
          clearInterval(interval)
          reject(new Error('WebSocket reconnect timeout'))
        }
      }, 200)
    })
  }

  function markNotificationsRead(ids) {
    setNotifications((prev) => prev.filter((n) => !ids.includes(n.id)))
    wsRef.current?.send(JSON.stringify({ type: 'mark_read', notification_ids: ids }))
  }

  function close() {
    wsRef.current?.close()
  }

  return {
    onlineUsers,
    connectionStatus,
    friendsList,
    pendingSent,
    pendingReceived,
    messages,
    recentChats,
    notifications,
    wsRef,
    sendMessage,
    sendFileMessage,
    loadHistory,
    getDmKey,
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    removeFriend,
    markNotificationsRead,
    resolveEmail,
    waitForConnection,
    close,
  }
}
