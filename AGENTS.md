# AGENTS.md

Guidance for coding agents working in this repository.

## Project Overview

This is `MIDI Realtime Chat`, a full-stack chat application.

- Backend: Node.js, Express 5, MongoDB/Mongoose, Socket.IO, JWT auth, cookie-based refresh tokens, Cloudinary avatar/image upload, Supabase S3 file upload, Resend password reset email, Swagger UI.
- Frontend: React 19, TypeScript, Vite, Tailwind CSS, Zustand, React Router 7, Socket.IO client, shadcn/Radix UI, lucide-react, React Hook Form, Zod, Sonner, Emoji Mart, infinite scroll.
- Pattern: REST APIs for data changes and reads, Socket.IO for realtime presence/messages/read events.

## Repository Layout

```text
backend/
  src/
    server.js                 Express middleware/routes and startup
    socket/index.js           shared Express app + HTTP server + Socket.IO
    libs/                     MongoDB connection (db.js) and Supabase S3 helper (supabaseS3.js)
    routes/                   Express route modules (authRoute.js, conversationRoute.js, friendRoute.js, messageRoute.js, userRoute.js)
    controllers/              request handlers and socket helper queries (auth, conversation, friend, message, user controllers)
    middlewares/              auth, socket auth, friend/membership checks, upload (Cloudinary/multer)
    models/                   Mongoose schemas (User, Session, Friend, FriendRequest, Message, Conversation)
    utils/messageHelper.js    conversation update and Socket.IO emit helpers
    utils/emailHelper.js      Resend HTTP API reset-password OTP email helper
    swagger.json              Swagger UI document served at /api-docs

frontend/
  src/
    App.tsx                   router, theme setup, socket connect/disconnect
    main.tsx                  React entry
    lib/                      axios instance/interceptors (axios.ts) and classname helper (utils.ts)
    hooks/                    custom react hooks (use-mobile.ts for layout check)
    services/                 API wrappers (authService.ts, chatService.ts, friendService.ts, userService.ts)
    stores/                   Zustand stores (useAuthStore, useChatStore, useFriendStore, useSocketStore, useThemeStore, useUserStore)
    types/                    shared TS interfaces (chat.ts, store.ts, user.ts)
    pages/                    route pages (SignInPage.tsx, SignUpPage.tsx, ForgotPasswordPage.tsx, ChatAppPage.tsx)
    components/               chat/auth/sidebar/profile/friend UI components
    components/ui/            shadcn/Radix primitives
    index.css                 Tailwind v4 imports, CSS variables, utility classes
```

## Commands

Run commands from the matching package directory unless noted.

- Backend dev: `cd backend && npm run dev`
- Backend production start: `cd backend && npm start`
- Backend syntax check: `node --check src/server.js`
- Frontend dev: `cd frontend && npm run dev`
- Frontend build/typecheck: `cd frontend && npm run build`
- Frontend lint: `cd frontend && npm run lint`
- Frontend preview: `cd frontend && npm run preview`

There are no dedicated automated test scripts in either `package.json` at the time this file was written.

## Environment

Backend expects a `.env` in `backend/`.

- `PORT`
- `MONGODB_CONECTIONSTRING`
- `ACCESS_TOKEN_SECRET`
- `CLIENT_URL`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `PUBLIC_SUPABASE_URL`
- `SUPABASE_S3_STORAGE_URL`
- `SUPABASE_S3_ACCESS_KEY`
- `SUPABASE_S3_SECRET_KEY`
- `SUPABASE_S3_BUCKET_NAME`
- `SUPABASE_S3_REGION`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `RESEND_FROM_NAME` (optional; defaults to `Midi Chat Support`)

Note the existing spelling `MONGODB_CONECTIONSTRING` is misspelled but currently used by the code. Do not silently rename it unless updating every dependent environment.

Frontend uses Vite env files in `frontend/`.

- `npm run dev` uses `.env.development`.
- `npm run build` uses `.env.production`.
- Required variables: `VITE_API_URL`, `VITE_SOCKET_URL`.

Axios uses `VITE_API_URL`; Socket.IO client uses `VITE_SOCKET_URL`.

## Backend Conventions

- Backend files are ES modules because `backend/package.json` has `"type": "module"`.
- Use explicit `.js` extensions in local backend imports.
- `server.js` imports `{ app, server }` from `src/socket/index.js`; Socket.IO and Express share the same HTTP server.
- Public routes are mounted before `protectedRoute`: currently `/api/auth`.
- Private routes are mounted after `app.use(protectedRoute)`: `/api/users`, `/api/friends`, `/api/messages`, `/api/conversations`.
- Auth routes include signup/signin/signout/refresh plus `/forgot-password` and `/reset-password`.
- `protectedRoute` reads `Authorization: Bearer <accessToken>`, verifies `ACCESS_TOKEN_SECRET`, loads the user, and assigns `req.user`.
- Socket auth reads `socket.handshake.auth.token`, verifies it, loads the user, and assigns `socket.user`.
- Refresh tokens are opaque random tokens stored in `Session` and sent as an httpOnly cookie named `refreshToken`.
- Forgot-password uses a 6-digit OTP stored on `User.resetPasswordCode` with `resetPasswordExpires`; resetting a password deletes all sessions for that user.
- Reset-password email is sent through the Resend HTTP API in `emailHelper.js`, not SMTP. Keep it on HTTPS/API-key flow so it works on hosts that block SMTP ports.
- Avatar uploads use Cloudinary and are uploaded via `uploadImageFromBuffer` in `uploadMiddleware.js` (under `midi_app/avatars`).
- Message image uploads go through `/api/messages/upload-image` and Cloudinary (under `midi_app/messages`); non-image attachments go through `/api/messages/upload-file` and Supabase S3 via `uploadFileToSupabaseS3` in `supabaseS3.js`.
- Direct/group conversation creation and message sending rely on friend/membership middlewares. Keep these checks in place for new message/conversation endpoints.
- Message writes should use `updateConversationAfterCreateMessage` and `emitNewMessage` so unread counts, last message, and rooms stay consistent.
- Conversation messages are fetched from `/api/conversations/:conversationId/messages` and use cursor-style pagination in the frontend store.
- Socket events currently used by the frontend: `online-users`, `new-message`, `read-message`, `new-group`, and client-emitted `join-conversation`.
- Friend pairs are normalized with sorted user IDs. Preserve this invariant when changing friendship logic.
- Dynamic imports like `const { updateOnlineStatusPreference } = await import('../socket/index.js')` are used to prevent circular dependencies between socket setup and database controllers.
- User profile routes include `/me`, `/search`, `/uploadAvatar`, `/update`, `/preferences`, `/change-password`, and `/delete-account`.

## Frontend Conventions

- Use the `@/*` alias for imports from `frontend/src`.
- Business/network flow is usually: component -> Zustand store -> service -> `lib/axios.ts`.
- Keep API calls in `src/services/*`; keep state transitions and toast side effects in `src/stores/*` unless a file already has a local pattern.
- Auth state lives in `useAuthStore`; only `user` is persisted under `auth-storage`, while `accessToken` is in memory and refreshed from the cookie.
- Axios automatically attaches `Authorization: Bearer <accessToken>` and retries 403 responses by calling `/auth/refresh` up to 4 times, except auth endpoints.
- Chat state lives in `useChatStore`; conversations are persisted under `chat-storage`, while messages are stored by conversation ID with `items`, `hasMore`, and `nextCursor`.
- Socket lifecycle lives in `useSocketStore` and is connected from `App.tsx` when an access token exists.
- Friend/relationship state lives in `useFriendStore` and user profiles/preferences live in `useUserStore`.
- Theme state (dark/light mode) is managed by `useThemeStore` and persisted under `theme-storage`.
- Use existing type definitions from `src/types/user.ts`, `src/types/chat.ts`, and `src/types/store.ts`; update them when API shapes change.
- UI primitives are shadcn/Radix-style components under `src/components/ui`. Prefer extending existing variants/classes over introducing a second component system.
- Icons are from `lucide-react`.
- Styling uses Tailwind plus CSS variables/utilities in `src/index.css`, including `glass`, `glass-strong`, `bg-gradient-chat`, `transition-smooth`, `beautiful-scrollbar`, `chat-bubble-*`, and status classes.
- The app currently uses `react-router` imports, not `react-router-dom`.
- Auth pages are public at `/signin`, `/signup`, and `/forgot-password`; `/` is protected by `ProtectedRoute`.
- Message input supports emoji/image/file flows; keep upload calls in `chatService` and `useChatStore` rather than uploading directly from unrelated components.

## Feature Workflows

When adding a new authenticated REST feature:

1. Add or update a Mongoose model if data shape changes.
2. Add controller logic in `backend/src/controllers`.
3. Add route wiring in `backend/src/routes`.
4. Mount the route in `backend/src/server.js` after `protectedRoute` if it is private.
5. Add/update a frontend service in `frontend/src/services`.
6. Add/update Zustand store state/actions in `frontend/src/stores`.
7. Update frontend types in `frontend/src/types`.
8. Update the component/page that consumes the feature.

When adding realtime behavior:

1. Decide the room: user ID room or conversation ID room.
2. Emit from backend using the shared `io` from `backend/src/socket/index.js`.
3. Add or update listeners in `frontend/src/stores/useSocketStore.ts`.
4. Update `useChatStore` or another store rather than putting large socket state transitions in components.

## Current Sharp Edges

Be careful around these existing issues and conventions:

- Some Vietnamese UI strings appear mojibake-encoded in source files. Do not reformat entire files or rewrite unrelated strings unless the task is specifically to fix encoding/text.
- Frontend TypeScript is strict with `noUnusedLocals` and `noUnusedParameters`; unused imports such as accidental auto-imports will break `npm run build`.
- Frontend TypeScript also enables `erasableSyntaxOnly` and `noUncheckedSideEffectImports`; prefer simple type-only imports and avoid unsupported TypeScript constructs.
- `authService` has an existing method named `singIn`, and callers use that spelling. Rename only with coordinated updates.
- `server.js` reads Swagger JSON with a relative path `./src/swagger.json`; running backend commands from outside `backend/` can affect that path.
- Cookie settings in `signIn` use `secure: true` and `sameSite: 'none'`, which is production/CORS-sensitive.
- Existing indexes include typos in some schemas, for example `participant.userId` and `conversasionId`. Treat index fixes as migrations, not casual cleanup.
- `fix-friend-index.js` is a one-off migration helper for old friend indexes.
- Do not remove `withCredentials: true` from axios/auth requests unless replacing the refresh-token flow.
- Do not change `MONGODB_CONECTIONSTRING` spelling without an explicit migration plan.
- `emailHelper.js` uses Resend env vars and throws response details for provider errors; do not log `RESEND_API_KEY`.

## Verification Guidance

For backend-only changes:

- Run `node --check` on changed backend files and `src/server.js`.
- If behavior changed, start backend with `npm run dev` and exercise the relevant route manually.

For frontend changes:

- Run `npm run build` to typecheck and build.
- Run `npm run lint` for lint coverage.
- If UI behavior changed, run `npm run dev` and verify the route visually.

For full-stack changes:

- Verify backend CORS `CLIENT_URL` matches the frontend origin.
- Verify frontend `VITE_API_URL` and `VITE_SOCKET_URL` point to the intended backend.
- Check both REST behavior and relevant Socket.IO events.
