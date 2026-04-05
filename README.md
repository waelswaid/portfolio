# Portfolio

```mermaid
graph TB
    Client([Browser])

    Client -->|":80"| Nginx

    subgraph portfolio["portfolio/"]
        Nginx["Nginx<br/>Reverse Proxy"]

        subgraph services["services/"]
            Chat["Chat Service<br/>FastAPI + WebSocket<br/>:8002"]
            Upload["Upload Service<br/>FastAPI<br/>:8003"]
        end

        Frontend["Frontend<br/>React + Vite + Tailwind"]
    end

    subgraph auth-system["auth-system/ (standalone repo)"]
        Auth["Auth Service<br/>FastAPI<br/>:8000"]
    end

    subgraph data["Data Stores"]
        PG[(PostgreSQL)]
        Redis[(Redis)]
        Kafka["Kafka<br/>Message Broker"]
    end

    S3["AWS S3 + CloudFront"]

    Nginx -->|"static files"| Frontend
    Nginx -->|"/api/auth, /api/users, /api/admin"| Auth
    Nginx -->|"/server/ws"| Chat
    Nginx -->|"/server/upload"| Upload

    Auth --> PG
    Auth -->|"db 0"| Redis
    Chat -->|"produce"| Kafka
    Kafka -->|"consume"| PG
    Upload -->|"db 2 (rate limiting)"| Redis
    Upload --> S3

    Chat -.->|"JWT public key"| Auth
    Upload -.->|"JWT public key"| Auth
```


### what's next?
**the current architecture raises few concerns:**

1) the frontend is acting as an orchestrator between two backend services (chat and upload). if the browser crashes between the upload and the websocket send, the file is uploaded to s3 but never gets delivered. but there's a reason why it works this way: the upload service doesn't know the recipient. it's a generic file service, it takes a file -> uploads it -> returns URL. the "to" (who this file belongs to) is context that only the chat service has. the current flow looks like this:
- frontend -> POST /upload -> frontend gets URL -> websocket {"type":"file_upload", "to":..., "url":...} -> chat service

**solution:** Include to in the upload request. the frontend sends the recipient ID as a form field alongside the file. The upload service, after storing the file, produces a message to Kafka with the URL + recipient. The chat consumer handles delivery. Upload service gains a small coupling to chat, but the frontend is no longer the orchestrator.


