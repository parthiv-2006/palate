Product Requirements Document (PRD): TasteSync
Version: 7.0 (Hackathon MVP - Optimized)
Platform: Web Application (Desktop-First, Responsive)
Date: January 17, 2026
1. Product Vision
To eliminate the "social friction" of group dining decisions. TasteSync uses AI to act as an impartial mediator, analyzing individual taste profiles, budgets, and cravings to mathematically determine the optimal restaurant for the group.
2. The Core Loop (Amplitude Challenge)
Data: Users swipe on cuisines/dishes; the app tracks preferences (Spicy vs. Mild, Budget Tier).
Insight: Amplitude analyzes behavioral patterns (e.g., "User A says they like Italian, but rage-clicks 'Next' on 80% of pasta dishes").
Action: The AI adjusts the user’s "Taste Profile" in real-time, improving future recommendations automatically.

3. Key Features & Prize Track Mapping
Feature
Prize Track
Implementation Strategy
Passkey Login (1Password Challenge Focus)
1Password
Primary: WebAuthn Passkeys via @simplewebauthn library for registration/login (works with 1Password, device biometrics, security keys). Fallback: Guest Mode for demo resilience (clearly labeled as less secure). Creative Addition: Passkey-protected lobby joining (if time permits). Focus on Simplicity, Honesty, and People-First values from 1Password challenge.
The Consensus Engine
Gemini API
Feed 4-5 user profiles + current location into Gemini. Ask it to find the "Culinary Centroid" (e.g., "Person A is Vegan, B is broke, C loves spicy -> Suggest Ethiopian").
Self-Improving Profiles
Amplitude
Track events (swipe_right, lobby_joined). If a user consistently picks specific categories, update their hidden "Taste Vector" using AI clustering2222.
+1
Dynamic Restaurant Database
MongoDB
Store User Profiles and Restaurant Data in MongoDB Atlas. Use Atlas Vector Search to match "Taste Vectors" to restaurant descriptions.


4. User Flow
Onboarding: User lands on webapp. Primary: Authenticates via WebAuthn Passkeys (works with 1Password extension, device biometrics). Fallback: "Guest Mode" button (clearly labeled "Demo Mode - Less Secure") for demo resilience. Creates a basic profile (Allergies, Spice Tolerance, Budget).

Lobby Creation: User clicks "Start Group." Generates a 6-digit lobby code (primary method - reliable, fast, no camera needed). Optional: QR Code generation if time permits (requires camera access).

Lobby Joining (Tiered Approach):
- Primary: 6-digit lobby code entry (fast to implement, universal compatibility)
- Secondary (if time): QR code scanning (impressive but not critical)
- Creative Bonus (if time): Passkey-protected lobby links (shows Passkeys beyond login for 1Password challenge)
Users are instantly authenticated and added to the session.

Preference Check: Each user answers a quick "Vibe Check" (e.g., "Heavy meal or Light snack?", "How much $$?").

The Matching:
App pulls profiles of all lobby members.
Gemini analyzes the intersection of preferences.
App displays top 3 candidates.

Voting: Users vote (blind). Result is revealed.

Feedback Loop: "Did you like this choice?" (Post-meal input feeds back into Amplitude - can be simplified to basic yes/no if time is tight).

4.5. Security & Privacy Transparency (1Password Challenge Alignment)
Lead with Honesty: Security transparency UI elements (quick wins, minimal implementation):
- Tooltip on Passkey button: "Using WebAuthn Passkeys - No passwords stored"
- "Security Info" badge in lobby: "✓ Passkeys | ✓ Encrypted preferences"
- Clear privacy text: "Only your food preferences are shared with the group"
- Small "Why Passkeys?" info modal explaining security benefits

Put People First: User-centric security messaging:
- Clear explanation of what data is shared (preferences only, not personal info)
- Option to join as guest if user is uncomfortable with Passkeys
- Transparent about lobby data being ephemeral (deleted after session ends)

Keep it Simple: Security that's easy to understand:
- One-click Passkey registration
- Simple lobby code entry (no complex flows)
- Clear visual indicators of security status

5. Technical Architecture
Frontend: React (Next.js) + Tailwind CSS (deployed on Vercel).
Backend: Node.js / Express.
Database: MongoDB Atlas.
AI: Google Gemini API (via Vertex AI or Google AI Studio).
Auth: WebAuthn Passkeys (compatible with 1Password) via @simplewebauthn library. Fallback: Guest Mode for demo resilience.
Analytics: Amplitude SDK.

6. Work Breakdown Structure (Team of 4)
To ensure an even split, we divide roles by Functional Domain, minimizing merge conflicts.
Hylac - Member 1: The "Architect" (Backend & Database)
Primary Responsibility: MongoDB & Server Logic.
Tasks:
Set up MongoDB Atlas cluster.
Design the Database Schema: Users, Lobbies, Restaurants.
Set up the Node.js/Express server framework.
Create API Endpoints: POST /create-lobby, GET /restaurants, POST /submit-vote.
Hackathon Win Condition: Ensure the database acts as the "Source of Truth" for the group state.
Aaliyah - Member 2: The "Brain" (AI & Matching Logic)
Primary Responsibility: Google Gemini Integration & Algorithm.
Tasks:
Get Gemini API keys and set up the client.
Prompt Engineering: Design the complex prompt that takes JSON inputs (5 users) and outputs a recommendation.
Prompt: "User A is Vegan, User B hates cilantro. Find a cuisine that satisfies both."
Build the "Restaurant Fetcher" (integrate with Yelp/Google Places API or a mock dataset).
Hackathon Win Condition: The recommendations need to feel "magical," not random.
Yichon - Member 3: The "Analyst" (Amplitude & Loop)
Primary Responsibility: Analytics, Events & Self-Improving Logic.
Tasks:
Set up Amplitude SDK.
Event Instrumentation: Define and trigger events: view_restaurant, vote_yes, vote_no, conflict_detected.
The "Loop": Write a script/function that queries Amplitude data to find user patterns (e.g., "User loves Asian food on weekends") and updates the User Profile in MongoDB.
Hackathon Win Condition: You must demo the insight. Show a dashboard graph during the pitch: "Look, the AI learned User X hates spicy food after 3 swipes."3.
Parthiv - Member 4: The "Face" (Frontend & Auth)
Primary Responsibility: UI/UX & Passkey Integration (1Password Challenge).
Tasks:
Saturday Morning (9 AM - 12 PM):
- Set up Next.js + Tailwind CSS + basic routing
- Implement Passkey registration/login using @simplewebauthn/browser + @simplewebauthn/server
- Test Passkeys with 1Password extension early (if available)
- Create Guest Mode fallback (clearly labeled "Demo Mode - Less Secure")

Saturday Afternoon (12 PM - 3 PM):
- Build landing page + onboarding/profile form
- Implement 6-digit lobby code generation/joining (primary method)
- Create "Lobby" view (participants list with real-time updates via polling)

Saturday Late Afternoon (3 PM - 6 PM):
- Build "Swiping" mechanism (Tinder-style cards with keyboard shortcuts)
- Create voting UI
- Connect frontend to backend APIs (react-query or SWR for data fetching)
- Add security transparency UI elements (tooltips, badges, privacy text)

Saturday Evening (6 PM - 8 PM):
- Polish animations, loading states, error handling
- Responsive design (desktop-first, mobile-responsive)
- Test full user flow end-to-end

Hackathon Win Condition: 
- Passkey registration/login working and under 5 seconds
- Security transparency features visible (tooltips, badges)
- Full user flow from landing → lobby → voting working smoothly
- Demo video shows Passkeys in action (tests 1Password challenge requirements)

7. Data Models (JSON Drafts)
User Profile (MongoDB):
JSON
{
  "_id": "user_123",
  "name": "Alex",
  "passkey_id": "pk_...",
  "preferences": {
    "spice_level": "medium",
    "vegetarian": false,
    "disliked_cuisines": ["seafood"]
  },
  "amplitude_behavioral_score": {
    "adventurousness": 0.8,
    "budget_sensitivity": "high"
  }
}

Amplitude Event Schema (Member 3 Reference):
Event: session_vote
restaurant_cuisine: "Thai"
vote_direction: "reject"
user_mood: "hungry"
lobby_size: 4

8. Timeline (24-Hour Sprint)
Friday 9 PM - 11 PM:
All: Database Schema finalized. API contract written (what does the frontend send the backend?). 
Tech stack decisions: Confirm @simplewebauthn for Passkeys, react-query for data fetching, framer-motion for animations.

Saturday 9 AM - 12 PM:
M1: API routes live (POST /create-lobby, GET /restaurants, POST /submit-vote).
M2: Gemini API client set up, generating text responses.
M3: Amplitude SDK configured, receiving dummy events.
M4: Next.js setup + Passkey registration/login implementation (priority: get this working early!). Test with 1Password extension.

Saturday 12 PM - 3 PM:
M1: Complete all API endpoints, add polling endpoint for lobby status.
M2: Gemini prompt engineering, restaurant fetcher (use mock data if external APIs slow).
M3: Event instrumentation complete (swipe_right, lobby_joined, vote_yes, vote_no).
M4: Landing page + onboarding form + lobby code system + lobby view UI.

Saturday 3 PM - 6 PM:
Connect: Hook Frontend to Backend APIs. Test full data flow.
M2+M3: Connect Amplitude "Insights" to update User Profile in MongoDB.
M4: Swipe mechanism + voting UI + security transparency features (tooltips, badges).
All: Integration testing, fix critical bugs.

Saturday 6 PM - 8 PM:
All: Polish CSS, animations, loading states, error handling.
M4: Responsive design refinement, keyboard shortcuts, accessibility checks.
M2+M3: Test feedback loop, ensure Amplitude events are logging correctly.

Saturday 8 PM - Midnight:
All: End-to-end testing with multiple users (test lobby flow).
M4: Record "Auth" flow demo video showing Passkeys (critical for 1Password challenge).
All: Bug fixes, last-minute polish, prepare pitch deck.

Sunday Morning:
Devpost Submission & Demo Video finalization.

