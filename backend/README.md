# Appointment Management System - Backend

A robust, feature-rich backend API for appointment management with real-time collaboration, authentication, and intelligent locking mechanisms. Built with Node.js, Express, TypeScript, and PostgreSQL, this system prevents scheduling conflicts and enables seamless collaborative editing.

## 🚀 Features

### Core Business Logic
- **Complete Appointment Management** - Full CRUD operations for appointments
- **User Management & Authentication** - Secure user registration, login, and role-based access
- **Intelligent Locking System** - Prevents concurrent edits and double-bookings
- **Lock History Tracking** - Comprehensive audit trail of all locking activities
- **Real-time Collaboration** - WebSocket-powered live updates and cursor tracking

### Security & Authentication
- **JWT Authentication** - Secure token-based authentication
- **Password Hashing** - BCrypt encryption for user passwords
- **Role-based Access Control** - User and admin role management
- **Protected Routes** - Middleware-based route protection

### Data Management
- **PostgreSQL Database** - Reliable, ACID-compliant data storage
- **TypeORM Integration** - Type-safe database operations and migrations
- **Entity Relationships** - Proper foreign key relationships and constraints
- **Migration System** - Version-controlled database schema changes

### Real-time Features
- **WebSocket Support** - Socket.IO for real-time bidirectional communication
- **Live Cursor Tracking** - Collaborative editing with position sharing
- **Instant Notifications** - Real-time updates for lock changes and appointments
- **Connection Management** - Robust client connection handling

### System Features
- **Auto-lock Expiry** - Automatic lock release after 5 minutes of inactivity
- **Conflict Resolution** - Graceful handling of concurrent operations
- **Admin Override** - Administrative force-release capabilities
- **Comprehensive Logging** - Detailed operation logs and history
- **Docker Support** - Containerized deployment with Docker Compose

## 🛠️ Tech Stack

### Core Technologies
- **Node.js** - JavaScript runtime environment
- **Express.js** - Fast, unopinionated web framework
- **TypeScript** - Type-safe JavaScript development
- **PostgreSQL** - Advanced relational database

### ORM & Database
- **TypeORM** - Advanced ORM with TypeScript support
- **Reflect-metadata** - Decorator metadata reflection
- **Database Migrations** - Version-controlled schema management

### Authentication & Security
- **JWT (jsonwebtoken)** - JSON Web Token implementation
- **BCrypt** - Password hashing and encryption
- **CORS** - Cross-origin resource sharing middleware

### Real-time Communication
- **Socket.IO** - WebSocket library for real-time features
- **WebSocket (ws)** - Low-level WebSocket implementation

### Development & Testing
- **Jest** - JavaScript testing framework
- **Supertest** - HTTP testing library
- **ts-jest** - TypeScript Jest transformer
- **Nodemon** - Development server auto-restart
- **ESLint** - Code linting and formatting
- **Prettier** - Code formatting
- **Husky** - Git hooks for code quality

### DevOps & Deployment
- **Docker** - Application containerization
- **Docker Compose** - Multi-container orchestration
- **SQLite3** - Testing database (for unit tests)

## 📊 Database Schema

### Entities

#### UserEntity
- **id** (UUID) - Primary key
- **email** (string, unique) - User email address
- **name** (string) - User full name
- **hash_password** (string) - BCrypt hashed password
- **role** (enum) - User role (user/admin)
- **created_at** (timestamp) - Account creation date
- **updated_at** (timestamp) - Last update timestamp

#### AppointmentEntity
- **id** (UUID) - Primary key
- **title** (string) - Appointment title
- **description** (text, optional) - Detailed description
- **start_date** (timestamp) - Appointment start time
- **end_date** (timestamp) - Appointment end time
- **status** (enum) - scheduled/completed/cancelled
- **location** (string, optional) - Meeting location
- **organizer** (string, optional) - Organizer name
- **attendees** (array, optional) - List of attendees
- **created_at** (timestamp) - Creation timestamp
- **updated_at** (timestamp) - Last update timestamp

#### AppointmentLockEntity
- **id** (UUID) - Primary key
- **appointment_id** (UUID) - Foreign key to appointment
- **locked_by** (string) - User who acquired the lock
- **acquired_at** (timestamp) - Lock acquisition time
- **expires_at** (timestamp) - Lock expiration time
- **created_at** (timestamp) - Record creation time
- **updated_at** (timestamp) - Last update time

#### LockHistoryEntity
- **id** (UUID) - Primary key
- **appointment_id** (UUID) - Foreign key to appointment
- **user_id** (string) - User involved in the action
- **action** (enum) - Action type (acquired/released/expired/force_released)
- **timestamp** (timestamp) - When the action occurred
- **details** (JSON, optional) - Additional action details
- **created_at** (timestamp) - Record creation time

## 🛣️ API Endpoints

### Authentication Routes (`/api/auth`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/register` | Register new user | No |
| POST | `/login` | User login | No |

### User Management (`/api/users`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/profile` | Get user profile | Yes |
| PUT | `/profile` | Update user profile | Yes |

### Appointment Management (`/api/appointments`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | List all appointments | Yes |
| POST | `/` | Create new appointment | Yes |
| GET | `/:id` | Get appointment details | Yes |
| PUT | `/:id` | Update appointment | Yes |
| DELETE | `/:id` | Delete appointment | Yes |

### Lock Management (`/api/appointments/:id`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/lock-status` | Get current lock status | Yes |
| POST | `/acquire-lock` | Attempt to acquire lock | Yes |
| DELETE | `/release-lock` | Release existing lock | Yes |
| DELETE | `/force-release-lock` | Admin force release lock | Yes (Admin) |
| POST | `/update-position` | Update cursor position | Yes |

### Lock History (`/api/lock-history`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/:appointmentId` | Get lock history for appointment | Yes |

## 🔌 WebSocket Events

### Client to Server Events
| Event | Description | Payload |
|-------|-------------|---------|
| `subscribe` | Subscribe to appointment updates | `{ appointmentId: string }` |
| `unsubscribe` | Unsubscribe from updates | `{ appointmentId: string }` |
| `cursor-position` | Send cursor position | `{ appointmentId: string, position: object }` |

### Server to Client Events
| Event | Description | Payload |
|-------|-------------|---------|
| `lock-update` | Lock status changed | `{ appointmentId: string, lockInfo: object }` |
| `lock-acquired` | Lock was acquired | `{ appointmentId: string, lockedBy: string }` |
| `lock-released` | Lock was released | `{ appointmentId: string }` |
| `admin-takeover` | Admin took over lock | `{ appointmentId: string, adminUser: string }` |
| `cursor-update` | Cursor position update | `{ appointmentId: string, userId: string, position: object }` |

## 📁 Project Structure

```
src/
├── app.ts                     # Main application entry point
├── config/
│   └── data-source.ts        # TypeORM configuration
├── controllers/              # Request handlers
│   ├── authController.ts     # Authentication logic
│   ├── userController.ts     # User management
│   ├── appointmentController.ts # Appointment CRUD
│   ├── lockController.ts     # Lock management
│   └── lockHistoryController.ts # Lock history
├── entities/                 # TypeORM entities
│   ├── UserEntity.ts         # User data model
│   ├── AppointmentEntity.ts  # Appointment data model
│   ├── AppointmentLockEntity.ts # Lock data model
│   └── LockHistoryEntity.ts  # Lock history model
├── middleware/               # Express middleware
│   ├── auth.ts              # JWT authentication
│   └── validation.ts        # Request validation
├── models/                   # TypeScript interfaces
│   ├── user.ts              # User interfaces
│   ├── appointment.ts       # Appointment interfaces
│   └── appointmentLock.ts   # Lock interfaces
├── routes/                   # API route definitions
│   ├── authRoutes.ts        # Authentication routes
│   ├── userRoutes.ts        # User management routes
│   ├── appointmentRoutes.ts # Appointment routes
│   ├── lockRoutes.ts        # Lock management routes
│   └── lockHistoryRoutes.ts # Lock history routes
├── services/                 # Business logic
│   ├── authService.ts       # Authentication services
│   ├── userService.ts       # User management services
│   ├── appointmentService.ts # Appointment services
│   ├── lockService.ts       # Lock management services
│   └── websocketService.ts  # WebSocket handling
├── migrations/               # Database migrations
└── types/                   # TypeScript type definitions

# Configuration files
├── Dockerfile               # Production container
├── Dockerfile.local         # Local development container
├── docker-compose.local.yml # Local development setup
├── wait-for-db.sh          # Database readiness script
├── Makefile                # Development commands
├── jest.config.js          # Jest testing configuration
├── tsconfig.json           # TypeScript configuration
├── .eslintrc.js            # ESLint configuration
└── .prettierrc             # Prettier configuration
```

## 🚀 Installation & Setup

### Prerequisites
- Docker and Docker Compose (recommended)
- Node.js 18+ and npm (for local development)
- PostgreSQL 13+ (if running without Docker)

### Quick Start with Docker

```bash
# Clone the repository
git clone <repository-url>
cd appointment/backend

# Start all services
make build
make up

# Run database migrations
make migrate

# View logs
make logs

# Stop services
make down
```

### Manual Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database credentials

# Run database migrations
npm run build
npm run migration:run

# Start development server
npm run dev

# Run tests
npm test
```

## 🔧 Available Scripts

### Development
- `npm run dev` - Start development server with ts-node
- `npm run dev:watch` - Start with auto-restart on changes
- `npm run build` - Compile TypeScript to JavaScript
- `npm run start` - Start production server
- `npm run start:dev` - Build and start

### Database Operations
- `npm run migration:run` - Run pending migrations
- `npm run migration:revert` - Revert last migration
- `npm run migration:show` - Show migration status
- `npm run db:drop` - Drop all database tables
- `npm run db:sync` - Synchronize database schema

### Testing & Quality
- `npm test` - Run all tests with coverage
- `npm run test:unit` - Run unit tests only
- `npm run test:watch` - Run tests in watch mode
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues automatically

### Docker Commands (via Makefile)
- `make build` - Build Docker images
- `make up` - Start containers
- `make down` - Stop containers
- `make logs` - View container logs
- `make migrate` - Run database migrations
- `make test` - Run tests in container
- `make shell` - Access container shell

## 🌐 Environment Configuration

### Required Environment Variables

```bash
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=appointment_user
DB_PASSWORD=appointment_password
DB_DATABASE=appointment_db

# Application Configuration
PORT=3001
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
```

### Optional Environment Variables

```bash
# Lock Configuration
LOCK_EXPIRY_MINUTES=5

# WebSocket Configuration
WS_CORS_ORIGIN=http://localhost:3000

# Logging
LOG_LEVEL=info
```

## 🔒 Security Features

### Authentication & Authorization
- JWT-based stateless authentication
- BCrypt password hashing with salt rounds
- Role-based access control (user/admin)
- Protected route middleware
- Token expiration handling

### Data Protection
- SQL injection prevention via TypeORM
- Input validation and sanitization
- CORS configuration for cross-origin requests
- Secure password storage (never stored in plain text)

### Concurrency Control
- Database-level transaction management
- Optimistic locking for appointment updates
- Race condition prevention in lock acquisition
- Atomic operations for critical sections

## 📈 Performance & Scalability

### Database Optimization
- Proper indexing on frequently queried fields
- Connection pooling for database connections
- Query optimization with TypeORM
- Pagination support for large datasets

### Real-time Performance
- Efficient WebSocket connection management
- Room-based event broadcasting
- Connection cleanup on client disconnect
- Minimal payload sizes for real-time events

### Monitoring & Observability
- Comprehensive error logging
- Request/response logging
- Performance metrics collection
- Health check endpoints

## 🧪 Testing

### Test Coverage
- Unit tests for services and controllers
- Integration tests for API endpoints
- WebSocket event testing
- Database operation testing
- Authentication flow testing

### Test Environment
- Separate test database (SQLite for speed)
- Mock external dependencies
- Automated test runs with Jest
- Coverage reporting

### Running Tests
```bash
# Run all tests
npm test

# Run specific test suite
npm run test:unit

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm test -- --coverage
```

## 🐳 Docker Development

### Local Development Setup
```bash
# Start development environment
docker-compose -f docker-compose.local.yml up -d

# View logs
docker-compose -f docker-compose.local.yml logs -f

# Run migrations
docker-compose -f docker-compose.local.yml exec app npm run migration:run

# Access database
docker-compose -f docker-compose.local.yml exec db psql -U appointment_user -d appointment_db
```

### Production Deployment
```bash
# Build production image
docker build -t appointment-backend .

# Run with environment variables
docker run -d \
  -p 3001:3001 \
  -e DB_HOST=your-db-host \
  -e DB_PASSWORD=your-db-password \
  -e JWT_SECRET=your-jwt-secret \
  appointment-backend
```

## 🚀 Deployment

### Production Checklist
- [ ] Set strong JWT secret
- [ ] Configure production database
- [ ] Set up SSL/TLS certificates
- [ ] Configure environment variables
- [ ] Set up monitoring and logging
- [ ] Configure backup strategy
- [ ] Set up CI/CD pipeline

### Environment-specific Configurations
- **Development**: Auto-restart, detailed logging, test database
- **Staging**: Production-like setup, limited logging
- **Production**: Optimized performance, security headers, monitoring

## 🤝 Contributing

### Development Guidelines
1. Follow TypeScript best practices
2. Write tests for new features
3. Use ESLint and Prettier for code formatting
4. Create meaningful commit messages
5. Update documentation for API changes

### Pull Request Process
1. Fork the repository
2. Create a feature branch
3. Implement changes with tests
4. Ensure all tests pass
5. Submit pull request with description

## 📋 Changelog

### Recent Updates
- ✅ Added comprehensive user authentication system
- ✅ Implemented full appointment CRUD operations
- ✅ Enhanced lock history tracking and audit trail
- ✅ Added role-based access control
- ✅ Improved WebSocket connection management
- ✅ Enhanced error handling and validation
- ✅ Added comprehensive test suite
- ✅ Implemented Docker containerization
- ✅ Added database migration system
- ✅ Enhanced security with JWT and BCrypt

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Related Projects

- [Frontend Repository](../frontend) - React/Next.js user interface
- [API Documentation](#) - Detailed API reference (if available)

## 📞 Support

For support and questions:
- Create an issue in the repository
- Check existing documentation
- Review the test files for usage examples

---

Built with ❤️ using Node.js, TypeScript, and PostgreSQL
