# MIDI Realtime Chat

Fullstack realtime chat app (MERN + TypeScript) with JWT auth, friend management, and messaging over Socket.IO.

## Key Features
- Sign-up/sign-in, refresh token flow, JWT-protected routes.
- Friend system: send/accept requests, manage friend list.
- Realtime 1-1 and group chat, online presence, unread counts per conversation.
- Socket.IO for push messages and presence; REST API for CRUD data.
- React 19 + Tailwind UI, dark/light theme, form validation via React Hook Form + Zod.
- API documentation via Swagger UI at `/api-docs`.

## Architecture & Tech Stack
- **Backend:** Node.js, Express 5, MongoDB/Mongoose, Socket.IO, JWT, Bcrypt, Swagger UI.
- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, Zustand, React Router, Socket.IO Client, Shadcn/Radix UI, React Hook Form, Zod.
- **Pattern:** REST API + WebSocket; MVC (models/controllers); middlewares for auth and socket auth; axios interceptors with auto refresh token.

## Folder Structure
```
midi/
  backend/
    src/
      controllers/      # auth, user, friend, message, conversation logic
      middlewares/      # JWT protectedRoute, socketAuth
      models/           # User, Session, Friend, FriendRequest, Message, Conversation
      socket/           # Socket.IO server, online users map, join rooms by conversation
      libs/db.js        # MongoDB connection
      swagger.json      # API docs
  frontend/
    src/
      pages/            # SignIn, SignUp, ChatApp
      stores/           # Zustand stores (auth, chat, socket, theme)
      components/       # UI, chat, auth, sidebar
      lib/axios.ts      # axios client + refresh interceptor
```

## Requirements
- Node.js >= 18
- MongoDB running

## Backend Setup
1. `cd backend`
2. Install deps: `npm install`
3. Create `.env`:
   ```env
   PORT=5001
   MONGODB_CONECTIONSTRING=mongodb://localhost:27017/midi
   ACCESS_TOKEN_SECRET=your_jwt_secret
   CLIENT_URL=http://localhost:5173
   ```
4. Run dev: `npm run dev` (nodemon) or production: `npm start`.
5. Swagger docs: `http://localhost:5001/api-docs`.

## Frontend Setup
1. `cd frontend`
2. Install deps: `npm install`
3. Create `.env`:
   ```env
   VITE_API_URL=http://localhost:5001/api
   VITE_SOCKET_URL=http://localhost:5001
   ```
4. Run dev: `npm run dev` (Vite). Default at `http://localhost:5173`.

## Run Flow
- Start MongoDB.
- Run backend (`npm run dev` in `backend`).
- Run frontend (`npm run dev` in `frontend`).
- Open `http://localhost:5173` to sign in and chat; API docs at `/api-docs`.

## Resume Highlights
- Built a fullstack realtime chat app (React + Node + MongoDB + Socket.IO).
- Designed REST APIs with Swagger; secured via JWT + refresh token, httpOnly cookie for refresh.
- Integrated Socket.IO for presence and push messaging; room routing by conversation.
- Modern UI with Tailwind, Zustand state management, dark/light theme toggle.
- Form validation with React Hook Form + Zod; axios interceptor auto-refreshes tokens.
