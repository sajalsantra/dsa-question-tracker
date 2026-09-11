# 🚀 DSA Question Tracker

A full-stack, feature-rich Data Structures & Algorithms (DSA) Question Tracking application built with **Angular 18** and **Spring Boot 3** with a **MySQL** backend and **Firebase** sync capabilities.

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
├── 📂 backend/                # Spring Boot 3 REST API
│   ├── 📂 src/                # Controllers, Services, Repositories, Entities & Security
│   └── 📄 pom.xml             # Maven dependencies & build settings
│
├── 📂 docs/                   # Additional documentation & system design assets
├── 📄 package.json            # Root workspace orchestrator scripts
└── 📄 README.md               # Project documentation
```

---

## ✨ Features

- 🧠 **500+ Curated DSA Questions**: Comprehensive coverage across major topics, pattern tags, and difficulty levels.
- 🎯 **Company-Wise LeetCode Tracker**: Dedicated, isolated section to practice top interview questions tagged by major tech companies.
- 📊 **Interactive Analytics Dashboard**: Visual breakdown of progress, status distribution, difficulty ratings, timeline trends, and topic metrics powered by Chart.js.
- 🔄 **Hybrid Data Persistence**: 
  - **Primary**: Spring Boot 3 REST API + MySQL database.
  - **Cloud Sync**: Firebase Firestore for cloud backups & remote state sync.
  - **Offline/Guest Support**: Browser `LocalStorage` fallback.
- 🔐 **Authentication & Security**: JWT-based authentication with Spring Security and optional Firebase authentication.
- ⏱️ **Smart Revision & Confidence Scoring**: Deterministic confidence score calculation based on solve attempts, time spent, difficulty stars, and automated revision scheduling.
- 🔍 **Filtering & Pagination**: Instant search, multi-field filtering (topic, difficulty, status, company), and numbered pagination.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: Angular 18 (Standalone Components, Signals, RxJS)
- **Visualization**: Chart.js & ng2-charts
- **Styling**: Vanilla CSS & Custom Design System (Glassmorphism, Dark/Light palettes)
- **Cloud Backend**: Firebase Authentication & Cloud Firestore SDK

### Backend
- **Framework**: Spring Boot 3.3.2 (Java 17)
- **Security**: Spring Security & JJWT (JSON Web Token)
- **Data Access**: Spring Data JPA / Hibernate
- **Database**: MySQL 8.x
- **Build Tool**: Apache Maven

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js**: v18+ and **npm** v9+
- **Java JDK**: 17+
- **Maven**: 3.8+ (or Maven Wrapper)
- **MySQL Server**: Running on `localhost:3306`

---

### 1️⃣ Setting up the Backend

1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Configure your MySQL database settings in `src/main/resources/application.properties`:
   ```properties
   spring.datasource.url=jdbc:mysql://localhost:3306/dsa_tracker_db?createDatabaseIfNotExist=true
   spring.datasource.username=YOUR_MYSQL_USERNAME
   spring.datasource.password=YOUR_MYSQL_PASSWORD
   ```
3. Run the Spring Boot application:
   ```bash
   mvn spring-boot:run
   ```
   The backend API will be available at `http://localhost:8080`.

---

### 2️⃣ Setting up the Frontend

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

### 3️⃣ Root Workspace Commands

You can also run orchestration scripts directly from the root project directory:

```bash
# Start Frontend
npm run start:frontend

# Build Frontend
npm run build:frontend

# Start Backend
npm run start:backend

# Build/Compile Backend
npm run build:backend
```

---

## 📜 License

This project is open-source under the [MIT License](LICENSE).
