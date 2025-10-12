const express = require('express');
const { v4: uuidv4 } = require('uuid');
const Joi = require('joi');
const database = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const groqService = require('../services/groqService');

const router = express.Router();
const db = database.getDb();

// Validation schemas
const jobSchema = Joi.object({
  title: Joi.string().min(2).max(200).required(),
  description: Joi.string().min(10).required(),
  requirements: Joi.string().optional(),
  skillsRequired: Joi.string().optional(),
  experienceRequired: Joi.number().integer().min(0).optional()
});

// Create job position with auto-match
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { error, value } = jobSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { title, description, requirements, skillsRequired, experienceRequired } = value;
    const jobId = uuidv4();

    db.run(
      `INSERT INTO job_positions (id, title, description, requirements, skills_required, experience_required, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [jobId, title, description, requirements, skillsRequired, experienceRequired, req.user.userId],
      async function(err) {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'Failed to create job position' });
        }
        try {
          const candidates = await new Promise((resolve, reject) => {
            db.all('SELECT * FROM candidates', [], (err, rows) => {
              if (err) reject(err);
              else resolve(rows);
            });
          });

          for (const candidate of candidates) {
            try {
              const matchResult = await groqService.matchCandidateToJob(
                {
                  skills: candidate.skills?.split(',') || [],
                  experienceYears: candidate.experience_years || 0,
                  resumeText: candidate.resume_text
                },
                description
              );

              const matchId = uuidv4();
              db.run(
                `INSERT INTO candidate_matches (id, candidate_id, job_position_id, match_score, ai_reasoning, created_at)
                 VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
                [matchId, candidate.id, jobId, matchResult.matchScore, JSON.stringify(matchResult)]
              );
            } catch (err) {
              console.error(`Failed to match candidate ${candidate.id}:`, err);
            }
          }
        } catch (err) {
          console.error('Failed to fetch candidates for matching:', err);
        }

        res.status(201).json({
          message: 'Job position created successfully',
          job: {
            id: jobId,
            title,
            description,
            requirements,
            skillsRequired,
            experienceRequired
          }
        });
      }
    );
  } catch (error) {
    console.error('Create job error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:jobId', authenticateToken, async (req, res) => {
  const jobId = req.params.jobId;

  db.run('DELETE FROM job_positions WHERE id = ?', [jobId], function (err) {
    if (err) {
      console.error('Error deleting job_positions:', err.message);
      return res.status(500).json({ success: false, error: 'Failed to delete job_positions' });
    }

    // this.changes tells you how many rows were deleted
    if (this.changes === 0) {
      return res.status(404).json({ success: false, error: 'job_positions not found' });
    }

    res.json({ success: true });
  });
});

// Get all job positions
router.get('/', authenticateToken, (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;
  const search = req.query.search || '';

  let query = `
    SELECT j.*, u.name as created_by_name 
    FROM job_positions j 
    LEFT JOIN users u ON j.created_by = u.id
  `;
  let countQuery = 'SELECT COUNT(*) as total FROM job_positions j';
  let params = [];

  if (search) {
    query += ' WHERE j.title LIKE ? OR j.description LIKE ? OR j.skills_required LIKE ?';
    countQuery += ' WHERE j.title LIKE ? OR j.description LIKE ? OR j.skills_required LIKE ?';
    params = [`%${search}%`, `%${search}%`, `%${search}%`];
  }

  query += ' ORDER BY j.created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  db.get(countQuery, search ? [`%${search}%`, `%${search}%`, `%${search}%`] : [], (err, countResult) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    db.all(query, params, (err, jobs) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      res.json({
        jobs,
        pagination: {
          page,
          limit,
          total: countResult.total,
          pages: Math.ceil(countResult.total / limit)
        }
      });
    });
  });
});

// Get job position by ID
router.get('/:id', authenticateToken, (req, res) => {
  db.get(
    `SELECT j.*, u.name as created_by_name 
     FROM job_positions j 
     LEFT JOIN users u ON j.created_by = u.id 
     WHERE j.id = ?`,
    [req.params.id],
    (err, job) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!job) {
        return res.status(404).json({ error: 'Job position not found' });
      }

      res.json({ job });
    }
  );
});

// Update job position
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { error, value } = jobSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { title, description, requirements, skillsRequired, experienceRequired } = value;
    const jobId = req.params.id;

    db.run(
      `UPDATE job_positions 
       SET title = ?, description = ?, requirements = ?, skills_required = ?, experience_required = ?
       WHERE id = ? AND created_by = ?`,
      [title, description, requirements, skillsRequired, experienceRequired, jobId, req.user.userId],
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Failed to update job position' });
        }

        if (this.changes === 0) {
          return res.status(404).json({ error: 'Job position not found or unauthorized' });
        }

        res.json({ message: 'Job position updated successfully' });
      }
    );
  } catch (error) {
    console.error('Update job error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete job position
router.delete('/:id', authenticateToken, (req, res) => {
  db.run(
    'DELETE FROM job_positions WHERE id = ? AND created_by = ?',
    [req.params.id, req.user.userId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to delete job position' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Job position not found or unauthorized' });
      }

      res.json({ message: 'Job position deleted successfully' });
    }
  );
});

// Generate interview questions for job
router.post('/:id/generate-questions', authenticateToken, async (req, res) => {
  try {
    const jobId = req.params.id;
    const { candidateSkills = [], difficulty = 'medium' } = req.body;

    const job = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM job_positions WHERE id = ?', [jobId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!job) {
      return res.status(404).json({ error: 'Job position not found' });
    }

    const questions = await groqService.generateInterviewQuestions(
      job.title,
      job.description,
      candidateSkills,
      difficulty
    );

    res.json({
      message: 'Interview questions generated successfully',
      jobTitle: job.title,
      questions
    });
  } catch (error) {
    console.error('Generate questions error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate interview questions' });
  }
});

// Get job matches (candidates matched to this job) - UPDATED WITH ASSESSMENT STATUS
router.get('/:id/matches', authenticateToken, (req, res) => {
  const jobId = req.params.id;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  const query = `
    SELECT 
      cm.*, 
      c.name, 
      c.email, 
      c.phone, 
      c.experience_years,
      c.id as candidate_id,
      a.status as assessment_status
    FROM candidate_matches cm
    JOIN candidates c ON cm.candidate_id = c.id
    LEFT JOIN assessments a ON a.candidate_id = c.id AND a.job_id = cm.job_position_id
    WHERE cm.job_position_id = ?
    ORDER BY cm.match_score DESC
    LIMIT ? OFFSET ?
  `;

  const countQuery = `
    SELECT COUNT(*) as total
    FROM candidate_matches cm
    WHERE cm.job_position_id = ?
  `;

  db.get(countQuery, [jobId], (err, countResult) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    db.all(query, [jobId, limit, offset], (err, matches) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      const processedMatches = matches.map(match => ({
        ...match,
        ai_reasoning: match.ai_reasoning ? JSON.parse(match.ai_reasoning) : null
      }));

      res.json({
        matches: processedMatches,
        pagination: {
          page,
          limit,
          total: countResult.total,
          pages: Math.ceil(countResult.total / limit)
        }
      });
    });
  });
});

module.exports = router;