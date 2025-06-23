# Security Checklist for Developers

This checklist ensures that all security best practices are followed when developing with REST-SPEC.
Use this as a guide for code reviews, pull requests, and security audits.

## Pre-Development Checklist

### Environment Setup

- [ ] Node.js version matches project requirements (≥22.11.0)
- [ ] All dependencies are up-to-date and audited (`npm audit`)
- [ ] Development environment uses HTTPS for external connections
- [ ] Environment variables are properly configured (never hardcode secrets)
- [ ] Local database connections use SSL/TLS

### Security Tools

- [ ] Pre-commit hooks are installed and working (`husky install`)
- [ ] ESLint security rules are enabled
- [ ] Dependency vulnerability scanning is configured
- [ ] Code quality tools are properly set up

## 🔒 Input Validation & Sanitization

### All User Inputs

- [ ] Use REST-SPEC input sanitization utilities for all user inputs
- [ ] Validate project names using `sanitizeProjectName()`
- [ ] Sanitize file paths using `sanitizeFilePath()`
- [ ] Validate package names using `sanitizePackageName()`
- [ ] Escape shell arguments using `escapeShellArg()`
- [ ] Validate URLs using `sanitizeUrl()`

### API Endpoints

- [ ] All request parameters are validated
- [ ] Request body size limits are enforced
- [ ] File upload restrictions are implemented
- [ ] Content-Type validation is performed
- [ ] Rate limiting is configured for all endpoints

### Database Queries

- [ ] All SQL queries use parameterized statements
- [ ] No dynamic SQL construction with user input
- [ ] Database connection uses SSL/TLS
- [ ] Sequelize ORM security features are enabled
- [ ] Database user has minimal required permissions

## 🔐 Authentication & Authorization

### JWT Implementation

- [ ] Use secure algorithms only (HS256, RS256)
- [ ] JWT secrets are stored in environment variables
- [ ] Token expiration times are reasonable (≤24 hours)
- [ ] Refresh token mechanism is implemented
- [ ] Token revocation is possible

### Password Security

- [ ] Passwords are hashed with bcrypt (≥12 rounds)
- [ ] Password strength requirements are enforced
- [ ] No passwords are logged or stored in plain text
- [ ] Password reset functionality is secure
- [ ] Account lockout after failed attempts

### Session Management

- [ ] Sessions use secure, HttpOnly cookies
- [ ] Session timeout is configured
- [ ] Session data is properly encrypted
- [ ] Cross-site request forgery (CSRF) protection
- [ ] Secure session invalidation on logout

## 🌐 API Security

### HTTP Security Headers

- [ ] Content Security Policy (CSP) is configured
- [ ] HTTP Strict Transport Security (HSTS) enabled
- [ ] X-Content-Type-Options: nosniff
- [ ] X-Frame-Options: DENY or SAMEORIGIN
- [ ] X-XSS-Protection: 1; mode=block
- [ ] Referrer-Policy is set appropriately

### CORS Configuration

- [ ] CORS origins are explicitly defined (no wildcards in production)
- [ ] Credentials are only allowed for trusted origins
- [ ] Preflight requests are properly handled
- [ ] CORS headers are validated

### Rate Limiting

- [ ] Global rate limits are configured
- [ ] Endpoint-specific rate limits for sensitive operations
- [ ] Rate limiting includes both IP and user-based limits
- [ ] Rate limit responses don't leak information

## 📁 File Operations

### File Uploads

- [ ] File type validation is implemented
- [ ] File size limits are enforced
- [ ] Files are scanned for malware
- [ ] Upload directory is outside web root
- [ ] Uploaded files are not executed

### Path Operations

- [ ] All file paths are validated against directory traversal
- [ ] Only allowed directories are accessible
- [ ] Symbolic links are handled securely
- [ ] File permissions are properly set

## 🗄️ Database Security

### Connection Security

- [ ] Database connections use SSL/TLS
- [ ] Connection strings don't contain credentials
- [ ] Database user has minimal permissions
- [ ] Connection pooling is properly configured

### Data Protection

- [ ] Sensitive data is encrypted at rest
- [ ] Personal data follows privacy regulations
- [ ] Database backups are encrypted
- [ ] Audit logging is enabled

## 🔍 Error Handling & Logging

### Error Responses

- [ ] Stack traces are not exposed in production
- [ ] Error messages don't reveal system information
- [ ] Generic error messages for authentication failures
- [ ] Proper HTTP status codes are used

### Logging

- [ ] Security events are logged (logins, failures, etc.)
- [ ] Logs don't contain sensitive information
- [ ] Log files are protected and rotated
- [ ] Centralized logging is configured

## 🧪 Testing & Validation

### Security Testing

- [ ] Unit tests include security scenarios
- [ ] Integration tests validate authentication flows
- [ ] Input validation is thoroughly tested
- [ ] Error handling is tested

### Code Review

- [ ] Security-focused code review is conducted
- [ ] All external dependencies are reviewed
- [ ] Configuration changes are validated
- [ ] Documentation is updated

## 🚀 Deployment Security

### Configuration

- [ ] Production uses secure defaults from `secure-defaults` module
- [ ] Environment-specific configurations are applied
- [ ] Secrets are managed through secure systems
- [ ] Debug modes are disabled in production

### Infrastructure

- [ ] HTTPS is enforced for all connections
- [ ] Security monitoring is configured
- [ ] Regular security updates are scheduled
- [ ] Backup and recovery procedures are tested

## Code Quality Checks

### Before Committing

- [ ] Run `npm audit` and resolve high/critical vulnerabilities
- [ ] Execute all linting rules (`npm run lint`)
- [ ] Run complete test suite (`npm test`)
- [ ] Check TypeScript types (`npm run typecheck`)
- [ ] Verify no secrets are committed

### Before Pull Request

- [ ] Security checklist is completed
- [ ] Code review includes security assessment
- [ ] Integration tests pass
- [ ] Documentation is updated
- [ ] Breaking changes are documented

## 🔧 Tool-Specific Checks

### REST-SPEC Utilities

- [ ] Use `getSecureDefaults()` for all configurations
- [ ] Apply input sanitization for all user data
- [ ] Follow established coding patterns
- [ ] Use provided security middleware

### Express.js Security

- [ ] Helmet middleware is configured
- [ ] Body parser limits are set
- [ ] Static file serving is secure
- [ ] Error handling middleware is last

### Database (MySQL/Sequelize)

- [ ] Sequelize paranoid mode is enabled
- [ ] Model validations are comprehensive
- [ ] Transactions are used for data consistency
- [ ] Database migrations are reviewed

## 🚨 Incident Response

### Security Issue Detection

- [ ] Know how to report security vulnerabilities
- [ ] Understand incident escalation procedures
- [ ] Have access to security team contacts
- [ ] Know rollback procedures

### Documentation

- [ ] Security decisions are documented
- [ ] Threat models are updated
- [ ] Security architecture changes are recorded
- [ ] Compliance requirements are tracked

## ✅ Final Verification

### Before Release

- [ ] Security audit is completed
- [ ] Penetration testing results are reviewed
- [ ] Compliance requirements are met
- [ ] Security documentation is updated
- [ ] Team training is up-to-date

### Post-Release

- [ ] Security monitoring is active
- [ ] Incident response plan is ready
- [ ] Regular security reviews are scheduled
- [ ] Community feedback channels are monitored

---

## 📚 Additional Resources

- [REST-SPEC Security Policy](../SECURITY.md)
- [Secure Defaults Documentation](../shared/secure-defaults.js)
- [Input Sanitization Guide](../shared/input-sanitizer.js)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)

## 🆘 Getting Help

If you have questions about security practices or need help with implementation:

- Review the [Security Policy](../SECURITY.md)
- Check existing security utilities in `/shared/`
- Ask during code review process
- Contact the security team at <security@rest-spec.org>

---

**Remember: Security is everyone's responsibility!**
