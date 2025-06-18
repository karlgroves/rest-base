# Global Rules

> **Navigation:** [📖 Main Documentation](./README.md#documentation-navigation) | [🏗️ Node.js Standards](./node_structure_and_naming_conventions.md) | [🔄 API Operations](./operations-and-responses.md) | [📨 Request Patterns](./request.md)

## Authentication and Security

* All requests to the API (other than the authentication and register routes) must have a JWT bearer token.
* All requests **should** have `Accept-Language` header set to a supported ISO 2-character language code.
* All responses **must** have `Content-Language` header set to an ISO 2-character language code which matches the `Accept-Language` header OR which defaults to `en`.
* All `GET`, `POST`, and `PUT` responses **must** have a `Content-Type` header with a value of `application/json`
* All `POST` and `PUT` requests **must** have a `Content-Type` header with a value of `application/json`
* All successful `DELETE` responses **must not** have a body.
* All `HEAD` responses **must not** have a body.
* `PUT` requests **may not** provide all possible fields in their requests.
* `PUT` requests **must** have the unique ID for the records being updated, however all other properties are optional (as the assumption is that any required properties were supplied during `POST`).
* All fields that are supplied during `PUT` requests must pass their relevant validation requirements.
* All successful `POST` and `PUT` requests will respond with the full object details as would be retrieved by a "`GET` by ID" request.
* All `description` fields (or fields with similar purpose) **must** accept Markdown
* All JSON responses **must* adhere to the [JSON specification](https://datatracker.ietf.org/doc/html/rfc8259)
* All connections **should** use `Keep-Alive`
* All routes **should** use `Content-Encoding: gzip`
* All dates & times **should** be stored in the database as UTC timestamps
* All dates & times, when returned by the API, **should** be RFC 3339 formatted.

## Rate Limiting

* **Rate Limit Policy**: API endpoints are protected by rate limiting to ensure fair usage and prevent abuse.
* **Default Limits**:
  - **Authenticated users**: 1,000 requests per hour per user
  - **Unauthenticated users**: 100 requests per hour per IP address
  - **Administrative endpoints**: 100 requests per hour per user
* **Rate Limit Headers**: All responses include rate limiting information:
  - `X-RateLimit-Limit`: Maximum number of requests allowed in the time window
  - `X-RateLimit-Remaining`: Number of requests remaining in the current window
  - `X-RateLimit-Reset`: Unix timestamp when the rate limit window resets
  - `Retry-After`: Number of seconds to wait before making another request (included when rate limited)
* **Rate Limit Responses**: When rate limits are exceeded:
  - Status Code: `429 Too Many Requests`
  - Response Body: Standard error format with `too_many_requests` code
  - Retry-After header with recommended wait time
* **Rate Limit Bypass**: Premium tier users and internal services may have higher limits or bypass rate limiting entirely
* **Endpoint-Specific Limits**: Critical endpoints may have stricter limits:
  - Authentication endpoints: 10 attempts per 15 minutes per IP
  - Password reset: 5 attempts per hour per email address
  - File upload endpoints: 20 requests per hour per user
* **Burst Handling**: Short bursts above the limit are allowed using a token bucket algorithm
* **Monitoring**: Rate limit violations are logged and monitored for security analysis

## CORS (Cross-Origin Resource Sharing) Policy

* **CORS Configuration**: All API endpoints must implement proper CORS headers to control cross-origin access.
* **Allowed Origins**: Configure specific allowed origins rather than using wildcard (`*`) in production:
  - Development: `http://localhost:3000`, `http://localhost:3001` (for local development)
  - Staging: `https://staging.example.com`, `https://staging-admin.example.com`
  - Production: `https://app.example.com`, `https://admin.example.com`
* **Allowed Methods**: Explicitly specify allowed HTTP methods:
  - Standard endpoints: `GET`, `POST`, `PUT`, `DELETE`, `HEAD`, `OPTIONS`
  - Administrative endpoints: `GET`, `POST`, `PUT`, `DELETE` (no HEAD/OPTIONS for security)
* **Allowed Headers**: Define permitted request headers:
  - Required: `Content-Type`, `Authorization`, `Accept`, `Accept-Language`
  - Optional: `X-Requested-With`, `Cache-Control`, `X-Client-Version`
* **Exposed Headers**: Specify which response headers clients can access:
  - `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
  - `Content-Language`, `Content-Length`, `Date`
  - `Location` (for 201/202 responses), `Retry-After` (for 429 responses)
* **Credentials Handling**: 
  - `Access-Control-Allow-Credentials: true` for authenticated endpoints
  - Cookie-based authentication requires explicit origin allowlist (no wildcards)
* **Preflight Caching**: Set appropriate `Access-Control-Max-Age` header:
  - Development: 300 seconds (5 minutes) for faster iteration
  - Production: 86400 seconds (24 hours) for performance
* **Security Considerations**:
  - Never use `Access-Control-Allow-Origin: *` with credentials
  - Validate Origin header against allowlist before setting CORS headers
  - Log and monitor unauthorized CORS requests for security analysis
* **Environment-Specific Configuration**: Use environment variables for CORS origins:
  ```javascript
  const allowedOrigins = process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'];
  ```
