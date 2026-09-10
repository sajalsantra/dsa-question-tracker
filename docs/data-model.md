# Data Model Specifications

## Question
| Field | Type | Description |
|-------|------|-------------|
| `id` | `number` | Unique identifier (1-499) |
| `title` | `string` | Problem title |
| `topic` | `string` | Primary DSA topic (e.g. Arrays, Graphs, DP) |
| `pattern` | `string` | Algorithmic pattern (e.g. Two Pointers, BFS) |
| `platform` | `string` | LeetCode / GeeksforGeeks / CodingNinjas |
| `stars` | `number` | Difficulty rating (1 to 5 stars) |
| `problemUrl` | `string` | External problem link |

## Question Progress
| Field | Type | Description |
|-------|------|-------------|
| `questionId` | `number` | References `Question.id` |
| `status` | `QuestionStatus` | 'Not Started' \| 'In Progress' \| 'Solved' \| 'Needs Revision' \| 'Mastered' |
| `confidence` | `number` | Self-rated confidence percentage (0-100%) |
| `attempts` | `number` | Total number of attempts taken |
| `timeTaken` | `number` | Time taken in minutes |
| `lastSolved` | `string \| null` | Date string (YYYY-MM-DD) |
| `revision` | `boolean` | Flagged for revision queue |
| `favorite` | `boolean` | Starred problem |
| `updatedAt` | `string` | Timestamp ISO string |
