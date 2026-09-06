# DSA Question Tracker — Firebase Architecture

A modern, responsive, multi-file web application to track, solve, revise, and analyze Data Structures and Algorithms (DSA) questions. Features **Firebase Authentication**, **Cloud Firestore**, and **LocalStorage** offline caching/fallback layer.

---

## Features

- **499 Curated Questions**: Comprehensive dataset with topics, patterns, platforms, and 1–5 star difficulty ratings.
- **Firebase Cloud Storage & Local Cache**: Dual-tier storage strategy using Cloud Firestore with LocalStorage caching for fast, offline-capable operations.
- **Firebase Authentication**: Email/password registration, login, logout, and session state persistence.
- **Seamless LocalStorage → Cloud Migration**: Automatically migrates locally stored progress, notes, activity streaks, and settings to Cloud Firestore upon first sign-in without data loss.
- **Analytics Dashboard**: Dynamic Chart.js visualizations for difficulty breakdowns, status distributions, timeline progress, and topic completion percentages.
- **Smart Revision Queue**: Priority-based revision engine calculating urgency based on confidence levels, attempt history, and time since last solved.
- **Interview Readiness Score**: Weighted score incorporating total completion, difficulty coverage, topic coverage, and confidence levels.
- **Dark / Light Mode**: Theme switching with CSS variable design system.
- **Data Backup & Restore**: Import and export progress via JSON or CSV format.

---

## Architecture Overview

```text
                    ┌──────────────────┐
                    │  questions.json  │
                    └────────┬─────────┘
                             │
                             ▼
┌───────────────┐     ┌───────────────┐
│      UI       │────▶│  storage.js   │
└───────────────┘     └───────┬───────┘
                              │
                 ┌────────────┴────────────┐
                 │                         │
                 ▼                         ▼
          ┌─────────────┐          ┌─────────────┐
          │ LocalStorage│          │   Firebase  │
          │             │          │             │
          │ local cache │          │ Auth        │
          │ fallback    │          │ Firestore   │
          └─────────────┘          └─────────────┘
```

The application relies on `storage.js` as an abstraction facade:
1. **User Actions** write directly to LocalStorage first to guarantee immediate offline-capable updates.
2. If authenticated, changes are debounced and synchronized to Cloud Firestore in real time.
3. If offline or network errors occur, state remains safely cached in LocalStorage.

---

## Firestore Data Schema

User data is strictly isolated under `users/{uid}`:

- **Question Progress**: `users/{uid}/progress/{questionId}`
  ```json
  {
    "status": "Solved",
    "revision": true,
    "confidence": 80,
    "attempts": 2,
    "timeTaken": 35,
    "lastSolved": "2026-09-06",
    "favorite": true,
    "updatedAt": "serverTimestamp"
  }
  ```

- **Question Notes**: `users/{uid}/notes/{questionId}`
  ```json
  {
    "notes": "Optimal two-pointer approach with O(1) space complexity.",
    "updatedAt": "serverTimestamp"
  }
  ```

- **User Activity**: `users/{uid}/activity/{YYYY-MM-DD}`
  ```json
  {
    "count": 5,
    "updatedAt": "serverTimestamp"
  }
  ```

- **User Settings**: `users/{uid}/settings/config`
  ```json
  {
    "theme": "dark",
    "ui": {
      "dashboardGroupOpen": true,
      "insightsOpen": true,
      "streakGoalOpen": true,
      "analyticsOpen": true,
      "filtersOpen": true,
      "questionsOpen": true,
      "revOpen": true,
      "dataMgmtOpen": true
    },
    "dailyGoal": {
      "target": 5,
      "date": "2026-09-06",
      "count": 2
    },
    "updatedAt": "serverTimestamp"
  }
  ```

*Note: The static 499-question dataset remains in `data/questions.json`.*

---

## Firestore Security Rules

Deploy the included `firestore.rules` to enforce strict user-level data isolation:

```rules
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

---

## Local Development & Configuration

### 1. Firebase Console Setup
1. Go to the [Firebase Console](https://console.firebase.google.com/) and create a project.
2. Enable **Authentication** -> **Email/Password** sign-in method.
3. Enable **Cloud Firestore** in production mode.
4. Copy your web app config credentials.

### 2. Configure Frontend
Update `js/firebase/config.js` with your Firebase web configuration:

```javascript
const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "YOUR_FIREBASE_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```
*Alternatively, set `window.FIREBASE_CONFIG = { ... }` in `index.html`.*

### 3. Local Execution
Serve the directory via a local HTTP server:

#### Option 1: Using Node.js
```bash
npx http-server . -p 8080
```

#### Option 2: Using Python
```bash
python -m http.server 8080
```

Open [http://localhost:8080](http://localhost:8080) in your browser.

---

## Project Structure

```text
dsa-question-tracker/
├── index.html
├── README.md
├── firestore.rules
├── firebase.json
├── css/
│   └── style.css
├── js/
│   ├── firebase/
│   │   ├── config.js
│   │   ├── auth.js
│   │   └── firestore.js
│   ├── app.js
│   ├── auth-ui.js
│   ├── charts.js
│   ├── config.js
│   ├── data.js
│   ├── export-import.js
│   ├── filters.js
│   ├── modal.js
│   ├── rendering.js
│   ├── state.js
│   ├── storage.js
│   └── streak.js
└── data/
    └── questions.json
```
