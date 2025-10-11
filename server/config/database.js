const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = process.env.DB_PATH || path.join(__dirname, '../database.sqlite');

class Database {
  constructor() {
    this.db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Error opening database:', err.message);
      } else {
        console.log('Connected to SQLite database');
        this.initializeTables();
      }
    });
  }

  initializeTables() {
    const tables = [
      `CREATE TABLE IF NOT EXISTS assessments (
        id TEXT PRIMARY KEY,
        candidate_id TEXT NOT NULL,
        job_id TEXT NOT NULL,
        questions TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        assessment_response TEXT,
        analysis TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME,
        FOREIGN KEY (candidate_id) REFERENCES candidates (id),
        FOREIGN KEY (job_id) REFERENCES job_positions (id)
      )`,
      `CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT DEFAULT 'recruiter',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS candidates (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        resume_text TEXT,
        resume_analysis TEXT,
        skills TEXT,
        experience_years INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS job_positions (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        requirements TEXT,
        skills_required TEXT,
        experience_required INTEGER,
        created_by TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users (id)
      )`,
      `CREATE TABLE IF NOT EXISTS interviews (
        id TEXT PRIMARY KEY,
        candidate_id TEXT NOT NULL,
        job_position_id TEXT NOT NULL,
        interviewer_id TEXT NOT NULL,
        questions TEXT,
        answers TEXT,
        ai_analysis TEXT,
        score INTEGER,
        status TEXT DEFAULT 'scheduled',
        scheduled_at DATETIME,
        completed_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (candidate_id) REFERENCES candidates (id),
        FOREIGN KEY (job_position_id) REFERENCES job_positions (id),
        FOREIGN KEY (interviewer_id) REFERENCES users (id)
      )`,
      `CREATE TABLE IF NOT EXISTS candidate_matches (
        id TEXT PRIMARY KEY,
        candidate_id TEXT NOT NULL,
        job_position_id TEXT NOT NULL,
        match_score INTEGER,
        ai_reasoning TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (candidate_id) REFERENCES candidates (id),
        FOREIGN KEY (job_position_id) REFERENCES job_positions (id)
      )`,
      `CrEATE TABLE IF NOT EXISTS assessment_response (
        id TEXT PRIMARY KEY,
        response TEXT
      )`
    ];

    tables.forEach(table => {
      this.db.run(table, (err) => {
        if (err) {
          console.error('Error creating table:', err.message);
        }
      });
    });
  }

  getDb() {
    return this.db;
  }

  close() {
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }
}

module.exports = new Database();