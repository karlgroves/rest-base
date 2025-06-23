# API Documentation

Auto-generated API documentation

**Version:** 1.0.0

## Endpoints

### Users

#### GET /api/users

Get all users

Retrieves a paginated list of all users in the system with optional filtering

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| page=1 | number | No | - Page number for pagination |
| limit=10 | number | No | - Number of items per page (max 100) |
| sort=createdAt | string | No | - Sort field (createdAt, updatedAt, email, name) |
| order=desc | string | No | - Sort order (asc or desc) |
| search | string | No | - Search term for email or name |
| role | string | No | - Filter by user role (user, admin, moderator) |
| active | boolean | No | - Filter by active status |

**Responses:**

| Status | Description |
|--------|-------------|
| 200 | - Successful response with user list and pagination info |
| 400 | - Invalid query parameters |
| 401 | - Missing or invalid authentication token |
| 403 | - Insufficient permissions |

**Security:** bearerAuth

---

#### POST /api/users

Create a new user

Creates a new user account with the provided information. Requires admin privileges.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| email - User email address (must be unique) | string | Yes | - |
| password - User password (min 8 chars, must include number and special char) | string | Yes | - |
| name - User full name | string | Yes | - |
| role=user | string | No | - User role (user, admin, moderator) |
| active=true | boolean | No | - Whether the user account is active |
| profile | object | No | - Additional profile information |
| profile.phone | string | No | - Phone number |
| profile.avatar | string | No | - Avatar URL |

**Responses:**

| Status | Description |
|--------|-------------|
| 201 | - User created successfully |
| 400 | - Validation error or missing required fields |
| 401 | - Unauthorized |
| 403 | - Insufficient permissions |
| 409 | - Email already exists |

**Security:** bearerAuth

---

#### GET /api/users/:id

Get user by ID

Retrieves detailed information about a specific user

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| id - User ID (UUID format) | string | Yes | - |

**Responses:**

| Status | Description |
|--------|-------------|
| 200 | - User found |
| 401 | - Unauthorized |
| 403 | - Insufficient permissions (can only view own profile unless admin) |
| 404 | - User not found |

**Security:** bearerAuth

---

#### PUT /api/users/:id

Update user

Updates user information. Users can update their own profile, admins can update anyone.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| id - User ID | string | Yes | - |
| email | string | No | - New email address |
| name | string | No | - New name |
| password | string | No | - New password |
| role | string | No | - New role (admin only) |
| active | boolean | No | - Active status (admin only) |

**Responses:**

| Status | Description |
|--------|-------------|
| 200 | - User updated successfully |
| 400 | - Validation error |
| 401 | - Unauthorized |
| 403 | - Insufficient permissions |
| 404 | - User not found |
| 409 | - Email already in use |

**Security:** bearerAuth

---

#### DELETE /api/users/:id

Delete user

Permanently deletes a user account. This action cannot be undone.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| id - User ID | string | Yes | - |

**Responses:**

| Status | Description |
|--------|-------------|
| 204 | - User deleted successfully |
| 401 | - Unauthorized |
| 403 | - Insufficient permissions (admin only) |
| 404 | - User not found |

**Security:** bearerAuth

---

#### POST /api/users/:id/reset-password

Reset user password

Sends a password reset email to the user

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| id - User ID | string | Yes | - |

**Responses:**

| Status | Description |
|--------|-------------|
| 200 | - Password reset email sent |
| 401 | - Unauthorized |
| 403 | - Insufficient permissions |
| 404 | - User not found |
| 429 | - Too many requests (rate limited) |

**Security:** bearerAuth

---

#### GET /api/users/:id/sessions

Get user sessions

Retrieves all active sessions for a user

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| id - User ID | string | Yes | - |

**Responses:**

| Status | Description |
|--------|-------------|
| 200 | - List of active sessions |
| 401 | - Unauthorized |
| 403 | - Can only view own sessions unless admin |
| 404 | - User not found |

**Security:** bearerAuth

---

### Admin

#### GET /api/users

Get all users

Retrieves a paginated list of all users in the system with optional filtering

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| page=1 | number | No | - Page number for pagination |
| limit=10 | number | No | - Number of items per page (max 100) |
| sort=createdAt | string | No | - Sort field (createdAt, updatedAt, email, name) |
| order=desc | string | No | - Sort order (asc or desc) |
| search | string | No | - Search term for email or name |
| role | string | No | - Filter by user role (user, admin, moderator) |
| active | boolean | No | - Filter by active status |

**Responses:**

| Status | Description |
|--------|-------------|
| 200 | - Successful response with user list and pagination info |
| 400 | - Invalid query parameters |
| 401 | - Missing or invalid authentication token |
| 403 | - Insufficient permissions |

**Security:** bearerAuth

---

#### POST /api/users

Create a new user

Creates a new user account with the provided information. Requires admin privileges.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| email - User email address (must be unique) | string | Yes | - |
| password - User password (min 8 chars, must include number and special char) | string | Yes | - |
| name - User full name | string | Yes | - |
| role=user | string | No | - User role (user, admin, moderator) |
| active=true | boolean | No | - Whether the user account is active |
| profile | object | No | - Additional profile information |
| profile.phone | string | No | - Phone number |
| profile.avatar | string | No | - Avatar URL |

**Responses:**

| Status | Description |
|--------|-------------|
| 201 | - User created successfully |
| 400 | - Validation error or missing required fields |
| 401 | - Unauthorized |
| 403 | - Insufficient permissions |
| 409 | - Email already exists |

**Security:** bearerAuth

---

#### DELETE /api/users/:id

Delete user

Permanently deletes a user account. This action cannot be undone.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| id - User ID | string | Yes | - |

**Responses:**

| Status | Description |
|--------|-------------|
| 204 | - User deleted successfully |
| 401 | - Unauthorized |
| 403 | - Insufficient permissions (admin only) |
| 404 | - User not found |

**Security:** bearerAuth

---

### Authentication

#### POST /api/users/:id/reset-password

Reset user password

Sends a password reset email to the user

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| id - User ID | string | Yes | - |

**Responses:**

| Status | Description |
|--------|-------------|
| 200 | - Password reset email sent |
| 401 | - Unauthorized |
| 403 | - Insufficient permissions |
| 404 | - User not found |
| 429 | - Too many requests (rate limited) |

**Security:** bearerAuth

---

### Security

#### GET /api/users/:id/sessions

Get user sessions

Retrieves all active sessions for a user

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| id - User ID | string | Yes | - |

**Responses:**

| Status | Description |
|--------|-------------|
| 200 | - List of active sessions |
| 401 | - Unauthorized |
| 403 | - Can only view own sessions unless admin |
| 404 | - User not found |

**Security:** bearerAuth

---

### System

#### GET /api/health

Health check

Simple health check endpoint for monitoring

**Responses:**

| Status | Description |
|--------|-------------|
| 200 | - Service is healthy |

---
