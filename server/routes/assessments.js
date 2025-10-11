const express = require('express');
const router = express.Router();
const { createAssessmentAndSendEmail } = require('../controllers/assessmentController');

// POST /api/assessments/send
router.post('/send', async (req, res) => {
  try {
    const { candidateId, jobId, questions } = req.body;

    if (!candidateId || !jobId || !questions) {
      return res.status(400).json({ error: 'candidateId, jobId, and questions are required' });
    }

    const result = await createAssessmentAndSendEmail({ candidateId, jobId, questions });
    res.json(result);
  } catch (err) {
    console.error('Error sending assessment:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
