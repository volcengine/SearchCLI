# Security Policy

If you believe you have found a security issue in SearchCLI, report it
privately.

## Reporting

Do not open a public issue with exploit details.

Notify ByteDance Security through one of these channels:

- [ByteDance Security Center](https://security.bytedance.com/src)
- [sec@bytedance.com](mailto:sec@bytedance.com)

If the repository hosting platform later enables private vulnerability
reporting, you may also use that route.

## What To Include

Please include:

1. A clear title
2. Affected command, skill, or file path
3. Reproduction steps
4. Impact
5. Environment details
6. Suggested mitigation, if known

## Sensitive Material

Never include:

- Volcengine AK/SK
- tokens, cookies, or session secrets
- customer data
- private dataset contents

Use redacted examples whenever possible.

## Scope Notes

This repository is a CLI and installable skill bundle for Viking AI Search on
Volcengine.

Useful reports typically involve:

- credential handling
- unsafe command execution
- path traversal or arbitrary file write/read
- packaging or install-time trust issues
- skill-install safety issues

Reports that only restate documented operator behavior, or require a user to
intentionally paste secrets into chat against the documented guidance, are
generally not security vulnerabilities.
