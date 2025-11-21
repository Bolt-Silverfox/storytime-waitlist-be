# 🛠 CI/CD Pipeline Documentation – StoryTime Waitlist Backend

## Overview

This document describes the CI/CD pipeline for the StoryTime Waitlist backend (NestJS + Prisma).

The pipeline automates:

- Code checkout

- Dependency installation

- Backend tests

- Build

- Prisma migrations

- Deployment to the server

- PM2 service restart

It ensures your backend is always tested and deployed consistently with minimal manual work.

## Workflow Trigger

                  ┌───────────────┐
                  │ Push to main  │
                  │ or manual run │
                  └───────┬───────┘
                          │
                          ▼
                  ┌───────────────┐
                  │ Checkout code │
                  └───────┬───────┘
                          │
                          ▼
                  ┌───────────────┐
                  │ Set up Node.js│
                  └───────┬───────┘
                          │
                          ▼
                  ┌───────────────┐
                  │ Install deps  │
                  │ npm install   │
                  └───────┬───────┘
                          │
                          ▼
                  ┌───────────────┐
                  │ Run tests     │
                  │ npm test      │
                  └───────┬───────┘
                          │
                 ✅ If tests pass
                          │
                          ▼
                  ┌───────────────┐
                  │ Copy to Server│
                  │ via SCP       │
                  └───────┬───────┘
                          │
                          ▼
                  ┌───────────────┐
                  │ SSH into server│
                  │ Run deployment │
                  └───────┬───────┘
                          │
      ┌───────────────────┼───────────────────┐
      │                   │                   │
      ▼                   ▼                   ▼
┌───────────────┐ ┌───────────────┐ ┌───────────────┐
│ Install prod  │ │ Run Prisma    │ │ Build backend │
│ dependencies  │ │ migrations    │ │ npm run build │
└───────┬───────┘ └───────┬───────┘ └───────┬───────┘
        │                 │                 │
        └─────────┬───────┴───────────────┬─┘
                  ▼                        ▼
            ┌───────────────┐      ┌───────────────┐
            │ Restart PM2   │      │ Save PM2 state│
            │ service       │      └───────────────┘
            └───────┬───────┘
                    │
                    ▼
            ┌───────────────┐
            │ Backend live  │
            │ @ port 4000   │
            └───────────────┘

### 🔹 Annotated Steps

1. Trigger

- Push to main or manual workflow dispatch triggers CI/CD.

2. Checkout

- GitHub Actions pulls the latest code.

3. Node Setup

- Node.js version 22 is installed on runner.

4. Dependencies

- Installs project dependencies with npm install.

5. Tests

- Runs npm test (or continues if no tests exist).

6. Deployment

- Copies project to server with SCP.

- SSH into the server and runs deployment commands.

7. Server Deployment Steps

- Install production dependencies: npm install --production

- Run Prisma migrations: npx prisma migrate deploy

- Build backend: npm run build

- Restart PM2 service: pm2 restart ecosystem.config.js

- Save PM2 state: pm2 save

8. Backend Live

- After successful deployment, backend is live at port 4000.