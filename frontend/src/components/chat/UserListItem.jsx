export default function UserListItem({
  userId,
  email,
  isSelected,
  isOnline,
  isFriend,
  isPendingSent,
  isPendingReceived,
  lastMessage,
  onSelect,
  onSendRequest,
  onAcceptRequest,
  onDeclineRequest,
  onRemoveFriend,
  showFriendActions = false,
}) {
  return (
    <div
      className={`flex items-center gap-2.5 px-3 py-3 rounded-xl transition-all cursor-pointer group ${
        isSelected
          ? 'bg-blue-600/20 ring-1 ring-blue-500/30'
          : 'hover:bg-slate-700/50'
      }`}
      onClick={() => onSelect?.({ user_id: userId, email })}
    >
      <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
        isOnline
          ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50'
          : 'bg-slate-600'
      }`} />
      <div className="flex-1 min-w-0">
        <span className={`text-sm truncate block ${
          isSelected ? 'text-blue-300 font-medium' : 'text-slate-300'
        }`}>
          {email}
        </span>
        {lastMessage && (
          <span className="text-xs text-slate-500 truncate block">
            {lastMessage.type === 'file_upload' ? 'Sent a file' : lastMessage.message}
          </span>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        {isFriend && !showFriendActions && (
          <span className="text-xs text-emerald-400/70 bg-emerald-500/10 px-2 py-1 rounded-md">Friend</span>
        )}
        {showFriendActions && isFriend && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); onSelect?.({ user_id: userId, email }) }}
              className="text-xs text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 min-h-[36px] px-3 rounded-md transition-colors"
            >
              Chat
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onRemoveFriend?.(userId) }}
              className="text-xs text-red-400 bg-red-500/10 hover:bg-red-500/20 min-h-[36px] px-3 rounded-md transition-colors"
            >
              Remove
            </button>
          </>
        )}
        {!isFriend && isPendingSent && (
          <span className="text-xs text-slate-500 bg-slate-700/50 px-2 py-1 rounded-md">Pending</span>
        )}
        {!isFriend && isPendingReceived && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); onAcceptRequest?.(userId) }}
              className="text-xs text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 min-h-[36px] px-3 rounded-md transition-colors"
            >
              Accept
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDeclineRequest?.(userId) }}
              className="text-xs text-red-400 bg-red-500/10 hover:bg-red-500/20 min-h-[36px] px-3 rounded-md transition-colors"
            >
              Decline
            </button>
          </>
        )}
        {!isFriend && !isPendingSent && !isPendingReceived && onSendRequest && (
          <button
            onClick={(e) => { e.stopPropagation(); onSendRequest(userId) }}
            className="text-xs text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 min-h-[36px] px-3 rounded-md md:opacity-0 md:group-hover:opacity-100 transition-all"
          >
            + Add
          </button>
        )}
      </div>
    </div>
  )
}
