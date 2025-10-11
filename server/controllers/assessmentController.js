const { v4: uuidv4 } = require('uuid');
const nodemailer = require('nodemailer');
const db = require('../config/database');

async function createAssessmentAndSendEmail({ candidateId, jobId, questions }) {
  const assessmentId = uuidv4();

  const assessment = {
    id: assessmentId,
    candidate_id: candidateId,
    job_id: jobId,
    questions: JSON.stringify(questions),
    status: 'pending',
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 7*24*60*60*1000).toISOString()
  };

  try {
    const result = await db.assessments.insert(assessment);
    console.log('Assessment inserted:', result);
  } catch (err) {
    console.error('Failed to insert assessment:', err);
    throw err;
  }

  const candidate = await db.candidates.findById(candidateId);
  if (!candidate) throw new Error('Candidate not found');

  const link = `${process.env.APP_URL || 'http://localhost:3000'}/assessments/${assessmentId}/take`;

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.yourprovider.com',
    port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  const mailOptions = {
    from: '"TeamComplexity Assessment Mail" <no-reply@yourcompany.com>',
    to: candidate.email,
    subject: `Assessment for ${jobId}`,
    text: `Hi ${candidate.name},\n\nPlease complete this assessment: ${link}\n\nBest,\nRecruiter`,
    html: `<p>Hi ${candidate.name},</p><p>Please complete this assessment: <a href="${link}">${link}</a></p>`
  };

  await transporter.sendMail(mailOptions);

  return { assessmentId };
}

module.exports = { createAssessmentAndSendEmail };
