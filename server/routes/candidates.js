const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const Joi = require('joi');
const database = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const groqService = require('../services/groqService');
const fileParser = require('../utils/fileParser');

const router = express.Router();
const db = database.getDb();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOCX, and TXT files are allowed.'));
    }
  }
});

// Validation schemas
const candidateSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().optional(),
  phone: Joi.string().optional(),
  skills: Joi.string().optional(),
  experienceYears: Joi.number().integer().min(0).optional()
});

// Upload and analyze resume
router.post('/upload-resume', authenticateToken, upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No resume file uploaded' });
    }

    // Parse the resume file
    const parsedResume = await fileParser.parseResume(req.file);
    const contactInfo = fileParser.extractContactInfo(parsedResume.text);

    // Analyze resume with AI
    const analysis = await groqService.analyzeResume(parsedResume.text);

    // Create candidate record
    const candidateId = uuidv4();
    const candidateData = {
      id: candidateId,
      name: req.body.name || 'Unknown',
      email: req.body.email || contactInfo.email,
      phone: req.body.phone || contactInfo.phone,
      resume_text: parsedResume.text,
      resume_analysis: JSON.stringify(analysis),
      skills: JSON.stringify(analysis.skills || []),
      experience_years: analysis.experienceYears || 0
    };

    db.run(
      `INSERT INTO candidates (id, name, email, phone, resume_text, resume_analysis, skills, experience_years, current_job_title, current_company, education_level, education_field)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        candidateData.id,
        candidateData.name,
        candidateData.email,
        candidateData.phone,
        candidateData.resume_text,
        candidateData.resume_analysis,
        candidateData.skills,
        candidateData.experience_years,
        analysis.currentJobTitle || null,
        analysis.currentCompany || null,
        analysis.educationLevel || null,
        analysis.educationField || null
      ],
      async function(err) {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'Failed to save candidate' });
        }

        // Auto-match candidate to available jobs
        try {
          const availableJobs = await new Promise((resolve, reject) => {
            db.all('SELECT * FROM job_positions ORDER BY created_at DESC', (err, rows) => {
              if (err) reject(err);
              else resolve(rows);
            });
          });

          if (availableJobs.length > 0) {
            const candidateProfile = {
              name: candidateData.name,
              skills: analysis.skills || [],
              experienceYears: analysis.experienceYears || 0,
              currentJobTitle: analysis.currentJobTitle || '',
              currentCompany: analysis.currentCompany || '',
              educationLevel: analysis.educationLevel || '',
              educationField: analysis.educationField || '',
              overallScore: analysis.overallScore || 0,
              summary: analysis.summary || ''
            };

            const autoMatches = await groqService.autoMatchCandidateToJobs(candidateProfile, availableJobs);
            
            // Save auto-matches to database
            if (autoMatches.matches && autoMatches.matches.length > 0) {
              const matchPromises = autoMatches.matches.map(match => {
                return new Promise((resolve, reject) => {
                  const matchId = uuidv4();
                  db.run(
                    'INSERT INTO candidate_matches (id, candidate_id, job_position_id, match_score, ai_reasoning) VALUES (?, ?, ?, ?, ?)',
                    [matchId, candidateId, match.jobId, match.matchScore, JSON.stringify(match)],
                    (err) => {
                      if (err) reject(err);
                      else resolve();
                    }
                  );
                });
              });

              await Promise.all(matchPromises);
              console.log(`Auto-matched candidate ${candidateData.name} to ${autoMatches.matches.length} jobs`);
            }
          }
        } catch (autoMatchError) {
          console.error('Auto-matching failed:', autoMatchError);
          // Don't fail the entire request if auto-matching fails
        }

        res.status(201).json({
          message: 'Resume uploaded, analyzed, and auto-matched successfully',
          candidate: {
            id: candidateData.id,
            name: candidateData.name,
            email: candidateData.email,
            phone: candidateData.phone,
            skills: analysis.skills,
            experienceYears: analysis.experienceYears,
            currentJobTitle: analysis.currentJobTitle,
            currentCompany: analysis.currentCompany,
            educationLevel: analysis.educationLevel,
            analysis: analysis
          }
        });
      }
    );
  } catch (error) {
    console.error('Resume upload error:', error);
    res.status(500).json({ error: error.message || 'Failed to process resume' });
  }
});

// Get all candidates
router.get('/', authenticateToken, (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;
  const search = req.query.search || '';

  let query = 'SELECT * FROM candidates';
  let countQuery = 'SELECT COUNT(*) as total FROM candidates';
  let params = [];

  if (search) {
    query += ' WHERE name LIKE ? OR email LIKE ? OR skills LIKE ?';
    countQuery += ' WHERE name LIKE ? OR email LIKE ? OR skills LIKE ?';
    params = [`%${search}%`, `%${search}%`, `%${search}%`];
  }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  // Get total count
  db.get(countQuery, search ? [`%${search}%`, `%${search}%`, `%${search}%`] : [], (err, countResult) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    // Get candidates
    db.all(query, params, (err, candidates) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      // Parse JSON fields
      const processedCandidates = candidates.map(candidate => ({
        ...candidate,
        skills: candidate.skills ? JSON.parse(candidate.skills) : [],
        resume_analysis: candidate.resume_analysis ? JSON.parse(candidate.resume_analysis) : null
      }));

      res.json({
        candidates: processedCandidates,
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

// Get candidate by ID
router.get('/:id', authenticateToken, (req, res) => {
  db.get('SELECT * FROM candidates WHERE id = ?', [req.params.id], (err, candidate) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    // Parse JSON fields
    candidate.skills = candidate.skills ? JSON.parse(candidate.skills) : [];
    candidate.resume_analysis = candidate.resume_analysis ? JSON.parse(candidate.resume_analysis) : null;

    res.json({ candidate });
  });
});

// Update candidate
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { error, value } = candidateSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { name, email, phone, skills, experienceYears } = value;
    const candidateId = req.params.id;

    db.run(
      `UPDATE candidates 
       SET name = ?, email = ?, phone = ?, skills = ?, experience_years = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        name,
        email,
        phone,
        skills ? JSON.stringify(skills.split(',').map(s => s.trim())) : null,
        experienceYears,
        candidateId
      ],
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Failed to update candidate' });
        }

        if (this.changes === 0) {
          return res.status(404).json({ error: 'Candidate not found' });
        }

        res.json({ message: 'Candidate updated successfully' });
      }
    );
  } catch (error) {
    console.error('Update candidate error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete candidate
router.delete('/:id', authenticateToken, (req, res) => {
  db.run('DELETE FROM candidates WHERE id = ?', [req.params.id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Failed to delete candidate' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    res.json({ message: 'Candidate deleted successfully' });
  });
});

// Get auto-matches for candidate
router.get('/:id/matches', authenticateToken, (req, res) => {
  const candidateId = req.params.id;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  const query = `
    SELECT cm.*, j.title, j.description, j.skills_required, j.experience_required
    FROM candidate_matches cm
    JOIN job_positions j ON cm.job_position_id = j.id
    WHERE cm.candidate_id = ?
    ORDER BY cm.match_score DESC
    LIMIT ? OFFSET ?
  `;

  const countQuery = `
    SELECT COUNT(*) as total
    FROM candidate_matches cm
    WHERE cm.candidate_id = ?
  `;

  // Get total count
  db.get(countQuery, [candidateId], (err, countResult) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    // Get matches
    db.all(query, [candidateId, limit, offset], (err, matches) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      // Parse AI reasoning
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

// Match candidate to job
router.post('/:id/match-job/:jobId', authenticateToken, async (req, res) => {
  try {
    const candidateId = req.params.id;
    const jobId = req.params.jobId;

    // Get candidate and job data
    const candidate = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM candidates WHERE id = ?', [candidateId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    const job = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM job_positions WHERE id = ?', [jobId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!candidate || !job) {
      return res.status(404).json({ error: 'Candidate or job not found' });
    }

    // Prepare candidate profile
    const candidateProfile = {
      name: candidate.name,
      skills: candidate.skills ? JSON.parse(candidate.skills) : [],
      experienceYears: candidate.experience_years,
      resumeAnalysis: candidate.resume_analysis ? JSON.parse(candidate.resume_analysis) : null
    };

    // Get AI matching analysis
    const matchAnalysis = await groqService.matchCandidateToJob(candidateProfile, job.description);

    // Save match result
    const matchId = uuidv4();
    db.run(
      'INSERT INTO candidate_matches (id, candidate_id, job_position_id, match_score, ai_reasoning) VALUES (?, ?, ?, ?, ?)',
      [matchId, candidateId, jobId, matchAnalysis.matchScore, JSON.stringify(matchAnalysis)],
      function(err) {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'Failed to save match result' });
        }

        res.json({
          message: 'Candidate matched to job successfully',
          match: {
            id: matchId,
            candidateId,
            jobId,
            matchScore: matchAnalysis.matchScore,
            analysis: matchAnalysis
          }
        });
      }
    );
  } catch (error) {
    console.error('Job matching error:', error);
    res.status(500).json({ error: error.message || 'Failed to match candidate to job' });
  }
});

module.exports = router;