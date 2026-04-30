# Security Policy

## Supported Use

This repository is a demo automation framework and sample insurance policy management application for learning, UI prototyping, and Playwright test automation practice.

It is not intended to be used as a production insurance, finance, claims, underwriting, or customer data system.

## Reporting Security Issues

If you find a security issue in this repository, please open a GitHub issue with:

- A short description of the issue.
- Steps to reproduce.
- Expected and actual behavior.
- Any affected files or endpoints.

Do not include real secrets, customer data, passwords, tokens, private keys, or production database information in an issue.

## Secrets and Credentials

This project should not contain committed secrets. Keep credentials in local environment variables or an untracked `.env` file.

Examples of values that must not be committed:

- API keys
- Access tokens
- Passwords
- Private keys
- Real MongoDB connection strings with credentials
- Real customer or policyholder data

## Production Notice

Before adapting this project for real production use, add proper authentication, authorization, audit logging, input hardening, secret management, rate limiting, dependency scanning, privacy controls, and secure deployment practices.
