## Troubleshooting

### Common Issues
- 401 Unauthorized: Missing or invalid JWT. Include `Authorization: Bearer <token>`.
- 403 Forbidden: User role lacks permission.
- 404 Not Found: Check path params and existing records.
- 413 Payload too large: JSON/file size exceeds limits.
- 429 Too Many Requests: Rate-limited. Wait and retry.

### Groq AI Errors
- Verify `GROQ_API_KEY`
- Reduce input size
- Check network egress

### File Uploads
- Only PDF, DOCX, TXT allowed; size <= 10 MB.

### Email Sending
- For Gmail, use App Passwords and enable `GMAIL_USER`/`GMAIL_PASS`.
- For SMTP, set `SMTP_*` vars correctly.

### SQLite
- Ensure `DB_PATH` writable
- Use docker volume for persistence
