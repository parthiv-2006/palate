# TasteSync Project Status Document

## Overview

This document provides a comprehensive overview of what has been built and what remains to be built for the TasteSync application. The project is organized into **Frontend** and **Backend** sections for clarity.

---

## Frontend Status

### ✅ Completed Features

#### 1. Project Setup & Configuration

- **Next.js 14+ App Router** configured
- **Tailwind CSS** styling framework integrated
- **JavaScript** (no TypeScript)
- **Path aliases** configured (`@/*` mapping via `jsconfig.json`)
- **React Query** setup for server state management
- **React Hot Toast** for notifications
- **Root Layout** with providers (`app/layout.js`)

#### 2. Authentication System

**Files Implemented:**

- `app/page.js` - Landing page with Passkey registration
- `app/auth/login/page.js` - Dedicated login page
- `components/auth/PasskeyButton.js` - Passkey registration/login button component
- `components/auth/GuestModeButton.js` - Guest mode fallback button
- `lib/auth/passkey.js` - Passkey client-side logic using `@simplewebauthn/browser`
- `lib/hooks/useAuth.js` - Authentication hook with Zustand integration
- `store/authStore.js` - Zustand store for authentication state (with persist middleware)

**Status:** ✅ UI Complete | ⚠️ **Backend Integration Issue** (Passkey created but not properly stored/verified in DB)

#### 3. Onboarding Flow

**Files Implemented:**

- `app/onboarding/page.js` - Onboarding page (protected route)
- `components/onboarding/PreferenceForm.js` - Main preferences form
- `components/onboarding/SpiceSelector.js` - Spice level selector (4 options)
- `components/onboarding/BudgetSelector.js` - Budget tier selector (4 options)
- `components/onboarding/AllergySelector.js` - Allergies multi-select (15 options: Peanuts, Tree Nuts, Dairy, Eggs, Soy, Wheat/Gluten, Fish, Shellfish, Sesame, Sulfites, Mustard, Lupin, Molluscs, Celery, Corn)

**Features:**

- 12 dietary preferences (Vegetarian, Vegan, Pescatarian, Halal, Kosher, Gluten-Free, Lactose-Free, Paleo, Keto, Low-Carb, Low-Sodium, Raw Food)
- 60+ disliked cuisine options across multiple categories
- Form validation and error handling
- Backend integration for saving preferences

**Status:** ✅ Fully Functional

#### 4. Lobby System

**Files Implemented:**

- `app/lobby/create/page.js` - Create lobby page (generates 6-digit code)
- `app/lobby/[lobbyId]/page.js` - Join lobby page (code entry)
- `app/lobby/[lobbyId]/room/page.js` - Lobby room page (participants view, start matching button)
- `components/lobby/LobbyCode.js` - 6-digit code display/entry component
- `components/lobby/ParticipantList.js` - Real-time participant list component
- `lib/api/lobby.js` - Lobby API functions
- `lib/hooks/useLobby.js` - React Query hook for lobby state (2-second polling)

**Features:**

- Unique 6-digit lobby code generation
- Real-time participant updates via polling
- Host detection and "Start Matching" button
- Backend integration for lobby creation/joining/retrieval

**Status:** ✅ Fully Functional

#### 5. UI Components

**Files Implemented:**

- `components/ui/SecurityBadge.js` - Security status badge component
- `components/ui/SecurityTooltip.js` - Security information tooltip

**Status:** ✅ Components Created (not fully integrated yet)

#### 6. API Integration

**Files Implemented:**

- `lib/api/client.js` - Centralized API request utility with error handling
- `lib/api/lobby.js` - Lobby-specific API functions

**Features:**

- Error handling with backend error message extraction
- JWT token attachment via Zustand store
- API URL fallback (`http://localhost:3001/api` if env var missing)

**Status:** ✅ Functional

---

### ❌ Not Yet Implemented (Frontend)

#### 1. Matching/Swiping System

**Required Files:**

- `app/matching/[lobbyId]/page.js` - Swipe interface page
- `components/matching/SwipeCard.js` - Individual restaurant card component
- `components/matching/SwipeContainer.js` - Swipe gesture handler
- `components/matching/SwipeStack.js` - Card stack container

**Missing Features:**

- Tinder-style swipe animations (Framer Motion)
- Keyboard shortcuts (Arrow keys, Space, Enter)
- Swipe left/right tracking
- Backend API integration for swipe events
- Restaurant data display

#### 2. Voting System

**Required Files:**

- `app/voting/[lobbyId]/page.js` - Voting interface page
- `components/voting/VoteCard.js` - Restaurant option card
- `components/voting/VoteButton.js` - Yes/No vote buttons
- `components/voting/ResultsReveal.js` - Animated results reveal

**Missing Features:**

- Vote submission UI
- Real-time vote counting
- Results reveal animation
- Backend API integration

#### 3. Results Page

**Required Files:**

- `app/results/[lobbyId]/page.js` - Results reveal page

**Missing Features:**

- Restaurant match display
- Group consensus visualization
- Share results functionality

#### 4. Additional UI Components

**Missing:**

- `components/ui/LoadingSpinner.js` - Loading states
- `components/ui/ErrorBoundary.js` - Error handling
- `components/ui/Button.js` - Reusable button component
- `components/ui/PrivacyNotice.js` - Privacy information display
- `components/layout/Header.js` - App header/navigation
- `components/layout/Footer.js` - Footer (optional)

#### 5. Security Transparency Features

**Status:** Components exist but not fully integrated into all pages

**Missing Integration:**

- Security tooltips on authentication pages
- Privacy notices on relevant pages
- Security badges in lobby views

#### 6. Responsive Design

**Status:** Not fully tested/implemented

- Mobile device testing needed
- Touch gesture support for swipe interface
- Layout adjustments for smaller screens

---

## Backend Status

### ✅ Completed Features

#### 1. Project Setup & Configuration

- **Node.js/Express** server framework
- **MongoDB Atlas** connection via Mongoose
- **CORS** configured for frontend origin
- **dotenv** for environment variables
- **nodemon** for development
- **Error handling middleware** centralized
- **JWT** token generation utility

**Files:**

- `server.js` - Server entry point
- `src/app.js` - Express app configuration
- `src/config/database.js` - MongoDB connection
- `src/middleware/errorHandler.js` - Global error handler
- `src/middleware/auth.middleware.js` - JWT authentication middleware

#### 2. Database Models

**Files Implemented:**

- `src/models/User.js` - User schema with preferences and behavioral scores
- `src/models/Passkey.js` - Passkey credential schema (credential_id, public_key, counter)
- `src/models/Lobby.js` - Lobby schema with participants and status

**Schema Details:**

- **User**: username, passkey_id (ref), preferences (spice_level, budget, allergies, dietary_preferences, disliked_cuisines), amplitude_behavioral_score
- **Passkey**: user_id (ref), credential_id (unique), public_key, counter
- **Lobby**: code (6-digit unique), host_id (ref), participants array, status (waiting/matching/voting/completed), restaurants array

**Status:** ✅ Schema Complete

#### 3. Authentication Endpoints (Passkey)

**Files Implemented:**

- `src/controllers/auth.controller.js` - Passkey registration/authentication logic
- `src/routes/auth.routes.js` - Auth route definitions

**Endpoints:**

- `POST /api/auth/passkey/register-options` - Generate registration options
- `POST /api/auth/passkey/register-verify` - Verify registration and create user
- `POST /api/auth/passkey/auth-options` - Generate authentication options
- `POST /api/auth/passkey/auth-verify` - Verify authentication and login

**Status:** ⚠️ **Partially Working** - Passkey created in browser but not properly stored/retrieved from DB. Login fails even when user exists in DB.

**Known Issues:**

- userID Buffer conversion implemented but verification flow needs debugging
- Passkey credential storage/retrieval may have issues
- User lookup during authentication may fail

#### 4. User Preferences Endpoint

**Files Implemented:**

- `src/controllers/user.controller.js` - User preferences controller
- `src/routes/user.routes.js` - User route definitions

**Endpoints:**

- `POST /api/user/preferences` - Save/update user preferences (supports guest users)

**Features:**

- Guest user support (creates temporary users if no auth)
- ObjectId validation to prevent CastError
- Preference updates for existing users

**Status:** ✅ Functional

#### 5. Lobby Management Endpoints

**Files Implemented:**

- `src/controllers/lobby.controller.js` - Lobby management logic
- `src/routes/lobby.routes.js` - Lobby route definitions
- `src/utils/generateCode.js` - 6-digit unique code generator

**Endpoints:**

- `POST /api/lobby/create` - Create new lobby (generates unique 6-digit code)
- `POST /api/lobby/join` - Join lobby by code
- `GET /api/lobby/:lobbyId` - Get lobby details with participants
- `POST /api/lobby/:lobbyId/start-matching` - Start matching process (host-only)

**Features:**

- Unique 6-digit code generation with collision checking
- Guest user creation for lobby participants
- Real-time participant tracking
- Host verification for start-matching endpoint

**Status:** ✅ Fully Functional

#### 6. Utilities

**Files:**

- `src/utils/jwt.js` - JWT token generation
- `src/utils/generateCode.js` - Lobby code generator
- `src/utils/errors.js` - Custom error classes

**Status:** ✅ Complete

---

### ❌ Not Yet Implemented (Backend)

#### 1. Swipe/Matching Endpoints

**Missing Endpoints:**

- `POST /api/lobby/:lobbyId/swipe` - Record swipe action (left/right)
- `GET /api/lobby/:lobbyId/restaurants` - Fetch restaurants for matching

**Missing Features:**

- Restaurant data management
- Swipe event tracking
- Matching algorithm logic
- Restaurant filtering based on user preferences

#### 2. Voting System Endpoints

**Missing Endpoints:**

- `POST /api/lobby/:lobbyId/vote` - Submit vote for restaurant
- `GET /api/lobby/:lobbyId/votes` - Get current vote counts
- `GET /api/lobby/:lobbyId/results` - Get final results

**Missing Features:**

- Vote aggregation
- Real-time vote updates (WebSocket or polling)
- Results calculation logic

#### 3. Restaurant Database

**Missing:**

- Restaurant model/schema
- Restaurant data seeding/fetching (Google Places API or Yelp API integration)
- Restaurant recommendation engine
- Preference-based filtering

#### 4. AI/Gemini Integration

**Missing:**

- Google Gemini API client setup
- Prompt engineering for restaurant recommendations
- Consensus engine logic (takes 4-5 user profiles, outputs restaurant)
- Integration with matching/voting system

#### 5. Behavioral Event Tracking

**Missing:**

- Event tracking endpoints (Amplitude principles)
- Event storage/schema
- Behavioral analysis logic
- Self-improving profile updates based on events

**Expected Events:**

- `lobby_joined`
- `swipe_right`
- `swipe_left`
- `vote_yes`
- `restaurant_viewed`

#### 6. WebSocket/Real-time Updates (Optional Enhancement)

**Missing:**

- WebSocket server setup
- Real-time lobby updates (instead of polling)
- Real-time vote updates
- Connection management

---

## Critical Issues to Fix

### 1. Passkey Authentication Flow

**Problem:** Passkey created in browser but not properly stored/retrieved. Login fails even when user exists in DB.

**Investigation Needed:**

- Verify Passkey model storage (credential_id, public_key format)
- Check user lookup during authentication
- Verify credential ID matching logic
- Test full registration → login flow

### 2. User ID Handling

**Problem:** Some endpoints may receive invalid ObjectId formats (guest IDs).

**Status:** Partially fixed (preferences endpoint has validation), needs review in other endpoints.

---

## Current API Contract

### Working Endpoints

```
POST   /api/auth/passkey/register-options
POST   /api/auth/passkey/register-verify  ⚠️ (Issue: Passkey storage)
POST   /api/auth/passkey/auth-options
POST   /api/auth/passkey/auth-verify      ⚠️ (Issue: User lookup)
POST   /api/user/preferences
POST   /api/lobby/create
POST   /api/lobby/join
GET    /api/lobby/:lobbyId
POST   /api/lobby/:lobbyId/start-matching
GET    /health
```

### Missing Endpoints

```
POST   /api/lobby/:lobbyId/swipe
GET    /api/lobby/:lobbyId/restaurants
POST   /api/lobby/:lobbyId/vote
GET    /api/lobby/:lobbyId/votes
GET    /api/lobby/:lobbyId/results
POST   /api/events/track  (behavioral events)
```

---

## Next Steps (Priority Order)

### Phase 5: Fix Passkey Authentication (CRITICAL)

1. Debug Passkey storage in database
2. Fix user lookup during authentication
3. Test full registration → login flow
4. Verify JWT token generation and storage

### Phase 6: Matching/Swipe System

1. Implement restaurant model/schema
2. Create swipe endpoints
3. Build swipe UI components
4. Integrate with backend

### Phase 7: Voting System

1. Create voting endpoints
2. Build voting UI components
3. Implement results calculation

### Phase 8: AI Integration

1. Set up Gemini API client
2. Build consensus engine prompt
3. Integrate with matching/voting flow

### Phase 9: Polish & Testing

1. Responsive design testing
2. Error handling improvements
3. Loading states
4. End-to-end testing

---

## File Structure Reference

### Frontend

```
client/
├── app/
│   ├── page.js                        ✅ Landing
│   ├── layout.js                      ✅ Root layout
│   ├── auth/login/page.js             ✅ Login page
│   ├── onboarding/page.js             ✅ Onboarding
│   └── lobby/
│       ├── create/page.js             ✅ Create lobby
│       ├── [lobbyId]/page.js          ✅ Join lobby
│       └── [lobbyId]/room/page.js     ✅ Lobby room
├── components/
│   ├── auth/                          ✅ Passkey, Guest
│   ├── onboarding/                    ✅ All components
│   ├── lobby/                         ✅ Code, Participants
│   └── ui/                            ✅ Badge, Tooltip
└── lib/
    ├── api/                           ✅ Client, Lobby
    ├── auth/                          ✅ Passkey logic
    └── hooks/                         ✅ useAuth, useLobby
```

### Backend

```
server/
├── server.js                          ✅ Entry point
├── src/
│   ├── app.js                         ✅ Express config
│   ├── config/database.js             ✅ MongoDB
│   ├── models/                        ✅ User, Passkey, Lobby
│   ├── controllers/                   ✅ Auth, User, Lobby
│   ├── routes/                        ✅ Auth, User, Lobby
│   ├── middleware/                    ✅ Auth, ErrorHandler
│   └── utils/                         ✅ JWT, Code, Errors
```

---

## Notes for Team & AI Assistants

1. **Authentication Issue:** The Passkey system is the current blocker. The UI works, but backend storage/retrieval needs debugging.

2. **Testing:** The lobby system is fully functional and can be used for testing the rest of the flow once Passkey is fixed.

3. **Environment Variables:**

   - Frontend: `NEXT_PUBLIC_API_URL` (defaults to `http://localhost:3001/api`)
   - Backend: `MONGODB_URI`, `JWT_SECRET`, `RP_ID`, `RP_NAME`, `RP_ORIGIN`

4. **State Management:** Zustand for client state, React Query for server state.

5. **Real-time Updates:** Currently using polling (2-second intervals). WebSocket can be added later for better performance.