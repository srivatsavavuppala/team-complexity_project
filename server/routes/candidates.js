const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const Joi = require('joi');
const database = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const groqService = require('../services/groqService');
const fileParser = require('../utils/fileParser');
const crypto = require('crypto');
const router = express.Router();
const db = database.getDb();
const nodemailer = require('nodemailer');


const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER, // your Gmail
    pass: process.env.GMAIL_PASS  // app password
  }
});

const parseExperienceYears = (resumeText) => {
  const regex = /(\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)?\.?\s?\d{4}\b|\d{2}[\/\-]\d{4}|\b\d{4}\b)\s*[-–]\s*(Present|\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)?\.?\s?\d{4}\b|\d{2}[\/\-]\d{4}|\b\d{4}\b)/gi;
  let totalMonths = 0;
  const now = new Date();

  let match;
  while ((match = regex.exec(resumeText)) !== null) {
    let start = match[1];
    let end = match[2];

    const parseDate = (str) => {
      if (!str || str.toLowerCase() === 'present') return now;
      let d = new Date(str);
      if (!isNaN(d)) return d;
      const mmYYYY = str.match(/(\d{1,2})[\/\-](\d{4})/);
      if (mmYYYY) return new Date(parseInt(mmYYYY[2]), parseInt(mmYYYY[1]) - 1, 1);
      const yyyy = str.match(/(\d{4})/);
      if (yyyy) return new Date(parseInt(yyyy[1]), 0, 1);
      return null;
    };

    const startDate = parseDate(start);
    const endDate = parseDate(end);

    if (startDate && endDate) {
      const months = (endDate.getFullYear() - startDate.getFullYear()) * 12 + (endDate.getMonth() - startDate.getMonth());
      totalMonths += months > 0 ? months : 0;
    }
  }

  const years = Math.floor(totalMonths / 12);
  return years > 0 ? `${years}+` : '0+';
};

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

router.post('/upload-resume', authenticateToken, upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No resume file uploaded' });

    const parsedResume = await fileParser.parseResume(req.file);
    const contactInfo = fileParser.extractContactInfo(parsedResume.text);

    const email = (req.body.email || contactInfo.email || '').trim() || null;
    const phone = (req.body.phone || contactInfo.phone || '').trim() || null;
    const name = (req.body.name || contactInfo.name || 'Unknown').trim();

    const existingCandidate = await new Promise((resolve, reject) => {
      if (email || phone) {
        const whereClauses = [];
        const params = [];
        if (email) { whereClauses.push('email = ?'); params.push(email); }
        if (phone) { whereClauses.push('phone = ?'); params.push(phone); }

        db.get(`SELECT * FROM candidates WHERE ${whereClauses.join(' OR ')} LIMIT 1`, params, (err, row) => {
          if (err) return reject(err);
          resolve(row);
        });
      } else {
        db.get('SELECT * FROM candidates WHERE resume_text = ? LIMIT 1', [parsedResume.text], (err, row) => {
          if (err) return reject(err);
          resolve(row);
        });
      }
    });

    if (existingCandidate) {
      return res.status(409).json({
        error: 'Candidate profile already exists',
        message: 'A candidate with the same email/phone or identical resume already exists.',
        candidate: {
          id: existingCandidate.id,
          name: existingCandidate.name,
          email: existingCandidate.email,
          phone: existingCandidate.phone
        }
      });
    }

    const analysis = await groqService.analyzeResume(parsedResume.text);
    const calculatedExperience = parseExperienceYears(parsedResume.text);
    analysis.experienceYears = calculatedExperience;

    const candidateId = uuidv4();
    const candidateData = {
      id: candidateId,
      name,
      email,
      phone,
      resume_text: parsedResume.text,
      resume_analysis: JSON.stringify(analysis),
      skills: JSON.stringify(analysis.skills || []),
      experience_years: analysis.experienceYears || 0
    };

    db.run(
      `INSERT INTO candidates (id, name, email, phone, resume_text, resume_analysis, skills, experience_years)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        candidateData.id,
        candidateData.name,
        candidateData.email,
        candidateData.phone,
        candidateData.resume_text,
        candidateData.resume_analysis,
        candidateData.skills,
        candidateData.experience_years
      ],
      async function(err) {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'Failed to save candidate' });
        }

        // ✅ Auto-match candidate to all existing jobs here
        try {
          const jobs = await new Promise((resolve, reject) => {
            db.all('SELECT * FROM job_positions', [], (err, rows) => {
              if (err) reject(err);
              else resolve(rows);
            });
          });

          for (const job of jobs) {
            try {
              const matchResult = await groqService.matchCandidateToJob(
                {
                  skills: analysis.skills || [],
                  experienceYears: candidateData.experience_years,
                  resumeText: candidateData.resume_text
                },
                job.description
              );

              const matchId = uuidv4();
              db.run(
                `INSERT INTO candidate_matches (id, candidate_id, job_position_id, match_score, ai_reasoning, created_at)
                 VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
                [matchId, candidateId, job.id, matchResult.matchScore, JSON.stringify(matchResult)]
              );
            } catch (matchErr) {
              console.error(`Failed to match candidate ${candidateId} to job ${job.id}:`, matchErr);
            }
          }
        } catch (matchError) {
          console.error('Failed to auto-match candidate to jobs:', matchError);
        }

        res.status(201).json({
          message: 'Resume uploaded, analyzed, and matched to jobs successfully',
          candidate: {
            id: candidateData.id,
            name: candidateData.name,
            email: candidateData.email,
            phone: candidateData.phone,
            skills: analysis.skills,
            experienceYears: analysis.experienceYears,
            analysis: analysis
          }
        });
      }
    );
  } catch (error) {
    console.error('Resume upload error:', error);
    const errMsg = (error && (error.message || '')).toString();

    if (errMsg.includes('UNABLE_TO_GET_ISSUER_CERT_LOCALLY') || errMsg.includes('unable to get local issuer certificate')) {
      return res.status(502).json({
        error: 'TLS certificate verification failed when calling the AI service. ' +
               'If you are in a corporate network or using a proxy that inspects TLS, add your corporate root CA to Node using NODE_EXTRA_CA_CERTS.'
      });
    }

    res.status(500).json({ error: error.message || 'Failed to process resume' });
  }
});

router.post('/:id/send-assessment', authenticateToken, async (req, res) => {
  try {
    const candidateId = req.params.id;
    const { jobId, questions } = req.body;

    const candidate = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM candidates WHERE id = ?', [candidateId], (err, row) => err ? reject(err) : resolve(row));
    });

    if (!candidate) return res.status(404).json({ error: 'Candidate not found' });
    const assessmentId = uuidv4();
    const assessmentLink = `https://your-frontend.com/assessment/${candidate.id}`;
    await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO assessments (id, candidate_id, job_id, questions, status, created_at, expires_at)
         VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?)`,
        [assessmentId, candidateId, jobId, JSON.stringify(questions), 'pending', new Date(Date.now() + 7*24*60*60*1000).toISOString()],
        function(err) {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    //SEND EMAIL
    await transporter.sendMail({
      from: `"TeamComplexity Assesment Mail" <${process.env.GMAIL_USER}>`,
      to: candidate.email,
      subject: `Assessment for Job`,
      html: `
        <p>Hello ${candidate.name},</p>
        <p>Please complete your assessment by clicking below:</p>
        <a href="${assessmentLink}" target="_blank">Start Assessment</a>
        <p>Questions included in the assessment:</p>
        <ul>
          ${questions.technical?.map(q => `<li>${q.question}</li>`).join('') || ''}
          ${questions.behavioral?.map(q => `<li>${q.question}</li>`).join('') || ''}
          ${questions.situational?.map(q => `<li>${q.question}</li>`).join('') || ''}
          ${questions.cultural?.map(q => `<li>${q.question}</li>`).join('') || ''}
        </ul>
        <p>Best regards,<br/>Your Company</p>
      `
    });

    res.json({ message: `Assessment link sent to ${candidate.email}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to send assessment' });
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