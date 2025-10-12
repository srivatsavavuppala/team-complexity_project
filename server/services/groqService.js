const Groq = require('groq-sdk');

class GroqService {
  constructor() {
    this.client = new Groq({
      apiKey: process.env.GROQ_API_KEY
    });
  }

  async analyzeResume(resumeText, jobDescription = '') {
    try {
      const prompt = `
        Analyze the following resume and provide a comprehensive evaluation. Pay special attention to extracting work experience accurately:
        
        Resume Text:
        ${resumeText}
        
        ${jobDescription ? `Job Description: ${jobDescription}` : ''}
        
        For experience calculation, consider ALL formats:
        - "2+ years experience" = 2 years
        - "5-7 years" = 6 years (average)
        - "2023-Present" = calculate from 2023 to current year
        - "Jan 2022 - Dec 2023" = calculate the difference
        - "Recent graduate" = 0 years
        - Multiple jobs = sum total experience
        - Overlapping positions = don't double count
        
        Please provide:
        1. Skills extracted from the resume (programming languages, frameworks, tools, soft skills)
        2. Total years of experience (calculate accurately from all work history)
        3. Current/most recent job title and company
        4. Education level and field
        5. Key strengths and weaknesses
        6. Overall assessment score (1-100)
        7. Recommendations for improvement
        ${jobDescription ? '8. Job fit analysis and compatibility score' : ''}
        
        Format your response as JSON with the following structure:
        {
          "skills": ["skill1", "skill2", ...],
          "experienceYears": number,
          "currentJobTitle": "string",
          "currentCompany": "string", 
          "educationLevel": "string",
          "educationField": "string",
          "strengths": ["strength1", "strength2", ...],
          "weaknesses": ["weakness1", "weakness2", ...],
          "overallScore": number,
          "recommendations": ["rec1", "rec2", ...],
          ${jobDescription ? '"jobFitScore": number,' : ''}
          "summary": "Brief summary of the candidate",
          "experienceBreakdown": "Detailed explanation of how experience was calculated"
        }
      `;

      const completion = await this.client.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.3,
        max_tokens: 2000
      });

      const response = completion.choices[0]?.message?.content;
      return this.parseJsonResponse(response);
    } catch (error) {
      console.error('Error analyzing resume:', error);
      throw new Error('Failed to analyze resume');
    }
  }

  async generateInterviewQuestions(jobTitle, jobDescription, candidateSkills = [], difficulty = 'easy') {
    try {
      const prompt = `
You are creating interview questions for a VOICE-RECORDED interview session. The output MUST be valid JSON and nothing else.

Important override: Regardless of the jobDifficulty input, set every question's "difficulty" field to "easy". All questions should be voice-friendly and suitable for short spoken answers.

Context:
- This interview will be read aloud by an interviewer and recorded as voice responses from the candidate.
- Questions must be short, clear, and natural to speak (suitable for TTS or an interviewer reading them).
- Candidate answers will be short-to-medium. Provide guidance for expected answer length (seconds).
- Include a short "readable" prompt (1 sentence) the interviewer can read exactly.
- Include a recommended pause (in milliseconds) the interviewer should wait after reading the question to allow the candidate to respond.

Requirements:
1. Generate between 10 and 15 questions total.
2. Distribute questions roughly as: Technical 40%, Behavioral 30%, Situational 20%, Cultural 10%.
3. For each question include:
   - "question": the full question text (suitable for internal display)
   - "readable": a concise single-sentence phrasing the interviewer should read aloud (≤ 20 words)
   - "category": one of "technical", "behavioral", "situational", "cultural"
   - "difficulty": **must be** "easy" for every question
   - "expected_answer_duration_seconds": integer (recommended seconds candidate should speak; typical easy ranges 15-60)
   - "recommended_pause_ms": integer (milliseconds to pause after reading; for easy questions recommend 8000-30000)
   - "follow_up": an array of up to 2 short follow-up question strings (optional)
4. Keep each "readable" phrase free of special characters that might confuse TTS.
5. Make questions appropriate for the provided inputs:
   - Job Title: ${jobTitle}
   - Job Description: ${jobDescription}
   - Candidate Skills: ${candidateSkills.join(', ')}
   - Overall difficulty preference: ${difficulty} (IGNORE this for per-question difficulty; still include in meta)
6. Ensure technical questions test core skills listed in Candidate Skills and the Job Description. Prioritize practical, conversational prompts that can be answered aloud.
7. Avoid numbering inside the question strings (the JSON structure will indicate order).
8. Output only JSON structured exactly as below.

Desired JSON format:
{
  "meta": {
    "jobTitle": "...",
    "difficulty": "easy|medium|hard", // keep the original field but per-question fields must be "easy"
    "total_questions": 12,
    "notes": "Voice-recording friendly; all questions difficulty='easy'; 'readable' is for interviewer."
  },
  "technical": [ ... ],
  "behavioral": [ ... ],
  "situational": [ ... ],
  "cultural": [ ... ]
}

Final instructions for the model:
- Do not include any explanatory text outside the JSON.
- Ensure JSON is valid and parseable.
- Set every question's "difficulty" property to the string "easy".
- Make expected_answer_duration_seconds and recommended_pause_ms realistic for spoken easy questions.
- Keep question wording voice-friendly and concise.
`;

      const completion = await this.client.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.7,
        max_tokens: 3000
      });

      const response = completion.choices[0]?.message?.content;
      return this.parseJsonResponse(response);
    } catch (error) {
      console.error('Error generating interview questions:', error);
      throw new Error('Failed to generate interview questions');
    }
  }

  async analyzeAssessmentResponses(questions, responses) {
    try {
      const prompt = `You are an expert HR analyst. Analyze the following interview assessment responses and provide detailed feedback.
  
  QUESTIONS AND RESPONSES:
  ${JSON.stringify({ questions, responses }, null, 2)}
  
  Please provide a comprehensive analysis in the following JSON format:
  {
    "overallScore": <number 0-100>,
    "overallFeedback": "<detailed overall assessment>",
    "sectionAnalysis": {
      "technical": {
        "score": <number 0-100>,
        "feedback": "<detailed feedback>",
        "strengths": ["<strength 1>", "<strength 2>"],
        "weaknesses": ["<weakness 1>", "<weakness 2>"],
        "responses": [
          {
            "question": "<question text>",
            "answer": "<answer text>",
            "score": <number 0-10>,
            "feedback": "<specific feedback for this answer>"
          }
        ]
      },
      "behavioral": {
        "score": <number 0-100>,
        "feedback": "<detailed feedback>",
        "strengths": ["<strength 1>", "<strength 2>"],
        "weaknesses": ["<weakness 1>", "<weakness 2>"],
        "responses": [
          {
            "question": "<question text>",
            "answer": "<answer text>",
            "score": <number 0-10>,
            "feedback": "<specific feedback>"
          }
        ]
      },
      "situational": {
        "score": <number 0-100>,
        "feedback": "<detailed feedback>",
        "strengths": ["<strength 1>", "<strength 2>"],
        "weaknesses": ["<weakness 1>", "<weakness 2>"],
        "responses": [
          {
            "question": "<question text>",
            "answer": "<answer text>",
            "score": <number 0-10>,
            "feedback": "<specific feedback>"
          }
        ]
      },
      "cultural": {
        "score": <number 0-100>,
        "feedback": "<detailed feedback>",
        "strengths": ["<strength 1>", "<strength 2>"],
        "weaknesses": ["<weakness 1>", "<weakness 2>"],
        "responses": [
          {
            "question": "<question text>",
            "answer": "<answer text>",
            "score": <number 0-10>,
            "feedback": "<specific feedback>"
          }
        ]
      }
    },
    "recommendation": "<Schedule an Interview|REJECT>",
    "recommendationReason": "<detailed explanation of recommendation>",
    "keyTakeaways": ["<takeaway 1>", "<takeaway 2>", "<takeaway 3>"]
  }
  
  Evaluate each response based on:
  - Relevance and completeness
  - Technical accuracy (for technical questions)
  - Communication clarity
  - Problem-solving approach
  - Cultural fit alignment
  
  Provide constructive feedback and actionable insights.`;
  
      const completion = await this.client.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are an expert HR analyst specializing in interview assessment and candidate evaluation. Provide detailed, constructive feedback in valid JSON format only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.3,
        max_tokens: 8000,
        response_format: { type: 'json_object' }
      });
  
      const analysisText = completion.choices[0]?.message?.content;
      if (!analysisText) {
        throw new Error('No analysis generated');
      }

      const analysis = JSON.parse(analysisText);
      
      return analysis;
    } catch (error) {
      console.error('Assessment analysis error:', error);
      throw new Error(`Failed to analyze assessment: ${error.message}`);
    }
  }

  async analyzeInterviewResponse(question, answer, jobContext) {
    try {
      const prompt = `
        Analyze the following interview response:
        
        Question: ${question}
        Answer: ${answer}
        Job Context: ${jobContext}
        
        Please provide:
        1. Answer quality score (1-10)
        2. Key strengths in the response
        3. Areas for improvement
        4. Follow-up questions suggestions
        5. Overall assessment
        
        Format as JSON:
        {
          "score": number,
          "strengths": ["strength1", "strength2", ...],
          "improvements": ["improvement1", "improvement2", ...],
          "followUpQuestions": ["question1", "question2", ...],
          "assessment": "Overall assessment text"
        }
      `;

      const completion = await this.client.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.3,
        max_tokens: 1500
      });

      const response = completion.choices[0]?.message?.content;
      return this.parseJsonResponse(response);
    } catch (error) {
      console.error('Error analyzing interview response:', error);
      throw new Error('Failed to analyze interview response');
    }
  }

  async matchCandidateToJob(candidateProfile, jobDescription) {
    try {
      const prompt = `
        Analyze the compatibility between this candidate and job position:
        
        Candidate Profile:
        ${JSON.stringify(candidateProfile, null, 2)}
        
        Job Description:
        ${jobDescription}
        
        Please provide:
        1. Overall match score (1-100)
        2. Skill alignment analysis
        3. Experience level fit
        4. Potential red flags or concerns
        5. Strengths that make them a good fit
        6. Areas where they might need development
        
        Format as JSON:
        {
          "matchScore": number,
          "skillAlignment": {
            "matched": ["skill1", "skill2", ...],
            "missing": ["skill1", "skill2", ...],
            "bonus": ["skill1", "skill2", ...]
          },
          "experienceFit": "underqualified|qualified|overqualified",
          "redFlags": ["flag1", "flag2", ...],
          "strengths": ["strength1", "strength2", ...],
          "developmentAreas": ["area1", "area2", ...],
          "recommendation": "hire|interview|reject",
          "reasoning": "Detailed reasoning for the recommendation"
        }
      `;

      const completion = await this.client.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.3,
        max_tokens: 2000
      });

      const response = completion.choices[0]?.message?.content;
      return this.parseJsonResponse(response);
    } catch (error) {
      console.error('Error matching candidate to job:', error);
      throw new Error('Failed to match candidate to job');
    }
  }

  async autoMatchCandidateToJobs(candidateProfile, availableJobs) {
    try {
      const prompt = `
        Analyze this candidate profile and automatically match them to the most suitable job positions:
        
        Candidate Profile:
        ${JSON.stringify(candidateProfile, null, 2)}
        
        Available Job Positions:
        ${JSON.stringify(availableJobs, null, 2)}
        
        For each job, calculate:
        1. Match score (0-100) based on:
           - Skills alignment (40%)
           - Experience level fit (30%)
           - Education requirements (20%)
           - Other factors (10%)
        2. Detailed reasoning for the score
        3. Missing skills that candidate should develop
        4. Recommendation (hire/interview/reject)
        
        Only return matches with score >= 30. Sort by match score descending.
        
        Format as JSON:
        {
          "matches": [
            {
              "jobId": "string",
              "jobTitle": "string",
              "matchScore": number,
              "skillsMatched": ["skill1", "skill2"],
              "skillsMissing": ["skill1", "skill2"],
              "experienceFit": "underqualified|qualified|overqualified",
              "recommendation": "hire|interview|reject",
              "reasoning": "Detailed explanation of the match"
            }
          ],
          "summary": "Overall assessment of candidate's job market fit"
        }
      `;

      const completion = await this.client.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.3,
        max_tokens: 3000
      });

      const response = completion.choices[0]?.message?.content;
      return this.parseJsonResponse(response);
    } catch (error) {
      console.error('Error in auto-matching:', error);
      throw new Error('Failed to auto-match candidate to jobs');
    }
  }

  parseJsonResponse(response) {
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      // If no JSON found, return a structured error response
      return {
        error: 'Invalid response format',
        rawResponse: response
      };
    } catch (error) {
      console.error('Error parsing JSON response:', error);
      return {
        error: 'Failed to parse AI response',
        rawResponse: response
      };
    }
  }
}

module.exports = new GroqService();