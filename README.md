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

