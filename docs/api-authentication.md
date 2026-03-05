# Nalyse API — Authentication Guide

> **Version:** 1.0  
> **Last Updated:** February 25, 2026

---

## Overview

Nalyse uses **JWT (JSON Web Tokens)** for API authentication. The auth flow consists of:

1. **Register** → Receive user + organization
2. **Login** → Receive `accessToken` (short-lived) + `refreshToken` (long-lived)
3. **Use protected endpoints** → Send `accessToken` in `Authorization` header
4. **Refresh** → Exchange `refreshToken` for a new `accessToken` when expired

---

## Endpoints

### POST `/api/auth/register`

Create a new account and organization.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123",
  "firstName": "John",
  "lastName": "Doe",
  "organizationName": "Acme Corp"
}
```

**Validation rules:**
- `email` — Required, valid email format
- `password` — Required, min 8 chars, must contain uppercase + lowercase + digit
- `firstName` — Optional, max 50 chars
- `lastName` — Optional, max 50 chars  
- `organizationName` — Optional, max 100 chars (defaults to `{firstName}'s Workspace`)

**Response (201):**
```json
{
  "message": "Registration successful. Please check your email to verify your account.",
  "user": { "id": 1, "email": "user@example.com", "firstName": "John", "lastName": "Doe" },
  "organization": { "id": 1, "name": "Acme Corp", "plan": "free" }
}
```

**Errors:**
| Code | Reason |
|------|--------|
| 400 | Validation errors (weak password, invalid email) |
| 400 | Email already registered |
| 500 | Server error |

---

### POST `/api/auth/login`

Authenticate and receive tokens.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Response (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "user",
    "organization": { "id": 1, "name": "Acme Corp", "plan": "free" }
  }
}
```

**Errors:**
| Code | Reason |
|------|--------|
| 400 | Validation errors |
| 401 | Invalid credentials |
| 401 | Account deactivated |

---

### POST `/api/auth/refresh`

Exchange a refresh token for a new access token.

**Request:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": { "id": 1, "email": "user@example.com" }
}
```

---

### GET `/api/auth/profile`

Get the authenticated user's profile. **Requires Bearer token.**

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Response (200):**
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "user",
    "isActive": true,
    "emailVerified": false,
    "organization": { "id": 1, "name": "Acme Corp" }
  }
}
```

---

### POST `/api/auth/password-reset/request`

Request a password reset token.

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response (200):**
```json
{
  "message": "If an account exists with this email, you can now reset your password.",
  "resetToken": "abc123..."
}
```

> **Note:** In production, the `resetToken` should be sent via email, not in the API response.

---

### POST `/api/auth/password-reset/confirm`

Reset the password using the token.

**Request:**
```json
{
  "token": "abc123...",
  "password": "NewSecurePass456"
}
```

**Response (200):**
```json
{
  "message": "Password reset successful",
  "user": { "id": 1, "email": "user@example.com" }
}
```

---

## Using the Bearer Token

All protected endpoints require the `Authorization` header:

```
Authorization: Bearer <accessToken>
```

### Example with `fetch`:
```javascript
const res = await fetch('http://localhost:3000/api/files', {
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  }
});
```

### Example with `curl`:
```bash
curl -H "Authorization: Bearer eyJhbG..." http://localhost:3000/api/auth/profile
```

---

## Token Lifecycle

| Token | Lifespan | Usage |
|-------|----------|-------|
| `accessToken` | 24 hours | Sent with every API request in `Authorization` header |
| `refreshToken` | 7 days | Used to get a new `accessToken` when it expires |

### Recommended Client Flow:

1. Store both tokens securely (httpOnly cookies or secure storage)
2. Attach `accessToken` to every request
3. On **401 response**, try refreshing with `refreshToken`
4. If refresh fails, redirect to login

---

## Email Normalization

The API normalizes email addresses on registration and login:

| Provider | Normalization |
|----------|---------------|
| **Gmail / Googlemail** | Strips dots and `+alias` from local part |
| **Yahoo / Ymail** | Strips `+alias` from local part |
| **Outlook / Hotmail / Live** | Strips `+alias` from local part |
| **Other** | Lowercase + trim only |

**Example:** `W.A.L.I.D+spam@Gmail.com` → `walid@gmail.com`

---

## Rate Limiting

| Scope | Limit |
|-------|-------|
| General API | 1000 requests / hour / IP |
| Auth endpoints | 20 requests / 15 min / IP |
| External API (v1) | 1000 requests / hour / IP |

Exceeding limits returns a `429 Too Many Requests` response.

---

## Error Format

All errors follow this structure:

```json
{
  "error": "Human-readable error message"
}
```

Validation errors include an array:

```json
{
  "errors": [
    { "type": "field", "msg": "Valid email is required", "path": "email", "location": "body" }
  ]
}
```
