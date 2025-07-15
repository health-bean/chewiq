# Health Platform Documentation

A comprehensive health platform with web application, practitioner dashboard, and backend API services.

## 🏗️ Architecture Overview

```
health-platform/
├── frontend/
│   ├── web-app/           # Main user-facing application
│   ├── practioner-dashboard/ # Healthcare provider interface
│   └── shared/            # Shared components and utilities
├── backend/
│   ├── functions/         # API endpoints and business logic
│   ├── database/          # Schema, migrations, and queries
│   └── scripts/           # Utility and maintenance scripts
└── docs/                  # Project documentation
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL 14+
- AWS CLI (for deployment)

### Local Development Setup

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd health-platform
   npm install
   ```

2. **Backend Setup**
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env with your database credentials
   ./setup-dev-env.sh
   ```

3. **Frontend Setup**
   ```bash
   cd frontend/shared && npm install
   cd ../web-app && npm install
   cd ../practioner-dashboard && npm install
   ```

4. **Database Setup**
   ```bash
   # Run from backend directory
   npm run db:migrate
   npm run db:seed
   ```

## 📚 Documentation Sections

- [**Architecture Guide**](./architecture.md) - System design and component relationships
- [**API Documentation**](./api/README.md) - Complete API reference
- [**Frontend Guide**](./frontend/README.md) - Component library and UI patterns
- [**Database Guide**](./database/README.md) - Schema, migrations, and queries
- [**Deployment Guide**](./deployment/README.md) - AWS deployment and CI/CD
- [**Development Guide**](./development/README.md) - Coding standards and workflows
- [**Security Guide**](./security/README.md) - Security practices and logging

## 🔧 Development Commands

```bash
# Backend
npm run dev:backend      # Start backend development server
npm run test:backend     # Run backend tests
npm run db:migrate       # Run database migrations

# Frontend
npm run dev:web          # Start web app development
npm run dev:dashboard    # Start practitioner dashboard
npm run build:all        # Build all frontend applications

# Documentation
npm run docs:dev         # Start documentation server
npm run docs:build       # Build documentation
```

## 🌟 Key Features

- **Multi-tenant Architecture** - Supports multiple healthcare organizations
- **Role-based Access Control** - Patient, practitioner, and admin roles
- **Real-time Updates** - WebSocket integration for live data
- **Mobile Responsive** - Works across all device types
- **HIPAA Compliant** - Security-first design with audit logging
- **JSONB Data Storage** - Flexible, structured data with PostgreSQL
- **Secure Logging** - Sanitized logs that protect sensitive information

## 🔒 Security Features

- **Safe Logging Utility** - Prevents sensitive data exposure in logs
- **JWT Authentication** - Secure token-based authentication with refresh tokens
- **Session Storage** - Health data stored securely in browser sessions
- **Environment-Aware Logging** - Minimal logging in production environments
- **Data Sanitization** - Automatic removal of tokens, passwords, and PII from logs

## 🗄️ Database Architecture

### **Modern JSONB Structure:**
- **journal_entries** - Daily reflection data stored in JSONB format
- **timeline_entries** - Event data with structured JSONB content
- **Flexible Schema** - Easy to extend without migrations
- **Optimized Queries** - GIN indexes for fast JSONB searches

## 🤝 Contributing

See [Development Guide](./development/README.md) for coding standards, git workflow, and contribution guidelines.

## 📄 License

[Add your license information here]

---

**Last Updated**: July 15, 2025  
**Version**: 2.0 (Post-JSONB Migration)  
**Status**: Active Development