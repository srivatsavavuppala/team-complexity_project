const express = require('express');
const { v4: uuidv4 } = require('uuid');
const Joi = require('joi');
const database = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const groqService = require('../services/groqService');

const router = express.Router();
const db = database.getDb();

// Validation schemas
const interviewSchema = Joi.object({
  candidateId: Joi.string().required(),
  jobPositionId: Joi.string().required(),
  scheduledAt: Joi.date().iso().required(),
  questions: Joi.array().items(Joi.object()).optional()
});

const answerSchema = Joi.object({
  questionId: Joi.string().required(),
  question: Joi.string().required(),
  answer: Joi.string().required()
});

router.delete('/:interviewId', authenticateToken, async (req, res) => {
  const interviewId = req.params.interviewId;

  db.run('DELETE FROM interviews WHERE id = ?', [interviewId], function (err) {
    if (err) {
      console.error('Error deleting interviewId:', err.message);
      return res.status(500).json({ success: false, error: 'Failed to delete scheduled interview' });
    }

    // this.changes tells you how many rows were deleted
    if (this.changes === 0) {
      return res.status(404).json({ success: false, error: 'interviewId not found' });
    }

    res.json({ success: true });
  });
});

// Schedule interview
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { error, value } = interviewSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { candidateId, jobPositionId, scheduledAt, questions } = value;
    const interviewId = uuidv4();

    // Verify candidate and job exist
    const candidate = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM candidates WHERE id = ?', [candidateId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    const job = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM job_positions WHERE id = ?', [jobPositionId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!candidate || !job) {
      return res.status(404).json({ error: 'Candidate or job position not found' });
    }

    db.run(
      `INSERT INTO interviews (id, candidate_id, job_position_id, interviewer_id, questions, scheduled_at, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        interviewId,
        candidateId,
        jobPositionId,
        req.user.userId,
        questions ? JSON.stringify(questions) : null,
        scheduledAt,
        'scheduled'
      ],
      function(err) {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'Failed to schedule interview' });
        }

        res.status(201).json({
          message: 'Interview scheduled successfully',
          interview: {
            id: interviewId,
            candidateId,
            jobPositionId,
            interviewerId: req.user.userId,
            scheduledAt,
            status: 'scheduled'
          }
        });
      }
    );
  } catch (error) {
    console.error('Schedule interview error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all interviews
router.get('/', authenticateToken, (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;
  const status = req.query.status;

  let query = `
    SELECT i.*, 
           c.name as candidate_name, c.email as candidate_email,
           j.title as job_title,
           u.name as interviewer_name
    FROM interviews i
    JOIN candidates c ON i.candidate_id = c.id
    JOIN job_positions j ON i.job_position_id = j.id
    JOIN users u ON i.interviewer_id = u.id
  `;
  
  let countQuery = 'SELECT COUNT(*) as total FROM interviews i';
  let params = [];

  if (status) {
    query += ' WHERE i.status = ?';
    countQuery += ' WHERE i.status = ?';
    params = [status];
  }

  query += ' ORDER BY i.scheduled_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  // Get total count
  db.get(countQuery, status ? [status] : [], (err, countResult) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    // Get interviews
    db.all(query, params, (err, interviews) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      // Parse JSON fields
      const processedInterviews = interviews.map(interview => ({
        ...interview,
        questions: interview.questions ? JSON.parse(interview.questions) : null,
        answers: interview.answers ? JSON.parse(interview.answers) : null,
        ai_analysis: interview.ai_analysis ? JSON.parse(interview.ai_analysis) : null
      }));

      res.json({
        interviews: processedInterviews,
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

// Get interview by ID
router.get('/:id', authenticateToken, (req, res) => {
  db.get(
    `SELECT i.*, 
           c.name as candidate_name, c.email as candidate_email, c.phone as candidate_phone,
           j.title as job_title, j.description as job_description,
           u.name as interviewer_name
     FROM interviews i
     JOIN candidates c ON i.candidate_id = c.id
     JOIN job_positions j ON i.job_position_id = j.id
     JOIN users u ON i.interviewer_id = u.id
     WHERE i.id = ?`,
    [req.params.id],
    (err, interview) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!interview) {
        return res.status(404).json({ error: 'Interview not found' });
      }

      // Parse JSON fields
      interview.questions = interview.questions ? JSON.parse(interview.questions) : null;
      interview.answers = interview.answers ? JSON.parse(interview.answers) : null;
      interview.ai_analysis = interview.ai_analysis ? JSON.parse(interview.ai_analysis) : null;

      res.json({ interview });
    }
  );
});

router.post('/from-assessment', authenticateToken, async (req, res) => {
  try {
    const { candidateId, jobId, scheduledAt } = req.body;

    // Validate required fields
    if (!candidateId || !jobId || !scheduledAt) {
      return res.status(400).json({ 
        error: 'Candidate ID, Job ID, and scheduled date/time are required' 
      });
    }

    // Verify candidate exists
    const candidate = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM candidates WHERE id = ?', [candidateId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    // Verify job exists
    const job = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM job_positions WHERE id = ?', [jobId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!job) {
      return res.status(404).json({ error: 'Job position not found' });
    }

    // Create interview record
    const interviewId = uuidv4();
    
    await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO interviews (id, candidate_id, job_position_id, interviewer_id, scheduled_at, status)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          interviewId,
          candidateId,
          jobId,
          req.user.userId,
          new Date(scheduledAt).toISOString(),
          'scheduled'
        ],
        function(err) {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    console.log(`✅ Interview scheduled from assessment for candidate ${candidateId}, interview ID: ${interviewId}`);

    res.status(201).json({
      message: 'Interview scheduled successfully from assessment',
      interview: {
        id: interviewId,
        candidateId,
        candidateName: candidate.name,
        jobId,
        jobTitle: job.title,
        interviewerId: req.user.userId,
        scheduledAt: new Date(scheduledAt).toISOString(),
        status: 'scheduled'
      }
    });

  } catch (error) {
    console.error('Schedule interview from assessment error:', error);
    res.status(500).json({ error: error.message || 'Failed to schedule interview' });
  }
});

// Start interview (update status to in_progress)
router.post('/:id/start', authenticateToken, (req, res) => {
  db.run(
    'UPDATE interviews SET status = ? WHERE id = ? AND interviewer_id = ?',
    ['in_progress', req.params.id, req.user.userId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to start interview' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Interview not found or unauthorized' });
      }

      res.json({ message: 'Interview started successfully' });
    }
  );
});

// Submit answer and get AI analysis
router.post('/:id/answer', authenticateToken, async (req, res) => {
  try {
    const { error, value } = answerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { questionId, question, answer } = value;
    const interviewId = req.params.id;

    // Get interview and job context
    const interview = await new Promise((resolve, reject) => {
      db.get(
        `SELECT i.*, j.title, j.description 
         FROM interviews i 
         JOIN job_positions j ON i.job_position_id = j.id 
         WHERE i.id = ?`,
        [interviewId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!interview) {
      return res.status(404).json({ error: 'Interview not found' });
    }

    // Get AI analysis of the answer
    const jobContext = `${interview.title}: ${interview.description}`;
    const analysis = await groqService.analyzeInterviewResponse(question, answer, jobContext);

    // Update interview with new answer
    let currentAnswers = interview.answers ? JSON.parse(interview.answers) : [];
    currentAnswers.push({
      id: questionId,
      question,
      answer,
      analysis,
      timestamp: new Date().toISOString()
    });

    db.run(
      'UPDATE interviews SET answers = ? WHERE id = ?',
      [JSON.stringify(currentAnswers), interviewId],
      function(err) {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'Failed to save answer' });
        }

        res.json({
          message: 'Answer submitted and analyzed successfully',
          analysis
        });
      }
    );
  } catch (error) {
    console.error('Submit answer error:', error);
    res.status(500).json({ error: error.message || 'Failed to analyze answer' });
  }
});

// Complete interview
router.post('/:id/complete', authenticateToken, async (req, res) => {
  try {
    const interviewId = req.params.id;
    const { overallFeedback, finalScore } = req.body;

    // Get interview data
    const interview = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM interviews WHERE id = ?', [interviewId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!interview) {
      return res.status(404).json({ error: 'Interview not found' });
    }

    // Calculate overall analysis
    const answers = interview.answers ? JSON.parse(interview.answers) : [];
    let totalScore = 0;
    let analysisCount = 0;

    answers.forEach(answer => {
      if (answer.analysis && answer.analysis.score) {
        totalScore += answer.analysis.score;
        analysisCount++;
      }
    });

    const averageScore = analysisCount > 0 ? Math.round((totalScore / analysisCount) * 10) : finalScore || 0;

    const overallAnalysis = {
      averageScore,
      finalScore: finalScore || averageScore,
      totalQuestions: answers.length,
      overallFeedback: overallFeedback || 'No additional feedback provided',
      completedAt: new Date().toISOString(),
      answersSummary: answers.map(a => ({
        question: a.question,
        score: a.analysis?.score || 0,
        strengths: a.analysis?.strengths || [],
        improvements: a.analysis?.improvements || []
      }))
    };

    db.run(
      'UPDATE interviews SET status = ?, ai_analysis = ?, score = ?, completed_at = CURRENT_TIMESTAMP WHERE id = ?',
      ['completed', JSON.stringify(overallAnalysis), averageScore, interviewId],
      function(err) {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'Failed to complete interview' });
        }

        res.json({
          message: 'Interview completed successfully',
          analysis: overallAnalysis
        });
      }
    );
  } catch (error) {
    console.error('Complete interview error:', error);
    res.status(500).json({ error: 'Failed to complete interview' });
  }
});

// Update interview
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const interviewId = req.params.id;
    const { scheduledAt, questions, status } = req.body;

    let updateFields = [];
    let updateValues = [];

    if (scheduledAt) {
      updateFields.push('scheduled_at = ?');
      updateValues.push(scheduledAt);
    }

    if (questions) {
      updateFields.push('questions = ?');
      updateValues.push(JSON.stringify(questions));
    }

    if (status) {
      updateFields.push('status = ?');
      updateValues.push(status);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updateValues.push(interviewId);
    updateValues.push(req.user.userId);

    db.run(
      `UPDATE interviews SET ${updateFields.join(', ')} WHERE id = ? AND interviewer_id = ?`,
      updateValues,
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Failed to update interview' });
        }

        if (this.changes === 0) {
          return res.status(404).json({ error: 'Interview not found or unauthorized' });
        }

        res.json({ message: 'Interview updated successfully' });
      }
    );
  } catch (error) {
    console.error('Update interview error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete interview
router.delete('/:id', authenticateToken, (req, res) => {
  db.run(
    'DELETE FROM interviews WHERE id = ? AND interviewer_id = ?',
    [req.params.id, req.user.userId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to delete interview' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Interview not found or unauthorized' });
      }

      res.json({ message: 'Interview deleted successfully' });
    }
  );
});
module.exports = router;