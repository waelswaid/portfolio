import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import useAuth from '../hooks/useAuth'
import useLogout from '../hooks/useLogout'
import useChatSocket from '../hooks/useChatSocket'
import useFileUpload from '../hooks/useFileUpload'
import useVoiceRecorder from '../hooks/useVoiceRecorder'
import ChatSidebar from '../components/chat/ChatSidebar'
import ChatHeader from '../components/chat/ChatHeader'
import MessageBubble from '../components/chat/MessageBubble'
import MessageInput from '../components/chat/MessageInput'

export default function Chat() {
  const { user, loading } = useAuth()
  const logout = useLogout()
  const [selectedUser, setSelectedUser] = useState(null)
  const [messageInput, setMessageInput] = useState('')
  const messagesEndRef = useRef(null)
  const messagesContainerRef = useRef(null)

  const chat = useChatSocket(user)

  const selectedUserRef = useRef(null)

  useEffect(() => {
    selectedUserRef.current = selectedUser
  }, [selectedUser])

  const fileUpload = useFileUpload(
    async (url) => {
      await chat.waitForConnection()
      const current = selectedUserRef.current
      if (current) chat.sendFileMessage(current.user_id, url)
    },
    { canUpload: () => !!selectedUserRef.current },
  )

  const voiceRecorder = useVoiceRecorder((blob, filename) => {
    fileUpload.uploadBlob(blob, filename)
  })

  useEffect(() => {
    if (selectedUser && chat.connectionStatus === 'connected') {
      chat.loadHistory(selectedUser.user_id)
    }
  }, [selectedUser, chat.connectionStatus])

  const dmKey = selectedUser ? chat.getDmKey(selectedUser.user_id) : null
  const chatData = dmKey ? chat.messages[dmKey] : null
  const filteredMessages = chatData?.history || []
  const isLoadingHistory = chatData?.loadingHistory || false
  const hasMore = chatData?.hasMore ?? true

  useEffect(() => {
    const el = messagesContainerRef.current
    if (!el) return
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100
    if (isNearBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [filteredMessages.length])

  function handleSend(e) {
    e.preventDefault()
    if (!selectedUser || !messageInput.trim()) return
    chat.sendMessage(selectedUser.user_id, messageInput)
    setMessageInput('')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" />
        </div>
      </div>
    )
  }

  function handleScroll() {
    const el = messagesContainerRef.current
    if (el.scrollTop === 0 && hasMore && !isLoadingHistory && selectedUser) {
      chat.loadHistory(selectedUser.user_id)
    }
  }

  return (
    <div className="h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-slate-800/80 backdrop-blur-md border-b border-slate-700/50">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="text-sm text-slate-400 hover:text-white transition-colors">
              &larr; Back
            </Link>
            <h1 className="text-lg font-semibold text-white tracking-tight">Chat</h1>
            <span
              className={`text-[10px] font-medium px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                chat.connectionStatus === 'connected'
                  ? 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20'
                  : chat.connectionStatus === 'connecting'
                    ? 'bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20'
                    : 'bg-red-500/10 text-red-400 ring-1 ring-red-500/20'
              }`}
            >
              {chat.connectionStatus}
            </span>
          </div>
          <button
            onClick={() => { chat.close(); logout() }}
            className="text-sm text-slate-400 hover:text-red-400 transition-colors"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-3 md:px-6 py-4 flex gap-4 min-h-0">
        <ChatSidebar
          user={user}
          onlineUsers={chat.onlineUsers}
          friendsList={chat.friendsList}
          pendingSent={chat.pendingSent}
          pendingReceived={chat.pendingReceived}
          recentChats={chat.recentChats}
          selectedUser={selectedUser}
          onSelectUser={setSelectedUser}
          onSendFriendRequest={chat.sendFriendRequest}
          onAcceptFriendRequest={chat.acceptFriendRequest}
          onDeclineFriendRequest={chat.declineFriendRequest}
          onRemoveFriend={chat.removeFriend}
          resolveEmail={chat.resolveEmail}
        />

        {/* Chat Area */}
        <div className={`${selectedUser ? 'flex' : 'hidden md:flex'} flex-1 bg-slate-800/60 backdrop-blur-sm rounded-2xl border border-slate-700/50 flex-col`}>
          {selectedUser ? (
            <>
              <ChatHeader
                selectedUser={selectedUser}
                isOnline={selectedUser.user_id in chat.onlineUsers}
                onBack={() => setSelectedUser(null)}
              />

              {/* Messages */}
              <div ref={messagesContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto px-4 md:px-5 py-4 space-y-3">
                {isLoadingHistory && (
                  <div className="text-center py-2">
                    <span className="text-xs text-slate-500">Loading...</span>
                  </div>
                )}
                {filteredMessages.map((m, i) => (
                  <MessageBubble key={i} message={m} />
                ))}
                <div ref={messagesEndRef} />
              </div>

              <MessageInput
                messageInput={messageInput}
                onMessageChange={setMessageInput}
                onSend={handleSend}
                onFileClick={() => fileUpload.fileInputRef.current?.click()}
                onCameraClick={() => fileUpload.cameraInputRef.current?.click()}
                onVoiceClick={voiceRecorder.toggleRecording}
                fileInputRef={fileUpload.fileInputRef}
                cameraInputRef={fileUpload.cameraInputRef}
                onFileChange={fileUpload.handleFileChange}
                uploading={fileUpload.uploading}
                recording={voiceRecorder.recording}
              />
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-2">
              <div className="w-12 h-12 rounded-full bg-slate-700/50 flex items-center justify-center mb-2">
                <svg className="w-6 h-6 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
                </svg>
              </div>
              <p className="text-slate-400 text-sm">Select a user to start chatting</p>
              <p className="text-slate-600 text-xs">Choose from online users or your friends list</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
