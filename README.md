# DSA Question Tracker

A modern, responsive, multi-file web application to track, solve, revise, and analyze Data Structures and Algorithms (DSA) questions.

## Features

- **499 Curated Questions**: Comprehensive dataset with topics, patterns, platforms, and 1–5 star difficulty ratings.
- **LocalStorage Data Persistence**: Automatically saves question progress, confidence, attempts, notes, favorites, streaks, and custom daily targets locally.
- **Analytics Dashboard**: Dynamic Chart.js visualizations for difficulty breakdowns, status distributions, timeline progress, and topic completion percentages.
- **Smart Revision Queue**: Priority-based revision engine calculating urgency based on confidence levels, attempt history, and time since last solved.
- **Interview Readiness Score**: Weighted score incorporating total completion, difficulty coverage, topic coverage, and confidence levels.
- **Dark / Light Mode**: Theme switching with CSS variable design system.
- **Data Backup & Restore**: Import and export progress via JSON or CSV format.

## Project Structure

```text
dsa-question-tracker/
├── index.html
├── README.md
├── css/
│   └── style.css
├── js/
│   ├── app.js
│   ├── charts.js
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

## Setup & Local Execution

Since the application fetches `data/questions.json` asynchronously, it should be served via a local web server (to satisfy browser CORS security policies for ES modules and fetch requests).

### Option 1: Using Node.js (npx http-server)
```bash
npx http-server . -p 8080
```
Open [http://localhost:8080](http://localhost:8080) in your browser.

### Option 2: Using Python
```bash
python -m http.server 8080
```
Open [http://localhost:8080](http://localhost:8080) in your browser.

### Option 3: VS Code Live Server
Right-click `index.html` in VS Code and select **Open with Live Server**.

## Module Overview

- `js/storage.js`: LocalStorage keys, load/save JSON helpers, date string formatters.
- `js/state.js`: Global state container (`state`), difficulty/status constants, and emoji mappings.
- `js/data.js`: Asynchronous loader for `questions.json` and progress merging logic.
- `js/filters.js`: Search filter, multi-criteria drop-downs, sorting algorithms, and pagination state.
- `js/charts.js`: Chart.js configuration and canvas rendering routines.
- `js/modal.js`: Detailed problem view modal, confidence range slider, status toggle, and notes persistence.
- `js/streak.js`: 180-day activity heatmap, streak calculation engine, and daily target tracking.
- `js/export-import.js`: Exporting to JSON/CSV, importing backups, and hard reset capabilities.
- `js/rendering.js`: Core UI rendering engine for question cards, KPI cards, revision queue, and readiness gauge.
- `js/app.js`: Main application entry point orchestrating lifecycle events and state bindings.
