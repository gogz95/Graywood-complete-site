# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.1.x   | :white_check_mark: |
| < 1.1.0 | :x:                |

## Reporting a Vulnerability

We take the security of the Graywood project seriously. If you discover a vulnerability or security issue, please follow these guidelines:

1. **Do NOT open a public issue.**
2. Send a detailed report describing the vulnerability to the project maintainers via private communication or GitHub Security Advisories.
3. Include reproducible steps, proof-of-concept payloads (if applicable), and your assessment of the severity.
4. You will receive an initial response within 48 hours acknowledging receipt of your report.

## Zero-Credential & Clean Deployment Standard

- **No Secrets in Source:** This repository is strictly audited to contain zero production credentials, API secrets, database passwords, or private client artifacts.
- **Environment Isolation:** All runtime secrets are passed via `.env` files which are strictly excluded from version control via `.gitignore`.
- **Closed Registration:** By default, user self-registration is disabled (`users_can_register = 0`) to prevent unauthorized accounts. Client access relies on WordPress's native per-page password gating.
