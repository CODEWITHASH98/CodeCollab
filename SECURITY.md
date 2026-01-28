# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | ✅ Yes             |
| < 1.0   | ❌ No              |

## Reporting a Vulnerability

We take security seriously. If you find a vulnerability, please report it privately.

**DO NOT** open public issues for security vulnerabilities.

### How to Report
Please email us at **security@codecollab.io** with:
- A description of the vulnerability.
- Steps to reproduce the issue.
- Potential impact.

We aim to respond within **48 hours** and will prioritize a fix.

## Security Measures

CodeCollab implements several layers of security:

- **Sandboxed Execution**: User code runs in isolated Docker containers via Piston API to prevent system access.
- **Input Sanitization**: All API inputs are validated using Zod schemas to prevent injection attacks.
- **Authentication**: Secure JWT-based authentication with expiration and refresh tokens.
- **Rate Limiting**: API endpoints are rate-limited to prevent abuse and DDoS attacks.
- **HTTPS**: All data in transit is encrypted via HTTPS/WSS.
- **SQL Injection Prevention**: We use Prisma ORM which uses parameterized queries by default.
