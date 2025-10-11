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
        this.db.run('PRAGMA foreign_keys = ON', (fkErr) => {
          if (fkErr) {
            console.error('Failed to enable foreign keys:', fkErr.message);
          } else {
            console.log('✅ Foreign key enforcement enabled');
          }
        });
        this.initializeTables();
      }
    });
    

    // Add helper namespaces
    this.candidates = {
      findById: (id) => new Promise((resolve, reject) => {
        this.db.get(`SELECT * FROM candidates WHERE id = ?`, [id], (err, row) => {
          if (err) return reject(err);
          resolve(row);
        });
      }),
      insert: (candidate) => new Promise((resolve, reject) => {
        const query = `INSERT INTO candidates 
          (id, name, email, phone, resume_text, resume_analysis, skills, experience_years, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        this.db.run(query, [
          candidate.id,
          candidate.name,
          candidate.email || null,
          candidate.phone || null,
          candidate.resume_text || null,
          candidate.resume_analysis || null,
          candidate.skills || null,
          candidate.experience_years || 0,
          candidate.created_at || new Date().toISOString(),
          candidate.updated_at || new Date().toISOString()
        ], function(err) {
          if (err) return reject(err);
          resolve(this);
        });
      })
    };

    this.assessments = {
      findById: (id) => new Promise((resolve, reject) => {
        this.db.get(`SELECT * FROM assessments WHERE id = ?`, [id], (err, row) => {
          if (err) return reject(err);
          if (row && row.questions) row.questions = JSON.parse(row.questions);
          resolve(row);
        });
      }),
      insert: (assessment) => new Promise((resolve, reject) => {
        const query = `INSERT INTO assessments 
          (id, candidate_id, job_id, questions, status, created_at, expires_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)`;
        console.log('Inserting assessment:', query, assessment);
        console.log('📝 With params:', [
          assessment.id,
          assessment.candidate_id,
          assessment.job_id,
          JSON.stringify(assessment.questions),
          assessment.status || 'pending',
          assessment.created_at || new Date().toISOString(),
          assessment.expires_at || new Date(Date.now() + 7*24*60*60*1000).toISOString()
        ]);
        this.db.run(query, [
          assessment.id,
          assessment.candidate_id,
          assessment.job_id,
          JSON.stringify(assessment.questions),
          assessment.status || 'pending',
          assessment.created_at || new Date().toISOString(),
          assessment.expires_at || new Date(Date.now() + 7*24*60*60*1000).toISOString()
        ], function(err) {
          if (err) return reject(err);
          resolve(this);
        });
      })
    };
  }

  initializeTables() {
    const tables = [
      `CREATE TABLE IF NOT EXISTS assessments (
        id TEXT PRIMARY KEY,
        candidate_id TEXT NOT NULL,
        job_id TEXT NOT NULL,
        questions TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
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