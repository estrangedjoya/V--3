# V~ Game Logger - Setup Guide

## Prerequisites

You need to install Node.js first:

### Option 1: Using your package manager (Fedora)
```bash
sudo dnf install nodejs npm
```

### Option 2: Using NVM (recommended for version management)
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
# Restart terminal, then:
nvm install --lts
nvm use --lts
```

## Setup Steps

### 1. Install Node.js
Follow one of the options above, then verify:
```bash
node --version
npm --version
```

### 2. Configure Environment Variables

#### Backend (.env file already created)
Edit `backend/.env` and fill in these values:

- **JWT_SECRET**: Generate a random string (use: `openssl rand -base64 32`)
- **GIANTBOMB_API_KEY**: Get from https://www.giantbomb.com/api/
- **CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET**: Sign up at https://cloudinary.com/

#### Frontend (create if needed)
The frontend uses the backend API at `http://localhost:3001` (hardcoded in the code)

### 3. Install Dependencies

#### Backend:
```bash
cd "GameLogAppV2 copy/backend"
npm install
npx prisma generate
```

#### Frontend:
```bash
cd "GameLogAppV2 copy/frontend"
npm install
rm -rf .next  # Remove old build artifacts
```

### 4. Start the Servers

#### Terminal 1 - Backend:
```bash
cd "GameLogAppV2 copy/backend"
npm start
```
Server runs on: http://localhost:3001

#### Terminal 2 - Frontend:
```bash
cd "GameLogAppV2 copy/frontend"
npm run dev
```
App runs on: http://localhost:3000

## Database

The SQLite database already exists at `backend/prisma/dev.db` with your data intact!

If you need to reset it:
```bash
cd backend
npx prisma migrate reset
npx prisma db push
```

## API Keys You'll Need

1. **Giant Bomb API** (for game search)
   - Sign up: https://www.giantbomb.com/api/
   - Free tier should work fine

2. **Cloudinary** (for image uploads)
   - Sign up: https://cloudinary.com/
   - Free tier: 25GB storage, 25GB bandwidth/month

## Troubleshooting

### Port already in use
```bash
# Kill process on port 3001 (backend)
lsof -ti:3001 | xargs kill -9

# Kill process on port 3000 (frontend)
lsof -ti:3000 | xargs kill -9
```

### Prisma client issues
```bash
cd backend
npx prisma generate
```

### Build errors
```bash
cd frontend
rm -rf .next node_modules
npm install
npm run dev
```

## Project Structure

```
GameLogAppV2 copy/
├── backend/
│   ├── server.js          # Express API server
│   ├── prismaClient.js    # Database client
│   ├── package.json
│   ├── .env              # Environment variables (created)
│   └── prisma/
│       ├── schema.prisma  # Database schema
│       └── dev.db         # SQLite database (has your data!)
└── frontend/
    ├── src/
    │   ├── app/           # Next.js app router pages
    │   └── components/    # React components
    ├── package.json
    └── .next/             # Build output (should be regenerated)
```

## Quick Start After Node.js Install

```bash
# 1. Edit backend/.env with your API keys
nano "GameLogAppV2 copy/backend/.env"

# 2. Install and start backend
cd "GameLogAppV2 copy/backend"
npm install
npx prisma generate
npm start &

# 3. Install and start frontend (new terminal)
cd "GameLogAppV2 copy/frontend"
npm install
npm run dev
```

Then open http://localhost:3000 in your browser!
