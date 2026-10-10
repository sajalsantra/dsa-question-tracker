# 🚀 DSA Question Tracker

A modern, responsive, and standalone Data Structures & Algorithms (DSA) Question Tracking application built with **Angular 18**, powered by **Firebase** (Cloud Firestore & Authentication) and **Local Storage** for instant local persistence and offline resilience.

---

## 📁 Folder Structure

```
DSA Question Tracker/
├── 📂 frontend/               # Angular 18 Single Page Application
│   ├── 📂 src/                # Components, Services, Models, Assets & Styles
│   ├── 📄 angular.json        # Angular workspace configuration
│   ├── 📄 package.json        # Frontend dependencies & npm scripts
│   └── 📄 tsconfig.json       # TypeScript configuration
│
├── 📂 docs/                   # Architecture & system design documentation
├── 📄 package.json            # Root workspace scripts
└── 📄 README.md               # Project documentation
```

---

## ✨ Features

- 🧠 **500+ Curated DSA Questions**: Comprehensive coverage across major topics, pattern tags, and difficulty levels.
- 🎯 **Company-Wise LeetCode Tracker**: Dedicated, isolated section to practice top interview questions tagged by major tech companies.
- 📊 **Interactive Analytics Dashboard**: Visual breakdown of progress, status distribution, difficulty ratings, timeline trends, and topic metrics powered by Chart.js.
- 🔄 **Hybrid Data Persistence**:
  - **Cloud Database**: Firebase Firestore for real-time state synchronization across devices.
  - **Local Persistence & Offline Mode**: Browser `LocalStorage` for zero-latency UI updates and full offline capabilities.
  - **Seamless Data Migration**: Option to sync local guest progress to your account upon signup.
- 🔐 **Authentication**: Firebase Authentication supporting Email/Password, Google OAuth, and GitHub OAuth sign-in.
- 🤖 **Beru AI Mentor**: Intelligent conversational AI assistance for hints, optimal approaches, complexity analysis, and code reviews directly via Google Gemini / OpenAI APIs.
- ⏱️ **Smart Revision & Confidence Scoring**: Deterministic confidence score calculation based on solve attempts, time spent, difficulty stars, and automated revision scheduling.
- 🔍 **Filtering & Pagination**: Instant search, multi-field filtering (topic, difficulty, status, company), and numbered pagination.

---

## 🛠️ Tech Stack

- **Framework**: Angular 18 (Standalone Components, Signals, RxJS)
- **Database & Auth**: Firebase (Cloud Firestore & Firebase Authentication)
- **Local Persistence**: Browser `LocalStorage`
- **Visualization**: Chart.js & ng2-charts
- **Styling**: Vanilla CSS & Custom Design System (Glassmorphism, Dark/Light themes)
- **AI Integration**: Direct Google Gemini & OpenAI API integration

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js**: v18+ and **npm** v9+

---

### Getting Started

1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Angular development server:
   ```bash
   npm start
   ```
4. Open your browser and navigate to `http://localhost:4200/`.

---

### Root Workspace Commands

You can also run commands directly from the root project directory:

```bash
# Start Frontend Dev Server
npm start

# Build for Production
npm run build

# Run Unit Tests
npm test
```

---

## 📜 License

This project is open-source under the [MIT License](LICENSE).

