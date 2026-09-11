-- MySQL Schema for DSA Question Tracker Backend

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS questions (
    id INT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    topic VARCHAR(100) NOT NULL,
    difficulty VARCHAR(50) NOT NULL,
    stars INT DEFAULT 1,
    leet_code_url TEXT,
    solution_url TEXT,
    tags TEXT,
    category VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS question_progress (
    id VARCHAR(128) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    question_id INT NOT NULL,
    status VARCHAR(50) DEFAULT 'Not Started',
    confidence INT DEFAULT 0,
    attempts INT DEFAULT 0,
    time_taken INT DEFAULT 0,
    last_solved VARCHAR(20),
    revision BOOLEAN DEFAULT FALSE,
    favorite BOOLEAN DEFAULT FALSE,
    updated_at VARCHAR(64),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
    UNIQUE KEY uk_user_question_progress (user_id, question_id)
);

CREATE TABLE IF NOT EXISTS question_notes (
    id VARCHAR(128) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    question_id INT NOT NULL,
    note_text TEXT,
    updated_at VARCHAR(64),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
    UNIQUE KEY uk_user_question_note (user_id, question_id)
);

CREATE TABLE IF NOT EXISTS activity_logs (
    id VARCHAR(128) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    activity_date VARCHAR(20) NOT NULL,
    count INT DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY uk_user_activity_date (user_id, activity_date)
);

CREATE TABLE IF NOT EXISTS daily_goals (
    user_id VARCHAR(64) PRIMARY KEY,
    target INT DEFAULT 3,
    last_updated VARCHAR(64),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS user_settings (
    user_id VARCHAR(64) PRIMARY KEY,
    theme VARCHAR(20) DEFAULT 'dark',
    confidence_threshold INT DEFAULT 70,
    revision_reminder BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
