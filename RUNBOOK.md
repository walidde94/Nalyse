# Nalyse Production Deployment Runbook

## 1. Prerequisites Checklist
- Node.js 18+ runtime
- PostgreSQL 15+ cluster equipped with PgBouncer connection pooling enabled.
- Redis server caching layer.
- CDN configured to point at `/frontend/dist`.

## 2. Environment Variables Registry
Ensure all production secrets are exported:
- `NODE_ENV=production`
- `PORT=3000`
- `DATABASE_URL=postgres://user:password@host:port/database`
- `JWT_SECRET=[high-entropy secret]`
- `FRONTEND_URL=[https://your-nalyse-domain.com]`

## 3. Deployment Implementation
1. Pull target tag from source control.
2. Build the frontend PWA: `cd frontend && npm i && npm run build`
3. Prepare the backend server: `cd backend && npm i && npm run build`
4. Deploy the frontend output: Synchronize the `dist` folder to CloudFront/Cloudflare Edge servers.
5. Invalidate edge CDN caches.
6. Execute zero-downtime DB migrations: `npm run typeorm migration:run`
7. Roll nodes one-by-one with `pm2 reload`.

## 4. Disaster Recovery & Rollback
1. Halt frontend CD pipelines. Use `git revert` pointing to the previous known stable SHA hash.
2. In the case of DB corruption, restore from daily automated snapshots on RDS.
3. If migrations fail, instantly apply: `npm run typeorm migration:revert`.
4. Point CDN traffic back to `v-previous` object hash.
