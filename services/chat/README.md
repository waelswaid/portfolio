# Chat Server

Web-based chat app built with FastAPI + WebSockets + asyncio.
Runs as a Docker container on AWS alongside portfolio/ and auth-system/

## Features

### Core
- [X] Authentication via auth-system 
- [X] Friends system (add by email, requires confirmation)
- [X] 1-on-1 chats with users on friends list
- [ ] Group chats (create, add/remove members)
- [ ] Chat history (persisted)

### Real-time
- [X] Online/offline presence
- [ ] Typing indicator

### Media & Search
- [X] File/image sharing
- Message search

## Tech Stack
- **Backend:** FastAPI, WebSockets, asyncio
- **Database:** PostgreSQL (chat history, relationships)
- **Cache/Pub-Sub:** Redis (presence, typing indicators, WebSocket scaling)
- **Auth:** auth-system (JWT)
- **Deployment:** Docker, Nginx (reverse proxy from portfolio)


### file upload flow
    post /server/upload/ with bearer token + file -> returns {"type": "file_upload", "sender_id": "...", "url": "uploads/..."}
    WebSocket send {"type": "file_upload", "to": "user_id", "url": "uploads/..."} via chat_websocket (send_personal_message)
    GET /uploads/<filename> → serves the file via StaticFiles (GET endpoint as at main: app.mount("/uploads"...) )


### redis
    - upload endpoint limited to 10/0.5hr per user
    - voice messages uploads limited to 8mb/30mins per user

### chats and messaging history
 - tables:
   - messages: message_id (bigint, sequential), chat_id(uuid), user_id(str), msg(str), type(str), timestamp(datetime)
        - Primary_Key(message_id)
        - Foreign_Key(chat_id) references chats.chat_id
        - Foreign_Key(user_id) references users.user_id
        - index(chat_id, message_id)

   - chats_members: chat_id(uuid), user_id(str, sender), is_admin(boolean), joined_at(datetime)
        - Primary_Key(chat_id, user_id)
        - Foreign_Key(chat_id) references chats.chat_id
        - Foreign_key(user_id) references users.user_id
    
    - chats: chat_id (PK), chat_name(str, nullable), created_at(datetime), is_group(boolean), dm_key(str,unique,nullable)

* dm_key: prevents direct chat duplication, when creating DM sort user ids and concatenate them "id1:id2", for group chats it's NULL

- notes to self:
    query chats by index(chat_id, message_id) for loading chat history
    query chats by dm_key for direct chats

**implementation order**: 

1. 1-on-1 chat creation with dm_key
2. messages persistance
3. introduce group chats creation feature
4. group chat creation + member managment

