---
title: Deployment Configuration
sidebar_position: 11
---

# Deployment Configuration

Complete deployment configuration auto-discovered from implementation.

## GitHub Actions Workflows



### 🚀 Platform Deployment - Backend + Documentation

**File:** `deployment.yml`
**Triggers:** push, pull_request, manual
**Jobs:** on, push, paths, pull_request, jobs, deploy-backend, steps, with, with, generate-documentation, steps, with, with, deploy-documentation, steps, with, with, notify-completion, steps
**AWS Actions:** Lambda Deployment, AWS Authentication
**Secrets Used:** AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, GITHUB_TOKEN



## AWS Resources

No AWS resources discovered.

## Deployment Scripts



### web-app
- `build`



## Environment Configurations

No environment-specific configurations found.

## Deployment Process

### Manual Deployment
```bash
# Backend (Lambda)
cd backend/functions/api
npm install
zip -r deploy.zip .
aws lambda update-function-code --function-name health-platform-dev --zip-file fileb://deploy.zip

# Frontend (if applicable)
cd frontend/web-app
npm run build
npm run deploy
```

### Automated Deployment
No automated deployment configured.

---

*Configuration documentation auto-generated on 7/5/2025*
