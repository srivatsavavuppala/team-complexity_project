// @ts-check
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const database = require('../config/database');
const db = database.getDb();
console.log('authenticateToken: ', authenticateToken)


router.post('/get-ai-assessment', authenticateToken, async (req, res) => {
    let userId = req.body.userId
    console.log('userId: ', userId)
    db.get(`SELECT * FROM assessments where candidate_id = ?`, [userId], (err, row) => {
        if (err) {
            console.error('DB fetch error:', err.message);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json({ questions: JSON.stringify(row.questions), status: row.status});
    })


})

router.post('/submit-assessment', authenticateToken,  async (req, res) => {
  try {



    let userId = req.body.userId


    
    const response = JSON.stringify(req.body.formattedAnswers)


    
      const insertQuery = `
        UPDATE assessments 
        SET response = ?, status = 'complete'
        WHERE candidate_id = ?
        
      `;
      db.run(insertQuery, [ response, userId], (err) => {
        if (err) console.error('DB insert error:', err.message);
      });
    

    res.json({ success: true, message: 'Assessment saved successfully with transcription' });
  } catch (error) {
    console.error('Error saving assessment:', error);
    res.status(500).json({ success: false, message: 'Failed to save assessment' });
  }
});





module.exports = router;