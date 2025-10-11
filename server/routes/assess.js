// @ts-check
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const database = require('../config/database');
const db = database.getDb();
console.log('authenticateToken: ', authenticateToken)

router.post('/submit-assessment', authenticateToken,  async (req, res) => {
  try {

    console.log('reqeust body: ', req.body)
    console.log('reqeust files: ', req.files)

    let response = 'Assessment Response: \n\n\n'
    let userId = req.body.userId
    let questions = req.body.questions
    let transcripts = req.body.transcripts

    for(let i=0; i<questions.length; i++) {
        response += `Question: ${questions[i]}\nAnswer: ${transcripts[i]}\n\n`
    }
    console.log('response: ', response)


    // console.log('ressssssssss: ', res)
    // const { questions, answers, userId, transcripts } = JSON.parse(req.body.data);
    // console.log('questions: ', questions)
    // console.log('transcripts: ', transcripts)

    // for (let i = 0; i < questions.length; i++) {
    //   const q = questions[i];
    //   const sliderValue = answers[i];
    //   const audioPath = req.files[i]?.path || null;
    //   let transcription = '';

    // //   if (audioPath) {
    // //     transcription = await transcribeAudio(audioPath); // 💬 transcribe here
    // //   }

      const insertQuery = `
        INSERT INTO assessment_response (id, response)
        VALUES (?, ?)
      `;
      db.run(insertQuery, [userId, response], (err) => {
        if (err) console.error('DB insert error:', err.message);
      });
    // }

    res.json({ success: true, message: 'Assessment saved successfully with transcription' });
  } catch (error) {
    console.error('Error saving assessment:', error);
    // res.status(500).json({ success: false, message: 'Failed to save assessment' });
  }
});


module.exports = router;