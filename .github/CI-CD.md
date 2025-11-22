# 🛠 CI/CD Pipeline Documentation – StoryTime Waitlist Backend

## Overview

This CI/CD pipeline ensures safe, tested, and automated deployments for the StoryTime Waitlist backend (NestJS + Prisma).

Key features:

✅ All backend tests pass before deployment

✅ Consistent, reproducible builds

✅ Safe deployments to staging and production

✅ PM2 service management for uptime

✅ Minimal manual intervention

Fail-fast principle: Any failed test or deployment step blocks further actions.

---

## CI/CD Job Flow
```text
Trigger
   │ 
   ▼ 
Checkout
   │ 
   ▼ 
Node.js Setup
   │ 
   ▼ 
Install Dependencies
   │ 
   ▼ 
Run Tests 
   ├─❌ If Tests Fail → Workflow stops
   └─✅ If Tests Pass →
         Copy to Server → SSH Deploy → 
         Install Prod Dependencies → Prisma Migrations → 
         Build Backend → Restart PM2 → Save PM2 → Backend Live
```

### Detailed Steps
1. Trigger

- Push, pull request, or manual workflow_dispatch triggers the pipeline

- Conditional execution based on branch or input selection

2. Checkout

- Uses `actions/checkout@v4` to pull the latest commit

3. Node.js Setup

- Node.js v22 installed on the runner

- Uses `actions/setup-node@v4`

4. Install Dependencies

```bash
npm install
```

5. Run Backend Tests

```bash
npm test
```

- Workflow fails immediately if any test fails

- Ensures no broken code is deployed

6. Deployment (Conditional on Test Success)

        6.1 Copy to Server - securely copy files via **SCP/SSH** to the target server

        6.2 SSH Deployment - uses secrets: `SERVER_HOST`, `SERVER_USER`, `SERVER_PASSWORD`

        - Deployment commands:

                ```bash
                cd ~/storytime-be
                git fetch origin
                git reset --hard origin/<branch>
                git clean -fd

                npm install --production
                npx prisma migrate deploy
                npm run build

                pm2 restart ecosystem.config.js || pm2 start ecosystem.config.js
                pm2 save
                ```

        6.3 Deployment Safety & Best Practices
        - Fail fast: set -e halts on any failed command
        - Secrets management: GitHub secrets only, no plain text
        - SSH security: Use keys for production; passwords for staging are acceptable
        - Rollback strategy: Use PM2 previous process list or snapshot builds

        6.4 Backend Live
        - Runs on port 4000
        - PM2 ensures uptime and auto-restarts on failure

---

### Deployment Scenarios

*Staging Deployment (Automatic)*

- Trigger: Push to staging branch

- Steps:

        1. CI/CD pipeline runs tests

        2. If tests pass:

                Copy project to /var/www/storytime-be-staging

                SSH into server

                Install production dependencies: npm install --production

                Run Prisma migrations: npx prisma migrate deploy

                Build backend: npm run build

                Restart PM2 service: pm2 restart ecosystem.config.js

                Save PM2 state: pm2 save

- Outcome: Staging backend updated and live for QA/testing

*Production Deployment (Manual)*

- Trigger: Manual workflow dispatch with target: production

- Steps:

1. Verify staging tests passed

2. Trigger workflow for production

3. Deploy to /var/www/storytime-be via SSH

4. Install dependencies, run migrations, build backend

5. Restart & save PM2 service

---

## Branch Protection Rules

- Branch protection rules enforce workflows, code quality, and collaboration standards, preventing broken or untested code from reaching critical branches.

**Why?**

- Protect production-ready code; ensure all changes are reviewed, tested, and validated

- Protect staging environment; ensures deployment stability for testing and QA

### Recommended Rules:

`Main Branch Rules:`

1. Require pull request (PR) reviews before merging
2. Require status checks to pass (CI/CD tests)
3. Require conversation resolution before merging
4. Require linear history
5. Include administrators

`Staging Branch Rules:`

1. Require status checks to pass (CI/CD tests)
2. Optional PR reviews (recommended)

### Setting Up Branch Protection in GitHub:

- Navigate to Settings → Branches in your repository

- Click Add branch protection rule

- Select the branch (main or staging)

- Enable the recommended rules above

- Save changes

---

## Key Benefits

🔹 Zero downtime deployments (staging/production isolated)

🔹 Automates deployment with minimal manual intervention

🔹 Provides rollback strategies and error safety

🔹Ensures consistent, reproducible backend builds
