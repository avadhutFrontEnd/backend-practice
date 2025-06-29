# backend-practice

## Daily MERN/PERN Stack Challenge
| Day | Challenge | Status | Branch | Key Concepts |
|-----|-----------|--------|--------|--------------|
| 01-M | User Profile Management with File Upload & Audit Trail | ✅ Complete | [`day-01-Build-a-CRUD-Rest-API`](https://claude.ai/chat/14b3adb6-8ac0-4b54-b00a-2764b7b7c6ac) | Project Structure, REST API Design, JWT Authentication, File Upload with Multer, Audit Logging, MongoDB Transactions, Input Validation with Joi, Rate Limiting, Soft Deletion |
| 01-P  | User Profile Management with File Upload & Audit Trail | ✅ Complete    | [`day-01-Build-a-CRUD-Rest-API`](https://github.com/avadhutFrontEnd/backend-practice) | Project Structure, REST API Design, JWT Authentication, File Upload with Multer, Audit Logging with JSONB, PostgreSQL Transactions, Input Validation with Joi, Rate Limiting, Soft Deletion, Advisory Locks for Email Uniqueness |


## code-repo: 
https://github.com/avadhutFrontEnd/backend-practice

## MERN Stack with TypeScript
#### 1. Project Setup:
```bash
mkdir mern-typescript
cd mern-typescript
```

#### 2. Backend Setup (Node.js, Express, MongoDB with TypeScript):
```bash
# Create backend folder
mkdir backend
cd backend

# Initialize package.json
npm init -y

# Install dependencies
npm install express mongoose cors dotenv

# Install TypeScript and type definitions
npm install -D typescript ts-node nodemon @types/express @types/node @types/cors @types/mongoose
```

#### 3. Create `tsconfig.json` in the `backend` folder:
```json
{
  "compilerOptions": {
    "target": "es6",
    "module": "commonjs",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"]
}
```

#### 4. Create Backend `MERN` Project Structure:
backend/
├── src/
│   ├── config/
│   │   └── db.ts
│   ├── controllers/
│   │   └── userController.ts
│   ├── models/
│   │   └── userModel.ts
│   ├── routes/
│   │   └── userRoutes.ts
│   ├── types/
│   │   └── user.ts
│   ├── middleware/
│   │   └── auth.ts
│   └── server.ts
├── package.json
└── tsconfig.json

```bash
mkdir -p src/config src/controllers src/models src/routes src/types src/middleware && \
touch src/config/db.ts \
      src/controllers/userController.ts \
      src/models/userModel.ts \
      src/routes/userRoutes.ts \
      src/types/user.ts \
      src/middleware/auth.ts \
      src/server.ts \
      package.json \
      tsconfig.json
```


## PERN Stack with TypeScript
#### 1. Project Setup:
```bash
mkdir pern-typescript
cd pern-typescript
```

#### 2. Backend Setup (Node.js, Express, MongoDB with TypeScript):
```bash
# Create backend folder
mkdir backend
cd backend

# Initialize package.json
npm init -y

# Install dependencies
npm i bcryptjs cors dotenv express express-rate-limit helmet joi jsonwebtoken multer pg

# Install TypeScript and type definitions
npm install -D @types/bcryptjs @types/cors @types/express @types/jsonwebtoken @types/multer @types/node nodemon ts-node ts-node-dev typescript
# or 
npm i @types/bcryptjs @types/cors @types/express @types/jsonwebtoken @types/multer @types/node nodemon ts-node ts-node-dev typescript --save-dev
```

#### 3. Create `tsconfig.json` in the `backend` folder:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

#### 4. Create Backend `PERN` Project Structure:
backend/
├── src/
│   ├── config/
│   │   └── db.ts
│   ├── controllers/
│   │   └── userController.ts
│   ├── db/
│   │   └── schema.sql
│   ├── routes/
│   │   └── userRoutes.ts
│   ├── types/
│   │   └── user.ts
│   ├── middleware/
│   │   └── auth.ts
│   └── server.ts
├── package.json
└── tsconfig.json

```bash
mkdir -p src/config src/controllers src/models src/routes src/types src/middleware src/db && \
touch src/config/db.ts \
      src/controllers/userController.ts \
      src/models/userModel.ts \
      src/routes/userRoutes.ts \
      src/types/user.ts \
      src/middleware/auth.ts \
      src/db/schema.sql \
      src/server.ts \
      package.json \
      tsconfig.json \
```

#### 5. Update `package.json` Scripts (Backend)
```bash
"scripts": {
  "build": "tsc",
  "start": "node dist/server.js",
  "dev": "nodemon src/server.ts"
}
```

#### 6. Create Environment Variables
Create `.env` file in the backend folder:
```
PORT=5000
PG_USER=postgres
PG_PASSWORD=your_password
PG_HOST=localhost
PG_PORT=5432
PG_DATABASE=pern_typescript_db
JWT_SECRET=your_jwt_secret
```

#### 7. Setup PostgreSQL Database
Create your database:
```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE pern_typescript_db;

# Connect to the database
\c pern_typescript_db
```
Run the schema SQL script from `src/db/schema.sql`.


# Frontend Setup with Vite (React + TypeScript)
#### 1. Create Project using Vite:
```bash
# From project root
npm create vite@latest frontend -- --template react-ts

cd frontend

# If you want to downgrade React to a more stable version:
npm install react@18.2.0 react-dom@18.2.0
npm install @types/react@18.2.0 @types/react-dom@18.2.0 --save-dev

npm install
npm run dev
```

#### 2. Modify the `vite.config.ts` for API proxy during development:
```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      }
    }
  }
})
```



## Notes of this project (Key concepts)
- Note is present in Grok chats.

## Links:
1. [Project-Setup-guide](https://claude.ai/chat/7c0816f7-d9df-47c1-b955-47474a7b5a49)
2. [Code](https://claude.ai/chat/14b3adb6-8ac0-4b54-b00a-2764b7b7c6ac)
3. [Debugging](https://grok.com/chat/7b33e6ed-9a16-45b5-b3d4-ca8da51ec781)
