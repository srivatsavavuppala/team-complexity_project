const { v4: uuidv4 } = require('uuid');
const nodemailer = require('nodemailer');
const db = require('../db');

async function createAssessmentAndSendEmail({ candidateId, jobId, questions }) {
  const assessmentId = uuidv4();
  const assessment = {
    id: assessmentId,
    candidateId,
    jobId,
    questions,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 7*24*60*60*1000), // 7 days
    status: 'pending'
  };

  await db.assessments.insert(assessment);

  const link = `${process.env.APP_URL || 'http://localhost:3000'}/assessments/${assessmentId}/take`;
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'https://api.smtp2go.com/v3/',
    port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  // fetch candidate email from DB (adjust)
  const candidate = await db.candidates.findById(candidateId);
  if (!candidate) throw new Error('Candidate not found');

  const mailOptions = {
    from: '"TeamComplexity Assesment Mail" <no-reply@yourcompany.com>',
    to: candidate.email,
    subject: `Assessment for ${jobId}`,
    text: `Hi ${candidate.name},\n\nPlease complete this assessment: ${link}\n\nBest,\nRecruiter`,
    html: `<p>Hi ${candidate.name},</p><p>Please complete this assessment: <a href="${link}">${link}</a></p>`
  };

  await transporter.sendMail(mailOptions);

  return { assessmentId };
}

module.exports = { createAssessmentAndSendEmail };