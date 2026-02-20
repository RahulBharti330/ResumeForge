import Database from 'better-sqlite3';
import path from 'path';

const db = new Database('nlp_platform.db');

// Initialize database schema
db.exec(`
  CREATE TABLE IF NOT EXISTS resumes (
    id TEXT PRIMARY KEY,
    filename TEXT NOT NULL,
    content TEXT NOT NULL,
    upload_date TEXT NOT NULL,
    status TEXT DEFAULT 'raw' -- raw, annotated
  );

  CREATE TABLE IF NOT EXISTS annotations (
    id TEXT PRIMARY KEY,
    resume_id TEXT NOT NULL,
    label TEXT NOT NULL, -- e.g., NAME, SKILL, ORG
    start_index INTEGER NOT NULL,
    end_index INTEGER NOT NULL,
    text TEXT NOT NULL,
    FOREIGN KEY (resume_id) REFERENCES resumes(id)
  );
`);

export default db;
