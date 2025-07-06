---
title: Authentication
sidebar_position: 5
---

# Authentication System

JWT authentication implementation.

## Overview

The FILO Health Platform uses JWT for user authentication and authorization.

## Implemented Features

- ✅ Login
- ✅ Registration
- ✅ Token Refresh
- ✅ Logout
- ✅ Email Verification

## Authentication Flow

1. **Register/Login** - User provides credentials
2. **Token Generation** - Server returns JWT token
3. **Token Storage** - Client stores token securely
4. **Authenticated Requests** - Include token in Authorization header
5. **Token Refresh** - Refresh token before expiration

## API Endpoints



## Implementation Files

- `backend/functions/api/handlers/auth.js`
- `backend/functions/api/middleware/auth.js`
- `frontend/shared/contexts/AuthProvider.jsx`

---

*Authentication documentation auto-generated on 7/5/2025*
