# Digital RT-Muban Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)

> Smart Neighborhood Management Platform for RT (Indonesia) and Muban (Thailand) Communities

## 🌟 Project Overview

Digital RT-Muban is a comprehensive, multilingual digital platform designed to strengthen neighborhood governance in Indonesia and Thailand. The platform integrates five core functions into a unified ecosystem:

- 🏘️ **Administration** - Resident management, announcements, neighborhood governance
- ♻️ **Waste Banking** - Waste tracking, collection scheduling, points system
- 🛒 **Marketplace** - Local business directory, product listings, transactions
- 🚨 **SOS** - Emergency alerts, incident reporting, response coordination
- 👮 **Patrol Scheduling** - Security patrols, shift management, incident logging

## 🎯 Project Goals

This project is part of the **Toyota Foundation International Grant Program 2026**, aiming to:

1. Compare neighborhood governance practices in RT (Indonesia) and Muban (Thailand)
2. Co-create a multilingual digital platform for community management
3. Pilot and evaluate the platform in both countries
4. Produce transferable outputs for broader adoption across Asia

## 🏗️ Architecture

The platform uses a **microservices architecture** with the following components:

### Backend Services
- **User Service** - Authentication, authorization, user profiles
- **Administration Service** - Neighborhood management, announcements
- **Waste Bank Service** - Waste tracking, collection, points
- **Marketplace Service** - Business profiles, products, orders
- **SOS Service** - Emergency alerts, incident reporting
- **Patrol Service** - Shift scheduling, patrol logs
- **Notification Service** - Push notifications, SMS, in-app messages

### Frontend Applications
- **Mobile App** - React Native (Android & iOS)
- **Web Application** - React 18+ with Next.js
- **Admin Dashboard** - React with Material-UI

### Data Layer
- **PostgreSQL 16+** - Primary database with PostGIS
- **Redis 7+** - Caching and session management
- **MongoDB 6+** - Logs and analytics
- **AWS S3 / MinIO** - File storage

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18.0.0
- Docker & Docker Compose
- PostgreSQL 16+
- Redis 7+

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/digital-rt-muban.git
cd digital-rt-muban

# Install dependencies for all services
npm run install:all

# Set up environment variables
cp .env.example .env

# Start development environment with Docker
docker-compose up -d

# Run database migrations
npm run migrate

# Start development servers
npm run dev
```

### Development URLs

- **API Gateway**: http://localhost:3000
- **Web App**: http://localhost:3001
- **Admin Dashboard**: http://localhost:3002
- **API Documentation**: http://localhost:3000/api-docs

## 📁 Project Structure

```
digital-rt-muban/
├── backend/
│   ├── services/
│   │   ├── user-service/
│   │   ├── administration-service/
│   │   ├── waste-bank-service/
│   │   ├── marketplace-service/
│   │   ├── sos-service/
│   │   ├── patrol-service/
│   │   └── notification-service/
│   ├── api-gateway/
│   ├── shared/
│   └── database/
├── frontend/
│   ├── mobile-app/
│   ├── web-app/
│   └── admin-dashboard/
├── infrastructure/
│   ├── docker/
│   ├── kubernetes/
│   └── terraform/
├── docs/
└── plans/
```

## 🌍 Multilingual Support

The platform supports three languages:

- 🇮🇩 **Indonesian (id)** - Primary language for RT communities
- 🇹🇭 **Thai (th)** - Primary language for Muban communities
- 🇬🇧 **English (en)** - International users and fallback

## 🔒 Security

- JWT-based authentication with refresh tokens
- Role-Based Access Control (RBAC)
- TLS 1.3 encryption for all communications
- AES-256 encryption for sensitive data
- Regular security audits and penetration testing

## 📊 Key Features

### Administration Module
- Resident and household registration
- Announcements and notifications
- Document management
- Neighborhood statistics

### Waste Banking Module
- Waste category management
- Collection scheduling
- Deposit recording with points
- Environmental impact tracking

### Marketplace Module
- Business registration and verification
- Product listings and management
- Order processing and tracking
- Review and rating system

### SOS Module
- One-touch emergency alerts
- Real-time alert broadcasting
- Emergency contact management
- Incident reporting and tracking

### Patrol Module
- Patrol schedule creation
- Shift assignment and tracking
- Patrol activity logging
- Security incident reporting

## 🧪 Testing

```bash
# Run all tests
npm test

# Run unit tests
npm run test:unit

# Run integration tests
npm run test:integration

# Run E2E tests
npm run test:e2e

# Generate coverage report
npm run test:coverage
```

## 📦 Deployment

### Docker Deployment

```bash
# Build all services
docker-compose build

# Deploy to production
docker-compose -f docker-compose.prod.yml up -d
```

### Kubernetes Deployment

```bash
# Apply Kubernetes configurations
kubectl apply -f infrastructure/kubernetes/

# Check deployment status
kubectl get pods -n rt-muban
```

## 📖 Documentation

- [Technical Architecture](plans/digital-rt-muban-technical-architecture.md)
- [Database Schema](plans/database-schema.md)
- [API Documentation](plans/api-documentation.md)
- [Implementation Plan](plans/implementation-plan.md)
- [Executive Summary](plans/executive-summary.md)

## 🤝 Contributing

This project is part of a research initiative. For contribution guidelines, please contact the project team.

## 👥 Team

### Indonesia (UNNES)
- **Hendra Dedi Kriswanto, S.Pd., M.Pd.** - Project Representative / Project Leader
- **Dr. Imam Shofwan, M.Pd.** - Co-Investigator
- **Dr. Decky** - Co-Investigator
- **Allfine Loretha, S.Pd., M.Pd.** - Co-Investigator

### Thailand (Chulalongkorn University)
- **Wirathep Pathumcharoenwattana** - Country Co-Leader
- **Suwithida Charungkaittikul** - Co-Investigator

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

This project is funded by the **Toyota Foundation International Grant Program 2026**.

## 📞 Contact

For questions or support, please contact:
- Email: hendra.dedi@mail.unnes.ac.id
- Project Website: [Coming Soon]

---

**Project Duration**: November 2026 - October 2028  
**Budget**: JPY 10,000,000  
**Countries**: Indonesia 🇮🇩 and Thailand 🇹🇭
