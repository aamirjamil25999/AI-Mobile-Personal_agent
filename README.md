# My Phone Agent

Production-style monorepo scaffold for:
- `frontend`: React Native (Expo) + TypeScript + Redux Toolkit (dark theme in Redux)
- `backend`: NestJS + Prisma + PostgreSQL

Current auth methods implemented:
- Email + Password
- Phone Number + OTP
- Google ID Token
- Forgot Password + Reset Password

## 1) Project Structure

```text
.
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── features/
│   │   │   ├── auth/
│   │   │   └── theme/
│   │   ├── navigation/
│   │   ├── services/
│   │   ├── store/
│   │   └── theme/
│   └── ...
├── backend/
│   ├── prisma/
│   └── src/
│       ├── modules/
│       │   ├── auth/
│       │   ├── health/
│       │   ├── users/
│       │   └── workspace/
│       ├── config/
│       └── database/
├── docker-compose.yml
└── README.md
```

## 2) Backend Setup (NestJS)

1. Create environment file:
   - copy `backend/.env.example` -> `backend/.env`
2. Start PostgreSQL (Docker-based local setup).
3. Install dependencies and generate Prisma client.
4. Apply migrations.
5. Start backend in dev mode.

Commands:

```bash
cd backend
npm install
npm run db:up
npm run prisma:generate
npm run prisma:migrate:deploy
npm run start:dev
```

Useful DB commands:

```bash
cd backend
npm run db:logs
npm run prisma:status
npm run db:down
```

Backend base URL:
- `http://localhost:3000/api`

Health endpoint:
- `GET /api/health`

## 3) Frontend Setup (React Native + Expo)

1. Create environment file:
   - copy `frontend/.env.example` -> `frontend/.env`
2. Set API base URL and Google client IDs.
3. Install dependencies and start Expo.

Commands:

```bash
cd frontend
npm install
npm run start
```

Local API URL notes:
- iOS simulator: `http://localhost:3000/api`
- Android emulator default fallback: `http://10.0.2.2:3000/api`
- Physical Android device: `http://<YOUR_LOCAL_IP>:3000/api`

## 4) Auth API Endpoints

All endpoints are under `/api/auth`:

- `POST /email/signup`
- `POST /email/login`
- `POST /phone/request-otp`
- `POST /phone/verify-otp`
- `POST /google`
- `POST /password/forgot`
- `POST /password/reset`
- `POST /refresh`
- `POST /logout`
- `GET /me` (Bearer token required)

## 5) Workspace API Endpoints

All endpoints are under `/api/workspace` (JWT required):

- `GET/PATCH /profile`
- `GET/PUT /permissions`
- `GET/PUT /agent-settings`
- `GET /executions/history`
- `POST /executions`
- `GET /executions/:runId`
- `GET /executions/:runId/audits`
- `GET /followups/templates`
- `GET /followups/inbox`
- `POST /followups`
- `PATCH /followups/:followUpId/status`
- `PATCH /followups/:followUpId/snooze`

## 6) Local Testing Notes

### Email login
- With `DEV_AUTO_CREATE_EMAIL_USER=true` in backend `.env`, first login auto-creates user.

### Phone OTP login
- OTP is logged in backend logs for local testing.
- OTP expires in 5 minutes.
- OTP resend has a short cooldown.
- Invalid attempts are rate-limited.

### Google login
- Set Google client IDs in `frontend/.env` and backend `GOOGLE_CLIENT_IDS`.
- For local backend-only testing, you can use a dev token format:
  - `dev-google-token:user@example.com`

## 7) Code Quality Scripts

Backend:

```bash
cd backend
npm run typecheck
npm run build
```

Frontend:

```bash
cd frontend
npm run typecheck
npm run lint
```

## 8) Current Status

- Authentication flows ready (email, phone OTP, google, forgot/reset password).
- Workspace backend + related app screens connected (profile, permissions, execution, follow-ups).
- OTP is still development-mode (real SMS provider integration pending).
