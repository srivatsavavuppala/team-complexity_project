const generateAssessmentEmail = (data) => {
    const {
      candidateName,
      jobTitle,
      companyName = 'TeamComplexity',
      assessmentLink,
      expiryDays = 7,
      questions,
      jobDescription
    } = data;
  
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + expiryDays);
    const formattedExpiryDate = expiryDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  
    // Count total questions
    const totalQuestions = 
      (questions.technical?.length || 0) +
      (questions.behavioral?.length || 0) +
      (questions.situational?.length || 0) +
      (questions.cultural?.length || 0);
  
    const estimatedTime = Math.max(20, totalQuestions * 3); // 3 minutes per question, minimum 20 minutes
  
    return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Assessment Invitation</title>
  </head>
  <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa;">
      <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f4f7fa;">
          <tr>
              <td style="padding: 40px 20px;">
                  <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                      
                      <!-- Header -->
                      <tr>
                          <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center; border-radius: 12px 12px 0 0;">
                              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600; letter-spacing: -0.5px;">
                                  🎯 Assessment Invitation
                              </h1>
                              <p style="margin: 10px 0 0 0; color: #e0e7ff; font-size: 16px;">
                                  ${companyName}
                              </p>
                          </td>
                      </tr>
  
                      <!-- Greeting -->
                      <tr>
                          <td style="padding: 40px 30px 20px 30px;">
                              <p style="margin: 0; font-size: 16px; color: #334155; line-height: 1.6;">
                                  Dear <strong>${candidateName}</strong>,
                              </p>
                          </td>
                      </tr>
  
                      <!-- Main Content -->
                      <tr>
                          <td style="padding: 0 30px 30px 30px;">
                              <p style="margin: 0 0 20px 0; font-size: 15px; color: #475569; line-height: 1.7;">
                                  Thank you for your interest in the <strong style="color: #667eea;">${jobTitle}</strong> position at ${companyName}. We're excited to move forward with your application!
                              </p>
                              
                              <p style="margin: 0 0 20px 0; font-size: 15px; color: #475569; line-height: 1.7;">
                                  As the next step in our hiring process, we'd like to invite you to complete an online assessment. This will help us better understand your skills and experience.
                              </p>
  
                              <!-- Info Box -->
                              <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f8fafc; border-radius: 8px; margin: 25px 0;">
                                  <tr>
                                      <td style="padding: 20px;">
                                          <table role="presentation" style="width: 100%; border-collapse: collapse;">
                                              <tr>
                                                  <td style="padding: 8px 0;">
                                                      <span style="color: #64748b; font-size: 14px;">📋 Total Questions:</span>
                                                      <span style="color: #1e293b; font-size: 14px; font-weight: 600; margin-left: 10px;">${totalQuestions}</span>
                                                  </td>
                                              </tr>
                                              <tr>
                                                  <td style="padding: 8px 0;">
                                                      <span style="color: #64748b; font-size: 14px;">⏱️ Estimated Time:</span>
                                                      <span style="color: #1e293b; font-size: 14px; font-weight: 600; margin-left: 10px;">${estimatedTime} minutes</span>
                                                  </td>
                                              </tr>
                                              <tr>
                                                  <td style="padding: 8px 0;">
                                                      <span style="color: #64748b; font-size: 14px;">📅 Valid Until:</span>
                                                      <span style="color: #1e293b; font-size: 14px; font-weight: 600; margin-left: 10px;">${formattedExpiryDate}</span>
                                                  </td>
                                              </tr>
                                          </table>
                                      </td>
                                  </tr>
                              </table>
  
                              <!-- CTA Button -->
                              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 30px 0;">
                                  <tr>
                                      <td style="text-align: center;">
                                          <a href="${assessmentLink}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4); transition: all 0.3s ease;">
                                              Start Assessment →
                                          </a>
                                      </td>
                                  </tr>
                                  <tr>
                                      <td style="text-align: center; padding-top: 15px;">
                                          <p style="margin: 0; font-size: 13px; color: #94a3b8;">
                                              Or copy this link: <a href="${assessmentLink}" style="color: #667eea; text-decoration: none;">${assessmentLink}</a>
                                          </p>
                                      </td>
                                  </tr>
                              </table>
                          </td>
                      </tr>
  
                      <!-- Assessment Sections -->
                      <tr>
                          <td style="padding: 0 30px 30px 30px;">
                              <h2 style="margin: 0 0 20px 0; font-size: 18px; color: #1e293b; font-weight: 600;">
                                  Assessment Sections
                              </h2>
  
                              ${questions.technical && questions.technical.length > 0 ? `
                              <div style="margin-bottom: 20px; padding: 15px; background-color: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 4px;">
                                  <h3 style="margin: 0 0 10px 0; color: #1e40af; font-size: 15px; font-weight: 600;">
                                      💻 Technical Questions (${questions.technical.length})
                                  </h3>
                                  <p style="margin: 0; color: #475569; font-size: 14px; line-height: 1.6;">
                                      These questions assess your technical knowledge and problem-solving abilities related to the role.
                                  </p>
                              </div>
                              ` : ''}
  
                              ${questions.behavioral && questions.behavioral.length > 0 ? `
                              <div style="margin-bottom: 20px; padding: 15px; background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px;">
                                  <h3 style="margin: 0 0 10px 0; color: #92400e; font-size: 15px; font-weight: 600;">
                                      🤝 Behavioral Questions (${questions.behavioral.length})
                                  </h3>
                                  <p style="margin: 0; color: #475569; font-size: 14px; line-height: 1.6;">
                                      Share your past experiences and how you handle different workplace situations.
                                  </p>
                              </div>
                              ` : ''}
  
                              ${questions.situational && questions.situational.length > 0 ? `
                              <div style="margin-bottom: 20px; padding: 15px; background-color: #fce7f3; border-left: 4px solid #ec4899; border-radius: 4px;">
                                  <h3 style="margin: 0 0 10px 0; color: #9f1239; font-size: 15px; font-weight: 600;">
                                      🎯 Situational Questions (${questions.situational.length})
                                  </h3>
                                  <p style="margin: 0; color: #475569; font-size: 14px; line-height: 1.6;">
                                      Demonstrate how you would approach hypothetical scenarios relevant to the position.
                                  </p>
                              </div>
                              ` : ''}
  
                              ${questions.cultural && questions.cultural.length > 0 ? `
                              <div style="margin-bottom: 20px; padding: 15px; background-color: #d1fae5; border-left: 4px solid #10b981; border-radius: 4px;">
                                  <h3 style="margin: 0 0 10px 0; color: #065f46; font-size: 15px; font-weight: 600;">
                                      🏢 Cultural Fit Questions (${questions.cultural.length})
                                  </h3>
                                  <p style="margin: 0; color: #475569; font-size: 14px; line-height: 1.6;">
                                      Help us understand your work style and how you'd fit within our team culture.
                                  </p>
                              </div>
                              ` : ''}
                          </td>
                      </tr>
  
                      <!-- Tips Section -->
                      <tr>
                          <td style="padding: 0 30px 30px 30px;">
                              <div style="background-color: #f1f5f9; padding: 20px; border-radius: 8px;">
                                  <h3 style="margin: 0 0 15px 0; color: #1e293b; font-size: 16px; font-weight: 600;">
                                      💡 Tips for Success
                                  </h3>
                                  <ul style="margin: 0; padding-left: 20px; color: #475569; font-size: 14px; line-height: 1.8;">
                                      <li>Find a quiet, distraction-free environment</li>
                                      <li>Ensure you have a stable internet connection</li>
                                      <li>Answer thoughtfully and take your time</li>
                                      <li>Be specific and provide examples when possible</li>
                                      <li>Complete the assessment in one sitting</li>
                                  </ul>
                              </div>
                          </td>
                      </tr>
  
                      <!-- Closing -->
                      <tr>
                          <td style="padding: 0 30px 40px 30px;">
                              <p style="margin: 0 0 15px 0; font-size: 15px; color: #475569; line-height: 1.7;">
                                  We're looking forward to learning more about you! If you have any questions or encounter any issues, please don't hesitate to reach out.
                              </p>
                              <p style="margin: 0; font-size: 15px; color: #475569; line-height: 1.7;">
                                  Best regards,<br>
                                  <strong style="color: #1e293b;">${companyName}</strong>
                              </p>
                          </td>
                      </tr>
  
                      <!-- Footer -->
                      <tr>
                          <td style="background-color: #f8fafc; padding: 30px; text-align: center; border-radius: 0 0 12px 12px; border-top: 1px solid #e2e8f0;">
                              <p style="margin: 0 0 10px 0; font-size: 13px; color: #64748b;">
                                  This assessment link will expire on <strong>${formattedExpiryDate}</strong>
                              </p>
                              <p style="margin: 0; font-size: 12px; color: #94a3b8;">
                                  © ${new Date().getFullYear()} ${companyName}. All rights reserved.
                              </p>
                          </td>
                      </tr>
  
                  </table>
              </td>
          </tr>
      </table>
  </body>
  </html>
    `;
  };
  
  module.exports = { generateAssessmentEmail };