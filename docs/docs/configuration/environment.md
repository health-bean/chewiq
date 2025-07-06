---
title: Environment Configuration
sidebar_position: 10
---

# Environment Configuration

Complete environment variable documentation auto-discovered from implementation.

## Overview

- **Local Environment Files:** 1
- **Lambda Environment Variables:** 5
- **GitHub Secrets:** 3
- **Required Variables:** 4

## Required Variables


These variables are required for the application to function properly:

- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `JWT_EXPIRY`
- `JWT_REFRESH_EXPIRY`


## Local Environment Files



### frontend/web-app/.env.development

- `VITE_API_BASE_URL`: https://suhoxvn8ik.execute-api.us-east-1.amazonaws.com/dev



## Lambda Environment Variables


These variables are currently configured in the Lambda function:

- `JWT_EXPIRY`: 15m
- `JWT_REFRESH_SECRET`: [HIDDEN]
- `JWT_REFRESH_EXPIRY`: 7d
- `JWT_SECRET`: [HIDDEN]
- `DB_PASSWORD`: [HIDDEN]


## GitHub Secrets


These secrets are used in GitHub Actions workflows:

- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `GITHUB_TOKEN`


## Setup Instructions

### Local Development
1. Copy environment template:
   ```bash
   cp .env.example .env.development
   ```

2. Configure required variables:
   - `JWT_SECRET`
   - `JWT_REFRESH_SECRET`
   - `JWT_EXPIRY`
   - `JWT_REFRESH_EXPIRY`

### Lambda Deployment
Environment variables are automatically configured via GitHub Actions.

### GitHub Repository Setup
Add these secrets to your GitHub repository:
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `GITHUB_TOKEN`

## AWS Resources

No AWS resource information available.

---

*Environment documentation auto-generated on 7/5/2025*
