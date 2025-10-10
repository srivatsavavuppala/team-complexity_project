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

  async generateInterviewQuestions(jobTitle, jobDescription, candidateSkills = [], difficulty = 'medium') {
    try {
      const prompt = `
        Generate interview questions for the following position:
        
        Job Title: ${jobTitle}
        Job Description: ${jobDescription}
        Candidate Skills: ${candidateSkills.join(', ')}
        Difficulty Level: ${difficulty}
        
        Please generate 10-15 interview questions covering:
        1. Technical skills (40%)
        2. Behavioral questions (30%)
        3. Situational questions (20%)
        4. Company culture fit (10%)
        
        Format your response as JSON:
        {
          "technical": [
            {"question": "...", "category": "technical", "difficulty": "easy|medium|hard"}
          ],
          "behavioral": [
            {"question": "...", "category": "behavioral", "difficulty": "easy|medium|hard"}
          ],
          "situational": [
            {"question": "...", "category": "situational", "difficulty": "easy|medium|hard"}
          ],
          "cultural": [
            {"question": "...", "category": "cultural", "difficulty": "easy|medium|hard"}
          ]
        }
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