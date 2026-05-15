# Digital RT-Muban - Getting Started Guide

## 📋 Project Status

Struktur proyek Digital RT-Muban telah berhasil dibuat dengan lengkap. Berikut adalah status implementasi:

### ✅ Completed
- [x] Technical architecture design
- [x] Database schema design
- [x] API documentation
- [x] Implementation plan
- [x] Project structure setup
- [x] Configuration files
- [x] Shared utilities module
- [x] API Gateway structure
- [x] Authentication routes

### 🚧 In Progress
- [ ] Complete all microservices
- [ ] Frontend applications
- [ ] Database migrations
- [ ] Docker configuration
- [ ] Testing setup

---

## 🚀 Quick Start

### Prerequisites

Pastikan Anda telah menginstall:
- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **Docker** dan **Docker Compose**
- **PostgreSQL** 16+ (jika tidak menggunakan Docker)
- **Redis** 7+ (jika tidak menggunakan Docker)

### Installation Steps

#### 1. Install Dependencies

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install shared module dependencies
cd shared
npm install
cd ..

# Install API Gateway dependencies
cd api-gateway
npm install
cd ..

# Install database module dependencies
cd database
npm install
cd ../..
```

#### 2. Setup Environment Variables

```bash
# Copy environment example
cp .env.example .env

# Edit .env file dengan konfigurasi Anda
# Minimal yang perlu diubah:
# - DB_PASSWORD
# - JWT_SECRET
# - JWT_REFRESH_SECRET
```

#### 3. Start Development Environment

**Option A: Using Docker (Recommended)**

```bash
# Start all services dengan Docker Compose
docker-compose up -d

# Check logs
docker-compose logs -f

# Stop services
docker-compose down
```

**Option B: Manual Setup**

```bash
# Start PostgreSQL dan Redis secara manual
# Kemudian jalankan:

# Run database migrations
cd backend/database
npm run migrate

# Start API Gateway
cd ../api-gateway
npm run dev

# Start services (di terminal terpisah)
cd ../services/user-service
npm run dev
```

---

## 📁 Project Structure

```
digital-rt-muban/
├── plans/                              # 📚 Documentation
│   ├── executive-summary.md
│   ├── digital-rt-muban-technical-architecture.md
│   ├── database-schema.md
│   ├── api-documentation.md
│   └── implementation-plan.md
│
├── backend/                            # 🔧 Backend Services
│   ├── shared/                         # Shared utilities
│   │   ├── src/
│   │   │   ├── config.ts              # Configuration management
│   │   │   ├── database.ts            # Database connection
│   │   │   ├── types/                 # TypeScript types
│   │   │   └── utils/                 # Utility functions
│   │   │       ├── logger.ts          # Winston logger
│   │   │       ├── jwt.ts             # JWT utilities
│   │   │       ├── password.ts        # Password hashing
│   │   │       └── validation.ts      # Zod validation
│   │   └── package.json
│   │
│   ├── api-gateway/                    # API Gateway
│   │   ├── src/
│   │   │   ├── index.ts               # Main application
│   │   │   └── routes/
│   │   │       └── auth.routes.ts     # Authentication routes
│   │   └── package.json
│   │
│   ├── database/                       # Database migrations
│   │   └── package.json
│   │
│   ├── services/                       # Microservices
│   │   ├── user-service/              # (To be created)
│   │   ├── administration-service/    # (To be created)
│   │   ├── waste-bank-service/        # (To be created)
│   │   ├── marketplace-service/       # (To be created)
│   │   ├── sos-service/               # (To be created)
│   │   ├── patrol-service/            # (To be created)
│   │   └── notification-service/      # (To be created)
│   │
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                           # 🎨 Frontend Applications
│   ├── mobile-app/                    # (To be created)
│   ├── web-app/                       # (To be created)
│   └── admin-dashboard/               # (To be created)
│
├── infrastructure/                     # 🏗️ Infrastructure
│   ├── docker/                        # (To be created)
│   ├── kubernetes/                    # (To be created)
│   └── terraform/                     # (To be created)
│
├── .env.example                        # Environment variables template
├── .gitignore                          # Git ignore rules
├── .eslintrc.json                      # ESLint configuration
├── .prettierrc.json                    # Prettier configuration
├── docker-compose.yml                  # Docker Compose configuration
├── package.json                        # Root package.json
└── README.md                           # Project README
```

---

## 🔨 Next Steps

### Phase 1: Complete Backend Core (Current)

1. **Fix TypeScript Errors**
   ```bash
   # Install missing type definitions
   cd backend/shared
   npm install --save-dev @types/node @types/pg @types/bcrypt @types/jsonwebtoken
   
   cd ../api-gateway
   npm install --save-dev @types/express @types/cors @types/compression @types/morgan
   ```

2. **Create Database Migrations**
   - Implement migration scripts in `backend/database/`
   - Create initial schema based on `plans/database-schema.md`

3. **Complete Remaining Routes**
   - User routes
   - Neighborhood routes
   - Waste bank routes
   - Marketplace routes
   - SOS routes
   - Patrol routes

4. **Create Middleware**
   - Authentication middleware
   - Authorization middleware
   - Error handling middleware
   - Request validation middleware

### Phase 2: Implement Microservices

1. **User Service**
   - User profile management
   - Role management
   - Permission management

2. **Administration Service**
   - Neighborhood management
   - Household management
   - Announcements

3. **Waste Bank Service**
   - Waste categories
   - Collection scheduling
   - Points management

4. **Marketplace Service**
   - Business management
   - Product management
   - Order processing

5. **SOS Service**
   - Emergency alerts
   - Incident reporting
   - Response coordination

6. **Patrol Service**
   - Schedule management
   - Shift assignment
   - Activity logging

7. **Notification Service**
   - Push notifications
   - SMS notifications
   - Email notifications

### Phase 3: Frontend Development

1. **Mobile App (React Native)**
   ```bash
   npx react-native init RTMubanMobile
   ```

2. **Web Application (Next.js)**
   ```bash
   npx create-next-app@latest web-app --typescript
   ```

3. **Admin Dashboard (React)**
   ```bash
   npx create-react-app admin-dashboard --template typescript
   ```

### Phase 4: DevOps & Infrastructure

1. **Docker Configuration**
   - Create Dockerfile for each service
   - Optimize Docker images

2. **Kubernetes Manifests**
   - Deployment configurations
   - Service configurations
   - Ingress configurations

3. **CI/CD Pipeline**
   - GitHub Actions workflow
   - Automated testing
   - Automated deployment

---

## 🧪 Testing

### Unit Tests
```bash
npm run test:unit
```

### Integration Tests
```bash
npm run test:integration
```

### E2E Tests
```bash
npm run test:e2e
```

---

## 📊 Available Scripts

### Root Level
- `npm run install:all` - Install all dependencies
- `npm run dev` - Start all services in development mode
- `npm run build` - Build all services
- `npm run test` - Run all tests
- `npm run lint` - Lint all code
- `npm run format` - Format all code

### Docker Commands
- `npm run docker:up` - Start Docker containers
- `npm run docker:down` - Stop Docker containers
- `npm run docker:build` - Build Docker images
- `npm run docker:logs` - View Docker logs

---

## 🔧 Development Tools

### Database Management
- **pgAdmin**: http://localhost:5050
  - Email: admin@rt-muban.example.com
  - Password: admin

### Redis Management
- **Redis Commander**: http://localhost:8081

### Message Queue Management
- **RabbitMQ Management**: http://localhost:15672
  - Username: admin
  - Password: admin_password

### Monitoring
- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:9091
  - Username: admin
  - Password: admin

### API Documentation
- **Swagger UI**: http://localhost:3000/api-docs

---

## 🐛 Troubleshooting

### TypeScript Errors

Jika Anda melihat TypeScript errors tentang missing modules:

```bash
# Install type definitions
npm install --save-dev @types/node @types/express @types/pg

# Rebuild
npm run build
```

### Docker Issues

```bash
# Remove all containers and volumes
docker-compose down -v

# Rebuild images
docker-compose build --no-cache

# Start fresh
docker-compose up -d
```

### Database Connection Issues

```bash
# Check if PostgreSQL is running
docker-compose ps

# View PostgreSQL logs
docker-compose logs postgres

# Connect to PostgreSQL
docker-compose exec postgres psql -U rt_muban_user -d rt_muban_db
```

---

## 📚 Documentation

- [Executive Summary](plans/executive-summary.md)
- [Technical Architecture](plans/digital-rt-muban-technical-architecture.md)
- [Database Schema](plans/database-schema.md)
- [API Documentation](plans/api-documentation.md)
- [Implementation Plan](plans/implementation-plan.md)

---

## 🤝 Contributing

Proyek ini adalah bagian dari Toyota Foundation IGP 2026. Untuk kontribusi, silakan hubungi tim proyek.

---

## 📞 Support

Untuk pertanyaan atau dukungan:
- Email: hendra.dedi@mail.unnes.ac.id
- Project Team: UNNES & Chulalongkorn University

---

## 📄 License

MIT License - See LICENSE file for details

---

**Last Updated**: May 2026  
**Version**: 1.0.0  
**Status**: In Development
