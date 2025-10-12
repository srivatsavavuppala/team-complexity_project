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
const { generateAssessmentEmail } = require('../utils/assessmentEmailTemplate');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS
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
    fileSize: 10 * 1024 * 1024
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
    // const calculatedExperience = parseExperienceYears(parsedResume.text);
    // console.log('calculatedExperience: ', calculatedExperience)
    // analysis.experienceYears = calculatedExperience;

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

        try {
          const jobs = await new Promise((resolve, reject) => {
            db.all('SELECT * FROM job_positions', [], (err, rows) => {
              if (err) reject(err);
              else resolve(rows);
            });
          });

          if (jobs.length > 0) {
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

            const autoMatches = await groqService.autoMatchCandidateToJobs(candidateProfile, jobs);
            
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

// SINGLE CONSOLIDATED SEND ASSESSMENT ENDPOINT
router.post('/:candidateId/send-assessment', authenticateToken, async (req, res) => {
  try {
    const { candidateId } = req.params;
    const { jobId, questions } = req.body;

    // Validate input
    if (!jobId || !questions) {
      return res.status(400).json({ error: 'Job ID and questions are required' });
    }

    // Check if candidate exists
    const candidate = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM candidates WHERE id = ?', [candidateId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    if (!candidate.email) {
      return res.status(400).json({ error: 'Candidate does not have an email address' });
    }

    // Check if job exists
    const job = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM job_positions WHERE id = ?', [jobId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!job) {
      return res.status(404).json({ error: 'Job position not found' });
    }

    // Check if assessment already exists for this candidate-job combination
    const existingAssessment = await new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM assessments WHERE candidate_id = ? AND job_id = ?',
        [candidateId, jobId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    let assessmentId;

    if (existingAssessment) {
      // UPDATE existing assessment (resend case)
      assessmentId = existingAssessment.id;
      
      await new Promise((resolve, reject) => {
        db.run(
          `UPDATE assessments 
           SET questions = ?, status = 'pending', expires_at = ?, created_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
          [JSON.stringify(questions), expiresAt.toISOString(), existingAssessment.id],
          function(err) {
            if (err) reject(err);
            else resolve();
          }
        );
      });

      console.log(`✅ Assessment UPDATED for candidate ${candidateId}, assessment ID: ${assessmentId}`);
    } else {
      // CREATE new assessment
      assessmentId = uuidv4();
      
      await new Promise((resolve, reject) => {
        db.run(
          `INSERT INTO assessments (id, candidate_id, job_id, questions, status, expires_at)
           VALUES (?, ?, ?, ?, 'pending', ?)`,
          [assessmentId, candidateId, jobId, JSON.stringify(questions), expiresAt.toISOString()],
          function(err) {
            if (err) reject(err);
            else resolve();
          }
        );
      });

      console.log(`✅ Assessment CREATED for candidate ${candidateId}, assessment ID: ${assessmentId}`);
    }

    // Generate assessment link
    const assessmentLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/Assess/${candidateId}`;

    // Generate beautiful email HTML
    const emailHtml = generateAssessmentEmail({
      candidateName: candidate.name,
      jobTitle: job.title,
      companyName: process.env.COMPANY_NAME || 'TeamComplexity',
      assessmentLink: assessmentLink,
      expiryDays: 7,
      questions: questions,
      jobDescription: job.description
    });

    // Send email
    try {
      await transporter.sendMail({
        from: `"${process.env.COMPANY_NAME || 'TeamComplexity'} Recruitment" <${process.env.GMAIL_USER}>`,
        to: candidate.email,
        subject: `Assessment Invitation: ${job.title} Position`,
        html: emailHtml
      });

      console.log(`📧 Assessment email sent to ${candidate.email}`);
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      return res.status(500).json({ 
        error: 'Failed to send assessment email',
        details: emailError.message 
      });
    }

    res.json({ 
      success: true, 
      message: `Assessment ${existingAssessment ? 'resent' : 'sent'} successfully to ${candidate.name}`,
      email: candidate.email,
      expiresAt: expiresAt.toISOString(),
      assessmentId: assessmentId
    });

  } catch (error) {
    console.error('Send assessment error:', error);
    res.status(500).json({ error: error.message || 'Failed to send assessment' });
  }
});

// GET assessment by ID (for candidates taking the test)
router.get('/assessment/:assessmentId', async (req, res) => {
  try {
    const { assessmentId } = req.params;

    const assessment = await new Promise((resolve, reject) => {
      db.get(
        `SELECT a.*, c.name as candidate_name, c.email, j.title as job_title, j.description as job_description
         FROM assessments a
         JOIN candidates c ON a.candidate_id = c.id
         JOIN job_positions j ON a.job_id = j.id
         WHERE a.id = ?`,
        [assessmentId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!assessment) {
      return res.status(404).json({ error: 'Assessment not found' });
    }

    if (new Date(assessment.expires_at) < new Date()) {
      return res.status(410).json({ error: 'Assessment has expired' });
    }

    if (assessment.status === 'completed') {
      return res.status(400).json({ error: 'Assessment already completed' });
    }

    res.json({
      assessment: {
        id: assessment.id,
        candidateName: assessment.candidate_name,
        jobTitle: assessment.job_title,
        jobDescription: assessment.job_description,
        questions: JSON.parse(assessment.questions),
        expiresAt: assessment.expires_at,
        status: assessment.status
      }
    });

  } catch (error) {
    console.error('Get assessment error:', error);
    res.status(500).json({ error: 'Failed to retrieve assessment' });
  }
});

// SUBMIT assessment
router.post('/assessment/:assessmentId/submit', async (req, res) => {
  try {
    const { assessmentId } = req.params;
    const { responses } = req.body;

    if (!responses) {
      return res.status(400).json({ error: 'Responses are required' });
    }

    const assessment = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM assessments WHERE id = ?', [assessmentId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!assessment) {
      return res.status(404).json({ error: 'Assessment not found' });
    }

    if (assessment.status === 'completed') {
      return res.status(400).json({ error: 'Assessment already completed' });
    }

    if (new Date(assessment.expires_at) < new Date()) {
      return res.status(410).json({ error: 'Assessment has expired' });
    }

    // Update assessment status to completed
    await new Promise((resolve, reject) => {
      db.run(
        `UPDATE assessments SET status = 'completed' WHERE id = ?`,
        [assessmentId],
        function(err) {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    // Store responses in assessment_response table
    const responseId = uuidv4();
    await new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO assessment_response (id, response) VALUES (?, ?)',
        [responseId, JSON.stringify({ assessmentId, responses })],
        function(err) {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    res.json({ 
      success: true, 
      message: 'Assessment submitted successfully' 
    });

  } catch (error) {
    console.error('Submit assessment error:', error);
    res.status(500).json({ error: 'Failed to submit assessment' });
  }
});

// GENERATE ANALYSIS
router.post('/:candidateId/generate-analysis', authenticateToken, async (req, res) => {
  try {
    const { candidateId } = req.params;
    const { jobId } = req.body;

    if (!jobId) {
      return res.status(400).json({ error: 'Job ID is required' });
    }

    const assessment = await new Promise((resolve, reject) => {
      db.get(
        `SELECT a.*, c.name as candidate_name, c.email, j.title as job_title
         FROM assessments a
         JOIN candidates c ON a.candidate_id = c.id
         JOIN job_positions j ON a.job_id = j.id
         WHERE a.candidate_id = ? AND a.job_id = ?`,
        [candidateId, jobId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!assessment) {
      return res.status(404).json({ error: 'Assessment not found for this candidate and job' });
    }

    if (assessment.status !== 'completed') {
      return res.status(400).json({ error: 'Assessment is not completed yet' });
    }

    if (assessment.analysis) {
      try {
        const existingAnalysis = JSON.parse(assessment.analysis);
        if (existingAnalysis.sectionAnalysis && existingAnalysis.overallScore !== undefined) {
          console.log('Valid analysis already exists, returning cached version');
          return res.json({ 
            message: 'Analysis already exists',
            analysis: existingAnalysis,
            cached: true
          });
        } else {
          console.log('Analysis exists but has wrong structure, regenerating...');
        }
      } catch (parseError) {
        console.log('Error parsing existing analysis, regenerating...', parseError);
      }
    }

    const responseRecord = await new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM assessment_response WHERE response LIKE ?',
        [`%"assessmentId":"${assessment.id}"%`],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!responseRecord) {
      return res.status(404).json({ error: 'Assessment responses not found' });
    }

    const responseData = JSON.parse(responseRecord.response);
    const questions = JSON.parse(assessment.questions);
    const responses = responseData.responses;

    console.log('Generating new analysis for candidate:', candidateId);

    const analysis = await groqService.analyzeAssessmentResponses(questions, responses);

    if (!analysis.sectionAnalysis || analysis.overallScore === undefined) {
      console.error('Invalid analysis structure received from Groq');
      throw new Error('Analysis generated with invalid structure');
    }

    await new Promise((resolve, reject) => {
      db.run(
        'UPDATE assessments SET analysis = ? WHERE id = ?',
        [JSON.stringify(analysis), assessment.id],
        function(err) {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    console.log('Analysis generated and saved successfully');

    res.json({
      success: true,
      message: 'Analysis generated successfully',
      analysis,
      cached: false
    });

  } catch (error) {
    console.error('Generate analysis error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate analysis' });
  }
});

// GET ANALYSIS
router.get('/:candidateId/analysis/:jobId', authenticateToken, async (req, res) => {
  try {
    const { candidateId, jobId } = req.params;

    const assessment = await new Promise((resolve, reject) => {
      db.get(
        `SELECT a.*, c.name as candidate_name, c.email, j.title as job_title
         FROM assessments a
         JOIN candidates c ON a.candidate_id = c.id
         JOIN job_positions j ON a.job_id = j.id
         WHERE a.candidate_id = ? AND a.job_id = ?`,
        [candidateId, jobId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!assessment) {
      return res.status(404).json({ error: 'Assessment not found' });
    }

    if (!assessment.analysis) {
      return res.status(404).json({ error: 'No analysis found for this assessment' });
    }

    const parsedAnalysis = JSON.parse(assessment.analysis);

    res.json({
      success: true,
      analysis: parsedAnalysis,
      candidateName: assessment.candidate_name,
      jobTitle: assessment.job_title
    });

  } catch (error) {
    console.error('Get analysis error:', error);
    res.status(500).json({ error: 'Failed to retrieve analysis' });
  }
});

// GET ALL CANDIDATES
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

  db.get(countQuery, search ? [`%${search}%`, `%${search}%`, `%${search}%`] : [], (err, countResult) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    db.all(query, params, (err, candidates) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

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

// GET CANDIDATE BY ID
router.get('/:id', authenticateToken, (req, res) => {
  db.get('SELECT * FROM candidates WHERE id = ?', [req.params.id], (err, candidate) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    candidate.skills = candidate.skills ? JSON.parse(candidate.skills) : [];
    candidate.resume_analysis = candidate.resume_analysis ? JSON.parse(candidate.resume_analysis) : null;

    res.json({ candidate });
  });
});

// UPDATE CANDIDATE
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

// DELETE CANDIDATE
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

// GET CANDIDATE MATCHES
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

  db.get(countQuery, [candidateId], (err, countResult) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    db.all(query, [candidateId, limit, offset], (err, matches) => {
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

// MATCH CANDIDATE TO JOB
router.post('/:id/match-job/:jobId', authenticateToken, async (req, res) => {
  try {
    const candidateId = req.params.id;
    const jobId = req.params.jobId;

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

    const candidateProfile = {
      name: candidate.name,
      skills: candidate.skills ? JSON.parse(candidate.skills) : [],
      experienceYears: candidate.experience_years,
      resumeAnalysis: candidate.resume_analysis ? JSON.parse(candidate.resume_analysis) : null
    };

    const matchAnalysis = await groqService.matchCandidateToJob(candidateProfile, job.description);

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