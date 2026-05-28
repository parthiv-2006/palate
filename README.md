# Palate

Group dining app that replaces "where should we eat?" with a structured session: shared vibe checks, AI-curated restaurant cards from Foursquare, Tinder-style swiping, and a blind vote to surface a consensus winner.

[![Live Demo](https://img.shields.io/badge/live%20demo-palate--self.vercel.app-orange)](https://palate-self.vercel.app/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green?logo=node.js)](https://nodejs.org/)
[![Built at UoftHacks 2026](https://img.shields.io/badge/UoftHacks-2026-blueviolet)](https://uofthacks.com/)

> **Hero screenshot needed:** capture the landing/auth page at 1440x900. Save as `.github/assets/landing-desktop.png` and replace this line with `![Palate landing page](.github/assets/landing-desktop.png)`.

---

## What It Is

Friend groups deadlock on restaurant choices because no one's preferences are weighted equally and no one wants to be the person who vetoes options. Palate structures the decision as a five-stage session: preference capture, vibe check, AI keyword generation, parallel swipe filtering, and blind voting. The system learns from post-meal feedback by aggregating per-cuisine and per-tag statistics into each user's profile, so the Gemini keyword prompt becomes more accurate with each completed session.

The non-trivial design choice: the restaurant deck generates fresh per session rather than serving from a static dataset. Gemini 2.5 Flash synthesizes all participants' behavioral histories and current vibe checks into 5-8 cuisine keywords. A single Foursquare Places API v3 search on those keywords returns photos, ratings, and price tiers in one call, replacing an earlier two-step Geoapify + Foursquare enrichment flow that failed silently when cross-referencing produced mismatched IDs.

Built at UoftHacks 2026 by a team of four, addressing the Amplitude Self-Improving Products challenge and the 1Password Passkey Integration challenge.

---

## Screenshots

### Landing Page
> **Screenshot needed:** the registration/login page at 1440x900. Save as `.github/assets/landing-desktop.png`.

### Landing Page (Mobile)
> **Screenshot needed:** the same page at 390x844. Save as `.github/assets/landing-mobile.png`.

### Onboarding
> **Screenshot needed:** the first-run preference form where users set spice level, budget, dietary restrictions, allergies, and disliked cuisines. Save as `.github/assets/onboarding.png`.

### Dashboard
> **Screenshot needed:** the main hub after login showing the create lobby and join lobby options. Save as `.github/assets/dashboard.png`.

### Lobby Waiting Room
> **Screenshot needed:** the waiting room with participant list, vibe check ready states, and the "Start Matching" button visible to the host. Save as `.github/assets/lobby-waiting.png`.

### Vibe Check
> **Screenshot needed:** the session vibe check form showing meal type, today's budget, mood, and distance options. Save as `.github/assets/vibe-check.png`.

### Restaurant Swipe Cards
> **Screenshot needed:** the matching screen with a restaurant card showing photo, name, cuisine type, rating, and price range. Save as `.github/assets/matching-swipe.png`.

### Voting Screen
> **Screenshot needed:** the blind vote screen with consensus restaurant cards and vote buttons. Save as `.github/assets/voting.png`.

### Results Reveal
> **Screenshot needed:** the winning restaurant reveal with vote tally. Save as `.github/assets/results.png`.

### Tie-Breaker Revote
> **Screenshot needed:** the post-tie state where the host initiates a revote narrowed to the tied restaurants. Save as `.github/assets/revote.png`.

### Profile and Visit History
> **Screenshot needed:** the profile page showing visit history, aggregated cuisine stats, and pending feedback prompts. Save as `.github/assets/profile.png`.

### Post-Meal Feedback
> **Screenshot needed:** the feedback form with star rating, aspect scores (food quality, service, ambiance, value), categorical tags, dishes tried, and "would return" toggle. Save as `.github/assets/feedback.png`.

---

## Features

- **Passkey-first authentication**: WebAuthn registration and login via `@simplewebauthn/server` v8. Registration challenges store in a process-local Map with a 5-minute TTL; no User document is created until `registerPasskeyVerify` confirms the attestation. A race-condition guard rejects username collisions that occur between the two steps. Password fallback via bcryptjs (10 salt rounds) remains available. Both paths issue a JWT on success.
- **AI restaurant curation**: Gemini 2.5 Flash (`gemini-2.5-flash`) receives each participant's `spice_level`, `budget`, `allergies`, `dietary_preferences`, `disliked_cuisines`, and 4-star-or-above visit history entries, plus the session vibe check. It returns a JSON array of 5-8 cuisine keywords. A `DIETARY_WORDS` Set strips dietary terms (vegan, halal, kosher, etc.) from the Foursquare query string so they don't degrade text-search precision against cuisine categories.
- **Single-call Foursquare discovery**: one `GET /places/search` with `fields=name,geocodes,location,categories,photos,rating,price` returns all enrichment data. Foursquare's 0-10 rating scale normalizes to 0-5 on ingest. City coordinates geocode via Geoapify once and cache in-process for the session.
- **Lobby state machine**: four states (`waiting`, `matching`, `voting`, `completed`) with explicit transition guards. State transitions check authorization (host-only for `start` and `revote`), participant count (minimum 2 for `start`), and current status. The `matchingRestaurants` field on the Lobby document caches fetched restaurant IDs so every participant sees the same deck regardless of when they load the page.
- **Consensus-only voting**: only restaurants that every participant swiped right on proceed to the vote. When a vote results in a tie, `tiedRestaurants` stores the tied IDs and the host triggers `POST /api/lobby/:id/revote` with `useTiedOnly: true` to narrow the consensus and clear votes for a fresh round.
- **Behavioral feedback loop**: `submitFeedback` updates per-cuisine running averages (`total_rating_sum / visit_count`) and per-tag statistics in the User document. `user.markModified('preferences.cuisine_data')` forces Mongoose to persist the nested subdocument change, which plain assignment would miss due to Mongoose's subdocument change-tracking limitation. These aggregates feed directly into the next session's Gemini prompt.
- **Vibe Check session overlay**: session-level preferences (meal type, today's budget, mood, distance) layer over the long-term profile for the current session only, letting the same user get comfort food one night and adventurous picks the next without editing permanent preferences.

---

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | Next.js 16 (App Router), React 19 | App Router file-based routing maps onto the lobby/matching/voting page sequence without custom routing logic; Vercel deployment requires no additional configuration |
| Styling | Tailwind CSS 4 | Utility classes keep component styles co-located with markup; no separate stylesheet to maintain across six distinct UI flows |
| Animation | Framer Motion 12 | Declarative gesture API handles swipe card drag-and-release without manual DOM event cleanup; `AnimatePresence` drives card exit transitions |
| State | Zustand 5 + TanStack Query 5 | Zustand holds transient global state (current lobby ID, auth token); TanStack Query manages server state with automatic background refetching for lobby status polling |
| Charts | Recharts 3 | Visit history and cuisine breakdown visualizations on the profile page without a large charting dependency |
| Backend | Express 4, Node.js 18 | Lightweight middleware chain with straightforward integration for Mongoose and `@simplewebauthn/server` |
| Database | MongoDB Atlas, Mongoose 8 | Flexible schema handles evolving Foursquare enrichment fields without migration steps; subdocument arrays keep swipes, votes, and visits co-located with their parent document |
| AI | Gemini 2.5 Flash (`@google/generative-ai ^0.24.1`) | Sub-second JSON keyword generation at the free tier; regex extraction (`/\[.*\]/s`) handles responses that wrap JSON in markdown code fences |
| Restaurant data | Foursquare Places API v3 | Single search call returns photos, ratings, and price tiers natively, replacing the previous two-step discover + enrich flow that had a silent failure mode on ID mismatches |
| Geocoding | Geoapify | One geocoding call per city string, result cached in-process; keeps the city name as a human-readable config value rather than requiring hardcoded coordinates |
| Auth | `@simplewebauthn/server ^8`, bcryptjs 2.4, jsonwebtoken 9 | `@simplewebauthn` handles CBOR attestation parsing and signature counter verification; both auth paths issue the same JWT shape so downstream middleware stays auth-strategy-agnostic |

---

## Architecture

```
Browser (Next.js 16 on Vercel)
       |
       |  REST, JWT Bearer
       v
Express API  (Node.js 18, default :3001)
  |
  ├── /api/auth
  │     ├── POST /register                   bcryptjs hash, JWT issue
  │     ├── POST /passkey/register/options   Challenge stored in-memory Map (5 min TTL)
  │     ├── POST /passkey/register/verify    Attestation check, User write, JWT issue
  │     ├── POST /passkey/login/options      Challenge stored on User.challenge
  │     └── POST /passkey/login/verify       Signature check, counter update, JWT issue
  │
  ├── /api/user
  │     ├── GET/PUT /preferences             Taste profile CRUD
  │     ├── GET     /visits                  Paginated visit history
  │     └── POST    /visits/:id/feedback     Rating + aspects → cuisine/tag aggregation
  │
  └── /api/lobby
        ├── POST /                           Create, generate unique 6-digit code
        ├── POST /join                       Join by code
        ├── POST /:id/vibe-check             Store session preferences, flip isReady
        ├── POST /:id/start                  waiting → matching (host only, 2+ participants)
        ├── GET  /:id/restaurants
        │     ├── Gemini 2.5 Flash           5-8 cuisine keywords from profiles + vibe check
        │     ├── Geoapify                   City string → lat/lon (in-process cache)
        │     └── Foursquare Places v3       Up to 15 restaurants, all fields in one call
        ├── POST /:id/swipe                  Record direction, check for unanimous right-swipes
        ├── GET  /:id/voting                 Consensus restaurants + current vote counts
        ├── POST /:id/vote                   Record vote, detect winner or tie
        ├── POST /:id/revote                 Clear votes, optionally narrow to tied set
        └── GET  /:id/results               Winning restaurant + vote tally
               |
               v
        MongoDB Atlas
          users       preferences{}, webauthnCredentials[], visits[], cuisine_data[], tag_data[]
          lobbies     participants[], swipes[], consensusRestaurants[], votes[], matchingRestaurants[]
          restaurants external_id (fsq_*), cuisine, image, rating, price_range, tags[]
```

The `matchingRestaurants` field caches the IDs returned by Gemini + Foursquare. Any subsequent `GET /restaurants` call within the same lobby skips the AI and Foursquare calls entirely and queries the `restaurants` collection directly by those IDs. All participants receive the same deck regardless of page load order.

The behavioral loop closes at `submitFeedback`. Per-cuisine running averages use an explicit `total_rating_sum` field alongside `average_rating` to allow accurate incremental updates without fetching the full visit history. `markModified('preferences.cuisine_data')` forces Mongoose to persist the nested change, which plain assignment would not trigger reliably on subdocument arrays.

---

## How It Works

1. **Register.** Users choose passkey or password auth. For passkeys, `POST /api/auth/passkey/register/options` generates a WebAuthn challenge stored only in `pendingRegistrationChallenges` with no database write. The browser calls the authenticator (Face ID, fingerprint, or a 1Password vault). `POST /api/auth/passkey/register/verify` validates the attestation response, clears the in-memory challenge, checks for username collisions that occurred during the round-trip, then writes the credential's `credentialID`, `publicKey`, and `counter` as Node.js Buffers to the new User document. No User document exists if the user abandons mid-flow.

2. **Onboarding.** First-time users complete a preference form: `spice_level` (none/low/medium/high), `budget`, `allergies`, `dietary_preferences`, and `disliked_cuisines`. These write to `user.preferences` via `PUT /api/user/preferences`.

3. **Create or join a lobby.** The host calls `POST /api/lobby`. The server generates a random 6-digit numeric code, checks uniqueness against existing Lobby documents, and creates the lobby at `status: 'waiting'`. Others call `POST /api/lobby/join` with the code. Each participant submits a Vibe Check via `POST /api/lobby/:id/vibe-check`, which stores `{ meal_type, budget_today, mood, distance }` on their participant subdocument and flips `isReady: true`.

4. **Start matching.** The host calls `POST /api/lobby/:id/start` (403 for non-hosts; 400 for fewer than 2 participants). The lobby transitions to `status: 'matching'`. The first `GET /api/lobby/:id/restaurants` call checks `lobby.matchingRestaurants`. When empty, it calls `generateKeywords` with all participants' populated User objects and the first vibe check found. Gemini returns a JSON array; the server strips dietary terms via `DIETARY_WORDS` and takes the top 3 cuisine words for the Foursquare query. Foursquare returns up to 15 places; each upserts into the `restaurants` collection by `external_id: fsq_{fsq_place_id}`, and the resulting IDs write to `lobby.matchingRestaurants`.

5. **Swipe.** Each participant swipes through the deck. `POST /api/lobby/:id/swipe` stores `{ user_id, restaurant_id, direction, timestamp }` in `lobby.swipes`. After each write, the server checks whether every participant has swiped every restaurant in `matchingRestaurants`. When that condition is true and at least one restaurant has unanimous right-swipes, the lobby transitions to `status: 'voting'` with `consensusRestaurants` populated.

6. **Vote.** Each participant casts one vote from the consensus set. Once all participants have voted, the server counts by `restaurant_id`. A single highest-vote restaurant sets `lobby.winningRestaurant` and flips status to `completed`. A tie stores the tied IDs in `lobby.tiedRestaurants`; the host triggers `POST /api/lobby/:id/revote` with `useTiedOnly: true` to narrow `consensusRestaurants` and clear `votes` for another round.

7. **Post-meal feedback.** `POST /api/user/visits/:id/feedback` accepts a star rating (1-5), aspect scores for food quality, service, ambiance, and value, a text review, dishes tried, `would_return`, and up to 14 categorical tags (`hidden-gem`, `date-night`, `casual`, etc.). On first submission, `updateCuisineAndTagStats` recalculates running averages for the visited cuisine and each tag. These values appear in the Gemini keyword prompt the next time the user joins a session.

---

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB Atlas account (or local MongoDB 6+)
- Google Gemini API key (Google AI Studio, free tier)
- Foursquare Places API v3 key (keys start with `fsq3`, generated at location.foursquare.com/developer)
- Geoapify API key (free tier covers development volume)

### Installation

```bash
git clone https://github.com/parthiv-2006/palate.git
cd palate

cd server && npm install && cd ..
cd client && npm install && cd ..
```

### Configuration

Create `server/.env`:

| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | MongoDB Atlas connection string (`mongodb+srv://...`) |
| `JWT_SECRET` | Arbitrary secret string used to sign JWT tokens |
| `GEMINI_API_KEY` | Google AI Studio API key |
| `FOURSQUARE_API_KEY` | Foursquare Places API v3 key (must start with `fsq3`) |
| `GEOAPIFY_API_KEY` | Geoapify API key for city geocoding |
| `RP_NAME` | WebAuthn relying party display name (e.g. `Palate`) |
| `RP_ID` | WebAuthn relying party domain (`localhost` in dev; your production domain in prod) |
| `RP_ORIGIN` | Comma-separated allowed origins (e.g. `http://localhost:3000,https://palate-self.vercel.app`) |
| `DEFAULT_LOCATION` | Default city for Foursquare searches (default: `Toronto`) |
| `PORT` | Server port (default: `3001`) |

Create `client/.env.local`:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend base URL including `/api` path (e.g. `http://localhost:3001/api`) |

### Running Locally

```bash
# Terminal 1: backend
cd server && npm run dev

# Terminal 2: frontend
cd client && npm run dev
```

Open `http://localhost:3000`.

---

## Testing

No automated tests were written within the hackathon timeline. The `test` script in `server/package.json` exits with a non-zero code as a placeholder. Manual testing covered the full session flow: passkey and password registration, lobby creation and joining, vibe check submission, Gemini keyword generation, Foursquare deck retrieval, swiping to consensus, voting, tie-breaking revote, and post-meal feedback with stat aggregation.

---

## Project Structure

```
palate/
├── client/                           Next.js 16 frontend (deployed on Vercel)
│   ├── app/
│   │   ├── page.js                   Landing page: register form + passkey button
│   │   ├── layout.js                 Root layout, global font, toast provider
│   │   ├── globals.css               Tailwind base styles, custom animations
│   │   ├── auth/                     Login page (password + passkey sign-in)
│   │   ├── dashboard/                Post-login hub: create lobby / join by code
│   │   ├── onboarding/               First-run preference form
│   │   ├── lobby/
│   │   │   ├── create/page.js        Create lobby, display 6-digit code
│   │   │   ├── join/page.js          Join by code input
│   │   │   └── [lobbyId]/page.js     Waiting room: participants, vibe check, ready status
│   │   ├── matching/
│   │   │   └── [lobbyId]/page.js     Swipe deck with per-user progress indicator
│   │   ├── voting/
│   │   │   └── [lobbyId]/page.js     Blind vote, results reveal, tie-breaker revote
│   │   └── profile/page.js           Visit history, cuisine stats, pending feedback
│   ├── components/
│   │   ├── auth/                     PasswordForm, PasskeyButton, LoginRegisterTabs
│   │   ├── lobby/                    LobbyCard, ParticipantList, VibeCheckForm
│   │   ├── matching/                 SwipeCard (Framer Motion gestures), MatchDeck
│   │   ├── voting/                   VoteCard, ResultsReveal, TieBreaker
│   │   ├── feedback/                 FeedbackForm, AspectRatings, TagPicker
│   │   ├── onboarding/               PreferenceForm, CuisineSelector
│   │   └── ui/                       Shared: Button, Card, Modal, Badge
│   ├── lib/
│   │   ├── api/
│   │   │   ├── client.js             Base fetch wrapper; injects JWT from Zustand store
│   │   │   ├── lobby.js              Typed wrappers for all /api/lobby endpoints
│   │   │   └── user.js               Typed wrappers for /api/user endpoints
│   │   ├── auth/                     JWT storage helpers, @simplewebauthn/browser calls
│   │   └── hooks/                    useAuth, useLobby, useMatching (Zustand + TanStack Query)
│   └── store/                        Zustand stores: authStore, lobbyStore
│
└── server/                           Express 4 API
    ├── server.js                     Entry: dotenv load, MongoDB connect, listen on :3001
    └── src/
        ├── app.js                    Express app, CORS allowlist, route mounting
        ├── config/database.js        Mongoose connection
        ├── models/
        │   ├── User.js               preferences{}, webauthnCredentials[], visits[], cuisine_data[], tag_data[]
        │   ├── Lobby.js              participants[], swipes[], consensusRestaurants[], votes[], matchingRestaurants[]
        │   └── Restaurant.js         external_id (fsq_*), cuisine, image, rating, price_range, tags[]
        ├── controllers/
        │   ├── auth.controller.js    Password auth + 4-step WebAuthn flow (12 endpoints)
        │   ├── lobby.controller.js   Full lobby lifecycle: create, join, vibe, match, swipe, vote, revote, reset (12 handlers)
        │   └── user.controller.js    Profile, preferences, visits, feedback, stat aggregation
        ├── routes/
        │   ├── auth.routes.js        /api/auth/*
        │   ├── lobby.routes.js       /api/lobby/*
        │   └── user.routes.js        /api/user/*
        ├── middleware/
        │   └── errorHandler.js       Centralised error middleware (last in chain)
        └── utils/
            ├── gemini.js             Gemini 2.5 Flash keyword prompt + JSON extraction
            ├── foursquare.js         Foursquare Places v3 search, photo URL builder, rating normalizer
            ├── geoapify.js           City geocoding (in-process cache)
            ├── jwt.js                Token generation and verification
            ├── generateCode.js       Unique 6-digit lobby code with uniqueness callback
            └── errors.js             AppError class for structured error responses
```

---

## Known Limitations

- **In-memory challenge store breaks horizontal scaling.** `pendingRegistrationChallenges` is a process-local Map. Two server instances will each hold independent challenge state; a request routed to the wrong instance between `registerPasskeyOptions` and `registerPasskeyVerify` fails with "challenge not found." A Redis TTL key fixes this with a two-line change.
- **No real-time push.** Lobby state transitions (vibe check completion, matching start, voting phase) require clients to poll `GET /api/lobby/:id`. There are no WebSockets or Server-Sent Events. Participants experience a 1-3 second detection lag depending on poll interval.
- **Single hardcoded city.** `DEFAULT_LOCATION` is a server-level environment variable. All lobbies search the same city. There is no per-lobby location input or device geolocation.
- **No lobby cleanup.** Completed and abandoned Lobby documents are never deleted. No TTL index exists on the `lobbies` collection. Long-running deployments accumulate documents indefinitely.
- **Silent Gemini fallback.** A missing or invalid `GEMINI_API_KEY` causes `generateKeywords` to return `['restaurant', 'food']`. The matching screen shows results with no indication that AI keyword generation failed and that the deck is generic.
- **No automated tests.** Correctness of the state machine, behavioral aggregation math, and WebAuthn verification flow was verified only through manual end-to-end testing.

---

## What We Would Build Next

1. **WebSocket lobby sync**: the polling model adds perceptible lag on the vibe check ready-state screen and during the voting countdown. A Socket.io room per lobby pushes state transitions immediately, removes the poll interval tuning problem from the client, and cuts perceived wait time on vibe check completion and vote tallying.

2. **Per-lobby location input**: `DEFAULT_LOCATION` is currently server-wide. Letting the host specify a city at lobby creation, or reading the host's geolocation API, makes the app usable for groups anywhere. The Geoapify geocoding already handles arbitrary city strings; only the lobby creation form and Lobby schema need a `location` field.

3. **Redis challenge store**: swapping the in-memory Map for a Redis TTL key unblocks horizontal scaling without changing the WebAuthn flow's logic. The change touches `registerPasskeyOptions` and `registerPasskeyVerify` in `auth.controller.js` and removes the single-instance deployment constraint.

4. **Amplitude event instrumentation**: `amplitude_behavioral_score.adventurousness` and `budget_sensitivity` exist in the User schema but go unpopulated. Tracking `swipe_right` and `swipe_left` events with `cuisine`, `price_range`, and `session_id` properties would make the behavioral loop visible in Amplitude dashboards and close the self-improving product loop the hackathon challenge described.

5. **Post-meal photo attachment**: the feedback form collects ratings, aspects, tags, and a text review but no photo. Storing a user-attached photo per visit in an S3-compatible bucket would give the group a shared visual record of the meal without requiring a separate messaging channel.

---

## The Team

| Role | Person |
|------|--------|
| Backend and database | Hylac |
| AI and matching logic | Aaliyah |
| Amplitude loop and behavioral data | Yichon |
| Frontend and auth | Parthiv |

---

## License

MIT
