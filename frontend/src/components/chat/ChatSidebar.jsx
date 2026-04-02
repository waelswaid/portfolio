import { useState } from 'react'
import UserListItem from './UserListItem'

export default function ChatSidebar({
  user,
  onlineUsers,
  friendsList,
  pendingSent,
  pendingReceived,
  recentChats,
  selectedUser,
  onSelectUser,
  onSendFriendRequest,
  onAcceptFriendRequest,
  onDeclineFriendRequest,
  onRemoveFriend,
  resolveEmail,
}) {
  const [activeTab, setActiveTab] = useState('chats')

  const friendIds = new Set(friendsList.map((f) => f.user_id))
  const pendingSentIds = new Set(pendingSent.map((p) => p.user_id))
  const pendingReceivedIds = new Set(pendingReceived.map((p) => p.user_id))
  const onlineOthers = Object.entries(onlineUsers).filter(([id]) => id !== user.id)

  const tabs = [
    { key: 'chats', label: 'Chats', count: recentChats.length },
    { key: 'online', label: 'Online', count: onlineOthers.length },
    { key: 'friends', label: 'Friends', count: friendsList.length },
    { key: 'pending', label: 'Pending', count: pendingReceived.length },
  ]

  return (
    <div className={`${selectedUser ? 'hidden md:flex' : 'flex'} w-full md:w-72 bg-slate-800/60 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-4 flex-col`}>
      {/* Tab bar */}
      <div className="flex gap-1 bg-slate-900/50 rounded-xl p-1 mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 text-sm font-medium min-h-[40px] rounded-lg transition-all ${
              activeTab === tab.key
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.label}
            <span className={`ml-1 ${activeTab === tab.key ? 'text-blue-200' : 'text-slate-500'}`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto space-y-1">
        {activeTab === 'chats' && (
          <>
            {recentChats.map((c) => (
              <UserListItem
                key={c.chat_id}
                userId={c.other_user_id}
                email={c.other_user_email}
                isSelected={selectedUser?.user_id === c.other_user_id}
                isOnline={c.other_user_id in onlineUsers}
                lastMessage={c.last_message}
                onSelect={onSelectUser}
              />
            ))}
            {recentChats.length === 0 && (
              <div className="text-center py-8">
                <p className="text-sm text-slate-500">No conversations yet</p>
                <p className="text-xs text-slate-600 mt-1">Send a message to start chatting</p>
              </div>
            )}
          </>
        )}

        {activeTab === 'online' && (
          <>
            {onlineOthers.map(([id, email]) => (
              <UserListItem
                key={id}
                userId={id}
                email={email}
                isSelected={selectedUser?.user_id === id}
                isOnline
                isFriend={friendIds.has(id)}
                isPendingSent={pendingSentIds.has(id)}
                isPendingReceived={pendingReceivedIds.has(id)}
                onSelect={onSelectUser}
                onSendRequest={onSendFriendRequest}
                onAcceptRequest={onAcceptFriendRequest}
              />
            ))}
            {onlineOthers.length === 0 && (
              <div className="text-center py-8">
                <p className="text-sm text-slate-500">No other users online</p>
              </div>
            )}
          </>
        )}

        {activeTab === 'friends' && (
          <>
            {friendsList.map((f) => (
              <UserListItem
                key={f.user_id}
                userId={f.user_id}
                email={resolveEmail(f.user_id)}
                isOnline={f.user_id in onlineUsers}
                isFriend
                showFriendActions
                onSelect={onSelectUser}
                onRemoveFriend={onRemoveFriend}
              />
            ))}
            {friendsList.length === 0 && (
              <div className="text-center py-8">
                <p className="text-sm text-slate-500">No friends yet</p>
                <p className="text-xs text-slate-600 mt-1">Add friends from the Online tab</p>
              </div>
            )}
          </>
        )}

        {activeTab === 'pending' && (
          <>
            <h3 className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest px-3 mb-2">
              Received ({pendingReceived.length})
            </h3>
            {pendingReceived.map((p) => (
              <UserListItem
                key={p.user_id}
                userId={p.user_id}
                email={p.email || resolveEmail(p.user_id)}
                isPendingReceived
                onAcceptRequest={onAcceptFriendRequest}
                onDeclineRequest={onDeclineFriendRequest}
              />
            ))}
            {pendingReceived.length === 0 && (
              <p className="text-xs text-slate-600 text-center py-2">None</p>
            )}

            <h3 className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest px-3 mb-2 mt-5">
              Sent ({pendingSent.length})
            </h3>
            {pendingSent.map((p) => (
              <div key={p.user_id} className="flex items-center gap-2 px-3 py-3 rounded-xl">
                <span className="flex-1 text-sm text-slate-400 truncate">
                  {resolveEmail(p.user_id)}
                </span>
                <span className="text-xs text-slate-600 bg-slate-700/50 px-2 py-1 rounded-md">waiting</span>
              </div>
            ))}
            {pendingSent.length === 0 && (
              <p className="text-xs text-slate-600 text-center py-2">None</p>
            )}
          </>
        )}
      </div>
    </div>
  )
}
