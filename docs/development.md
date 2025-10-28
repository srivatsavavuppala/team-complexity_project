## Development & Testing

### Scripts
At root `package.json`:
- `npm run dev` → runs server and client concurrently
- `npm run server` → dev server (nodemon)
- `npm run client` → CRA dev server
- `npm run build` → build client
- `npm run test` → run server and client tests

Server `package.json`:
- `dev`, `start`, `test`

Client `package.json`:
- `start`, `build`, `test`, `eject`

### Testing
- Server: Jest + Supertest (`server/tests/api.test.js`)
```bash
cd server && npm test
```
- Client: CRA test runner
```bash
cd client && npm test
```

### Linting & Formatting
- CRA defaults for client; no dedicated server linter configured.

### Local DB Reset (SQLite)
Delete `server/database.sqlite` (if not using external path) and restart the server.
