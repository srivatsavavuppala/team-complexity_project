"""
Groq AI Service for resume analysis, interview questions, and candidate matching
"""

import os
import json
import re
from typing import Dict, List, Any, Optional
from groq import Groq
from models.schemas import (
    ResumeAnalysis, InterviewQuestions, InterviewQuestion, 
    InterviewAnalysis, CandidateMatch, SkillAlignment, Difficulty
)

class GroqService:
    """Service for interacting with Groq AI API"""
    
    def __init__(self):
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise ValueError("GROQ_API_KEY environment variable is required")
        
        self.client = Groq(api_key=api_key)
        self.model = "llama3-8b-8192"
    
    async def analyze_resume(self, resume_text: str, job_description: str = "") -> ResumeAnalysis:
        """Analyze resume text and provide comprehensive evaluation"""
        
        prompt = f"""
        Analyze the following resume and provide a comprehensive evaluation:
        
        Resume Text:
        {resume_text}
        
        {f"Job Description: {job_description}" if job_description else ""}
        
        Please provide:
        1. Skills extracted from the resume
        2. Years of experience estimate
        3. Key strengths and weaknesses
        4. Overall assessment score (1-100)
        5. Recommendations for improvement
        {f"6. Job fit analysis and compatibility score" if job_description else ""}
        
        Format your response as JSON with the following structure:
        {{
          "skills": ["skill1", "skill2", ...],
          "experience_years": number,
          "strengths": ["strength1", "strength2", ...],
          "weaknesses": ["weakness1", "weakness2", ...],
          "overall_score": number,
          "recommendations": ["rec1", "rec2", ...],
          {f'"job_fit_score": number,' if job_description else ""}
          "summary": "Brief summary of the candidate"
        }}
        """
        
        try:
            completion = self.client.chat.completions.create(
                messages=[{"role": "user", "content": prompt}],
                model=self.model,
                temperature=0.3,
                max_tokens=2000
            )
            
            response_content = completion.choices[0].message.content
            parsed_response = self._parse_json_response(response_content)
            
            return ResumeAnalysis(
                skills=parsed_response.get("skills", []),
                experience_years=parsed_response.get("experience_years", 0),
                strengths=parsed_response.get("strengths", []),
                weaknesses=parsed_response.get("weaknesses", []),
                overall_score=parsed_response.get("overall_score", 0),
                recommendations=parsed_response.get("recommendations", []),
                job_fit_score=parsed_response.get("job_fit_score"),
                summary=parsed_response.get("summary", "")
            )
            
        except Exception as e:
            print(f"Error analyzing resume: {e}")
            raise Exception("Failed to analyze resume")
    
    async def generate_interview_questions(
        self, 
        job_title: str, 
        job_description: str, 
        candidate_skills: List[str] = None, 
        difficulty: str = "medium"
    ) -> InterviewQuestions:
        """Generate interview questions for a position"""
        
        candidate_skills = candidate_skills or []
        
        prompt = f"""
        Generate interview questions for the following position:
        
        Job Title: {job_title}
        Job Description: {job_description}
        Candidate Skills: {', '.join(candidate_skills)}
        Difficulty Level: {difficulty}
        
        Please generate 10-15 interview questions covering:
        1. Technical skills (40%)
        2. Behavioral questions (30%)
        3. Situational questions (20%)
        4. Company culture fit (10%)
        
        Format your response as JSON:
        {{
          "technical": [
            {{"question": "...", "category": "technical", "difficulty": "easy|medium|hard"}}
          ],
          "behavioral": [
            {{"question": "...", "category": "behavioral", "difficulty": "easy|medium|hard"}}
          ],
          "situational": [
            {{"question": "...", "category": "situational", "difficulty": "easy|medium|hard"}}
          ],
          "cultural": [
            {{"question": "...", "category": "cultural", "difficulty": "easy|medium|hard"}}
          ]
        }}
        """
        
        try:
            completion = self.client.chat.completions.create(
                messages=[{"role": "user", "content": prompt}],
                model=self.model,
                temperature=0.7,
                max_tokens=3000
            )
            
            response_content = completion.choices[0].message.content
            parsed_response = self._parse_json_response(response_content)
            
            def parse_questions(questions_data: List[Dict]) -> List[InterviewQuestion]:
                return [
                    InterviewQuestion(
                        question=q.get("question", ""),
                        category=q.get("category", ""),
                        difficulty=Difficulty(q.get("difficulty", "medium"))
                    )
                    for q in questions_data
                ]
            
            return InterviewQuestions(
                technical=parse_questions(parsed_response.get("technical", [])),
                behavioral=parse_questions(parsed_response.get("behavioral", [])),
                situational=parse_questions(parsed_response.get("situational", [])),
                cultural=parse_questions(parsed_response.get("cultural", []))
            )
            
        except Exception as e:
            print(f"Error generating interview questions: {e}")
            raise Exception("Failed to generate interview questions")
    
    async def analyze_interview_response(
        self, 
        question: str, 
        answer: str, 
        job_context: str
    ) -> InterviewAnalysis:
        """Analyze an interview response"""
        
        prompt = f"""
        Analyze the following interview response:
        
        Question: {question}
        Answer: {answer}
        Job Context: {job_context}
        
        Please provide:
        1. Answer quality score (1-10)
        2. Key strengths in the response
        3. Areas for improvement
        4. Follow-up questions suggestions
        5. Overall assessment
        
        Format as JSON:
        {{
          "score": number,
          "strengths": ["strength1", "strength2", ...],
          "improvements": ["improvement1", "improvement2", ...],
          "follow_up_questions": ["question1", "question2", ...],
          "assessment": "Overall assessment text"
        }}
        """
        
        try:
            completion = self.client.chat.completions.create(
                messages=[{"role": "user", "content": prompt}],
                model=self.model,
                temperature=0.3,
                max_tokens=1500
            )
            
            response_content = completion.choices[0].message.content
            parsed_response = self._parse_json_response(response_content)
            
            return InterviewAnalysis(
                score=parsed_response.get("score", 0),
                strengths=parsed_response.get("strengths", []),
                improvements=parsed_response.get("improvements", []),
                follow_up_questions=parsed_response.get("follow_up_questions", []),
                assessment=parsed_response.get("assessment", "")
            )
            
        except Exception as e:
            print(f"Error analyzing interview response: {e}")
            raise Exception("Failed to analyze interview response")
    
    async def match_candidate_to_job(
        self, 
        candidate_profile: Dict[str, Any], 
        job_description: str
    ) -> CandidateMatch:
        """Analyze compatibility between candidate and job position"""
        
        prompt = f"""
        Analyze the compatibility between this candidate and job position:
        
        Candidate Profile:
        {json.dumps(candidate_profile, indent=2)}
        
        Job Description:
        {job_description}
        
        Please provide:
        1. Overall match score (1-100)
        2. Skill alignment analysis
        3. Experience level fit
        4. Potential red flags or concerns
        5. Strengths that make them a good fit
        6. Areas where they might need development
        
        Format as JSON:
        {{
          "match_score": number,
          "skill_alignment": {{
            "matched": ["skill1", "skill2", ...],
            "missing": ["skill1", "skill2", ...],
            "bonus": ["skill1", "skill2", ...]
          }},
          "experience_fit": "underqualified|qualified|overqualified",
          "red_flags": ["flag1", "flag2", ...],
          "strengths": ["strength1", "strength2", ...],
          "development_areas": ["area1", "area2", ...],
          "recommendation": "hire|interview|reject",
          "reasoning": "Detailed reasoning for the recommendation"
        }}
        """
        
        try:
            completion = self.client.chat.completions.create(
                messages=[{"role": "user", "content": prompt}],
                model=self.model,
                temperature=0.3,
                max_tokens=2000
            )
            
            response_content = completion.choices[0].message.content
            parsed_response = self._parse_json_response(response_content)
            
            skill_alignment_data = parsed_response.get("skill_alignment", {})
            skill_alignment = SkillAlignment(
                matched=skill_alignment_data.get("matched", []),
                missing=skill_alignment_data.get("missing", []),
                bonus=skill_alignment_data.get("bonus", [])
            )
            
            return CandidateMatch(
                match_score=parsed_response.get("match_score", 0),
                skill_alignment=skill_alignment,
                experience_fit=parsed_response.get("experience_fit", "qualified"),
                red_flags=parsed_response.get("red_flags", []),
                strengths=parsed_response.get("strengths", []),
                development_areas=parsed_response.get("development_areas", []),
                recommendation=parsed_response.get("recommendation", "interview"),
                reasoning=parsed_response.get("reasoning", "")
            )
            
        except Exception as e:
            print(f"Error matching candidate to job: {e}")
            raise Exception("Failed to match candidate to job")
    
    def _parse_json_response(self, response: str) -> Dict[str, Any]:
        """Parse JSON response from AI, handling various formats"""
        try:
            # Try to extract JSON from the response
            json_match = re.search(r'\{.*\}', response, re.DOTALL)
            if json_match:
                json_str = json_match.group(0)
                return json.loads(json_str)
            
            # If no JSON found, return error response
            return {
                "error": "Invalid response format",
                "raw_response": response
            }
            
        except json.JSONDecodeError as e:
            print(f"Error parsing JSON response: {e}")
            return {
                "error": "Failed to parse AI response",
                "raw_response": response
            }

# Create a singleton instance
groq_service = GroqService()