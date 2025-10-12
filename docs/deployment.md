## Deployment

### Docker
Multi-stage Dockerfile builds client and runs server.

```bash
docker build -t ai-recruiter .
docker run -p 5000:5000 \
  -e NODE_ENV=production \
  -e PORT=5000 \
  -e JWT_SECRET=change_me \
  -e GROQ_API_KEY=your_key \
  -e DB_PATH=/app/data/database.sqlite \
  -v ai-recruiter-data:/app/data \
  ai-recruiter
```

### Docker Compose
`docker-compose.yml` provided.

```bash
docker compose up --build -d
```

- Healthcheck pings `/api/health`
- Data persisted in `ai-recruiter-data` volume

### Environment
- Ensure `GROQ_API_KEY` and `JWT_SECRET` set
- For emails, set `GMAIL_*` or SMTP variables
