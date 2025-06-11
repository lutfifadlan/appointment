# Appointment Locking Mechanism Backend

This backend implements a locking mechanism to prevent concurrent edits on appointments. It provides REST APIs and WebSocket functionality to manage appointment locks, enabling real-time collaboration features. The application uses TypeORM with PostgreSQL for data persistence and Docker for containerization.

## Features

- **Appointment Locking System**
  - Acquire/release locks on appointments
  - Store lock metadata (lockedBy, appointmentId, timestamp)
  - Auto-release locks after 5 minutes of inactivity
  - Handle concurrent lock requests gracefully

- **Real-time Updates**
  - WebSocket notifications for lock changes
  - Collaborative cursor position sharing
  - Admin takeover functionality

- **Database & ORM**
  - PostgreSQL for reliable data persistence
  - TypeORM for database operations and migrations
  - Entity-based data modeling

- **Docker Integration**
  - Containerized application and database
  - Docker Compose for multi-container setup
  - Makefile for simplified Docker commands

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/appointments/:id/lock-status` | Get current lock status |
| POST | `/api/appointments/:id/acquire-lock` | Attempt to acquire lock |
| DELETE | `/api/appointments/:id/release-lock` | Release existing lock |
| DELETE | `/api/appointments/:id/force-release-lock` | Admin force release lock |
| POST | `/api/appointments/:id/update-position` | Update user cursor position |

## WebSocket Events

| Event | Description |
|-------|-------------|
| `subscribe` | Subscribe to appointment updates |
| `unsubscribe` | Unsubscribe from appointment updates |
| `cursor-position` | Send cursor position updates |
| `lock-update` | Receive lock status changes |
| `lock-acquired` | Notification when lock is acquired |
| `lock-released` | Notification when lock is released |
| `admin-takeover` | Notification when admin takes over |
| `cursor-update` | Receive cursor position updates |

## Project Structure

```plaintext
src/
├── app.ts                  # Main application entry point
├── config/
│   └── data-source.ts      # TypeORM configuration
├── controllers/
│   └── lockController.ts   # HTTP request handlers
├── entities/
│   └── AppointmentLockEntity.ts # TypeORM entity
├── migrations/             # TypeORM migrations
├── models/
│   └── appointmentLock.ts  # Data interfaces
├── routes/
│   └── lockRoutes.ts       # API route definitions
├── services/
│   ├── lockService.ts      # Lock business logic
│   └── websocketService.ts # WebSocket handling
└── test-client.ts          # Test script for APIs and WebSocket

# Docker files
Dockerfile                  # Container definition
docker-compose.yml          # Multi-container setup
Makefile                    # Docker command shortcuts
```

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Make (optional, for using the Makefile commands)

### Installation & Running with Docker

```bash
# Build and start all containers
make build
make up

# Or without Make
docker-compose build
docker-compose up -d

# Run database migrations
make migrate

# Or without Make
docker-compose exec app npm run migration:run

# View logs
make logs

# Stop containers
make down
```

### Manual Installation (without Docker)

```bash
# Install dependencies
npm install

# Configure PostgreSQL
# Edit .env file with your database credentials

# Run migrations
npm run migration:run

# Start development server
npm run dev

# Run test client (in a separate terminal)
npm test
```

## Implementation Details

- **Database**: PostgreSQL for persistent storage of locks
- **ORM**: TypeORM for database operations and migrations
- **Concurrency Control**: Uses database transactions and constraints to prevent race conditions
- **Auto-expiry**: Locks automatically expire after 5 minutes of inactivity
- **Real-time Updates**: Uses Socket.IO for bidirectional communication
- **Position Tracking**: Supports collaborative cursor position sharing
- **Containerization**: Docker for consistent development and deployment environments

## Security Considerations

- User validation for lock operations
- Admin-only functionality for force releasing locks
- Rate limiting could be implemented for production use
