# slime_volleyball

Full-stack skeleton: React (TypeScript, Vite) frontend + Node.js/Express (TypeScript) backend.

## Structure

- `backend/` — Express + TypeScript API server (default port `3001`)
- `frontend/` — React + TypeScript app via Vite (dev server port `5173`)

## Backend

```bash
cd backend
npm install
npm run dev      # ts-node-dev with reload
# npm run build && npm start   # compile to dist/ and run
```

Health check: `GET http://localhost:3001/api/health` → `{"status":"ok"}`

## Frontend

```bash
cd frontend
npm install
npm run dev      # Vite dev server
# npm run build  # production build to dist/
```
