# Spring Boot REST API Contract (Future Phase)

This document defines the REST API endpoints expected by the Angular frontend when transitioning from LocalStorage to Spring Boot + PostgreSQL.

## Base URL
`/api/v1`

---

## 1. Questions API

### `GET /questions`
Retrieves all 499 DSA questions.
- **Response**: `200 OK`
```json
[
  {
    "id": 1,
    "title": "Find Element at a Given Index",
    "topic": "Array Basics",
    "pattern": "Basic Iteration",
    "platform": "LeetCode",
    "stars": 1,
    "problemUrl": "https://leetcode.com/problems/..."
  }
]
```

---

## 2. User Progress API

### `GET /progress`
Retrieves progress records for the authenticated user.
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `200 OK`
```json
{
  "1": {
    "questionId": 1,
    "status": "Solved",
    "confidence": 90,
    "attempts": 1,
    "timeTaken": 15,
    "lastSolved": "2026-09-10",
    "revision": false,
    "favorite": true,
    "updatedAt": "2026-09-10T14:30:00Z"
  }
}
```

### `PUT /progress/{questionId}`
Updates progress for a specific question.
- **Request Body**:
```json
{
  "status": "Solved",
  "confidence": 95,
  "attempts": 2,
  "timeTaken": 20,
  "revision": false,
  "favorite": true
}
```
- **Response**: `200 OK`

---

## 3. Notes API

### `GET /notes`
- **Response**: `200 OK` `{"1": "Note text..."}`

### `PUT /notes/{questionId}`
- **Request Body**: `{"notes": "Updated note"}`

---

## 4. Activity & Goals API

### `GET /activity`
- **Response**: `200 OK` `{"2026-09-10": 5, "2026-09-09": 3}`

### `POST /activity/log`
Logs activity for today.

### `GET /activity/daily-goal`
- **Response**: `200 OK` `{"target": 5, "date": "2026-09-10", "count": 3}`

---

## 5. Auth API

### `POST /auth/login`
- **Request Body**: `{"email": "user@example.com", "password": "password123"}`
- **Response**: `200 OK` `{"token": "JWT_TOKEN", "user": {"id": "1", "name": "User", "email": "user@example.com"}}`

### `POST /auth/register`
- **Request Body**: `{"name": "User", "email": "user@example.com", "password": "password123"}`
