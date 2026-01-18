# 🍽️ Palate

**Palate** is an AI-powered social dining app designed to eliminate the friction of group restaurant decisions. By combining behavioral analytics with generative AI, Palate acts as an impartial mediator that finds the "culinary centroid" of any group.

This project was built for **UofTHacks 2026** and specifically addresses the **Amplitude Technical Challenge** (Self-Improving Products) and the **1Password Challenge** (Passkey/WebAuthn Integration).

---

## 🚀 The "Self-Improving" Loop (Amplitude Challenge)

Palate implements a complete **Data → Insights → Action** loop to create a product experience that gets smarter with every use:

1.  **Data (Behavioral Tracking):** We track high-fidelity events such as `swipe_right`, `lobby_joined`, and `feedback_submitted`. We capture properties like `cuisine`, `spice_level`, and qualitative tags (e.g., `hidden-gem`, `date-night`).
2.  **Insights (AI Analysis):** Our custom behavioral engine uses **Google Gemini AI** to analyze longitudinal patterns. It detects when a user's stated preferences (e.g., "I like Italian") conflict with their behavior (e.g., "Always swipes left on Pasta").
3.  **Action (Dynamic Personalization):** The AI automatically updates the user's hidden **Taste Vector**. The next time the user joins a lobby, the recommendation engine uses this refined profile to generate hyper-personalized search keywords and restaurant suggestions.

---

## 🔐 Security & Privacy (1Password Challenge)

-   **Passkey-First Authentication:** We've implemented **WebAuthn Passkeys** via `@simplewebauthn`, allowing users to register and login using biometrics or their **1Password** vault—completely eliminating passwords.
-   **Security Transparency:** The UI features "Security Badges" and "Transparency Tooltips" to explain how data is handled and why passkeys are more secure.
-   **People-First Privacy:** Only relevant food preferences are shared within a lobby; personal data remains encrypted and private.

---

## ✨ Key Features

-   **Group Lobbies:** Create a lobby and invite friends with a simple 6-digit code.
-   **Vibe Check:** A quick pre-session survey to capture the group's current mood, budget, and hunger level.
-   **Consensus Engine:** Gemini AI analyzes the intersection of everyone's historical profiles and the current vibe to suggest the perfect candidates.
-   **Tinder-style Matching:** Swipe through curated restaurant cards to find common favorites.
-   **Weighted Voting:** A final blind vote to settle on the winner.
-   **Post-Meal Feedback:** Submit detailed reviews that feed back into the AI to improve your profile.

---

## 🛠️ Tech Stack

### Frontend
-   **Framework:** [Next.js 15](https://nextjs.org/) (App Router)
-   **Styling:** [Tailwind CSS 4](https://tailwindcss.com/)
-   **Animations:** [Framer Motion](https://www.framer.com/motion/)
-   **State Management:** [Zustand](https://github.com/pmndrs/zustand) & [TanStack Query](https://tanstack.com/query)

### Backend
-   **Runtime:** [Node.js](https://nodejs.org/) with [Express](https://expressjs.com/)
-   **Database:** [MongoDB Atlas](https://www.mongodb.com/atlas/database)
-   **AI Engine:** [Google Gemini API](https://ai.google.dev/)
-   **Authentication:** [WebAuthn / Passkeys](https://webauthn.guide/)

---

## 🏃 Getting Started

### Prerequisites
-   Node.js (v18+)
-   MongoDB Atlas account
-   Google Gemini API Key
-   Yelp Fusion API Key (for restaurant data)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/aaliyahpirani/stream-shop.git
   cd stream-shop
   ```

2. **Setup Backend:**
   ```bash
   cd server
   npm install
   # Create a .env file based on the PRD requirements
   npm run dev
   ```

3. **Setup Frontend:**
   ```bash
   cd client
   npm install
   npm run dev
   ```

4. **Open the app:**
   Navigate to `http://localhost:3000`

---

## 👥 The Team
-   **Architect:** Hylac (Backend & Database)
-   **The Brain:** Aaliyah (AI & Matching Logic)
-   **The Analyst:** Yichon (Amplitude Loop & Behavioral Data)
-   **The Face:** Parthiv (Frontend & Auth)
