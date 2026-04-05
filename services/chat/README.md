
### Chat service layers and packages responsibilities

| Layer / Package | What it owns |
|---|---|
| **`routes/`** | WebSocket endpoint. Accepts connections, authenticates via JWT, runs the core message loop. |
| **`dispatch/`** | Routing and orchestration. A handler registry maps message types to async handler functions. Handlers validate input schemas, call the service layer, and handle transport (send responses, deliver notifications, produce to Kafka). |
| **`services/`** | Business logic. Takes plain parameters, operates on the DB through the repository layer, returns plain dicts. No knowledge of WebSockets, Kafka, or connection state. |
| **`repository/`** | Database queries. Receives a session, runs SQLAlchemy operations, returns ORM objects or scalars. |
| **`kafka/`** | Producer sends chat messages to Kafka. Consumer reads from Kafka and calls `persist_message` to write to DB. Broker setup handles topic creation. |
| **`connection_manager`** | Tracks active WebSocket connections. Handles connect/disconnect with a grace period for reconnects. Provides lookup by user ID and broadcast. |
| **`core/`** | Configuration (Pydantic settings from env vars) and JWT token validation (delegates to `shared/auth`). |
| **`schemas/`** | Pydantic models for validating incoming WebSocket message payloads. |

### Chat service layers and packages flows

**Incoming WebSocket message:**
```
Client sends JSON → routes/ (core loop) → dispatch/registry resolves handler by "type"
→ dispatch/handler validates schema, calls services/ → services/ calls repository/ → DB
→ handler sends response to caller via WebSocket
→ handler sends notifications to other users via connection_manager
```

**Chat message (with Kafka):**
```
Client sends {"type": "message", ...}
→ handler calls services/ to ensure chat exists (DB)
→ handler calls kafka/producer to produce message
→ handler delivers message to recipient via connection_manager
→ (async) kafka/consumer picks up message → calls services/persist_message → DB
→ (fallback) if Kafka is unreachable, handler calls persist_message directly
```

**Friend request (example of notify flow):**
```
Client sends {"type": "friend_request", "to": "user_123"}
→ handler validates schema
→ handler calls services/send_friend_request("user_123", sender_id, sender_email)
→ service inserts pending request (repo → DB), returns {"response": ..., "notify": [...]}
→ handler sends response to caller
→ handler sends notification to user_123 if they're online
```
