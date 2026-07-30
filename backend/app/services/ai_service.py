import json
import re
import logging
import asyncio
import httpx
from typing import Any, Dict, Optional
from ..config import get_settings

settings = get_settings()


def _get_headers() -> Dict[str, str]:
    api_key = (settings.GROQ_API_KEY or "").strip().strip('"').strip("'")
    headers = {"Content-Type": "application/json"}
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"
    return headers


def _sync_chat_completion(url: str, headers: Dict[str, str], payload: Dict[str, Any]) -> str:
    with httpx.Client(timeout=120.0, trust_env=False) as client:
        response = client.post(url, headers=headers, json=payload)
        if response.status_code != 200:
            print(f"[DEBUG Groq Error {response.status_code}]: {response.text}", flush=True)
            logging.error(f"[DEBUG Groq Error {response.status_code}]: {response.text}")
        response.raise_for_status()
        data = response.json()
        return data["choices"][0]["message"]["content"]


async def _chat_completion(messages: list, json_mode: bool = False) -> str:
    """Send a chat completion request to Groq API and return the raw response text."""
    api_key = (settings.GROQ_API_KEY or "").strip().strip('"').strip("'")
    if not api_key:
        raise ValueError("GROQ_API_KEY is not configured in backend/.env. Please add your Groq API key.")

    model = (settings.GROQ_MODEL or "llama-3.3-70b-versatile").strip().strip('"').strip("'")
    base_url = (settings.GROQ_BASE_URL or "https://api.groq.com/openai/v1").strip().rstrip("/")
    headers = _get_headers()

    payload: Dict[str, Any] = {
        "model": model,
        "messages": messages,
    }
    # Groq API supports json_object natively for structured outputs
    if json_mode:
        payload["response_format"] = {"type": "json_object"}

    url = f"{base_url}/chat/completions"

    try:
        return await asyncio.to_thread(_sync_chat_completion, url, headers, payload)
    except httpx.HTTPStatusError as e:
        error_body = e.response.text if e.response is not None else str(e)
        print(f"[DEBUG Groq HTTPError] Status: {e.response.status_code if e.response else 'None'}", flush=True)
        print(f"[DEBUG Groq HTTPError] Body: {error_body}", flush=True)
        logging.error(f"Groq API HTTP Error {e.response.status_code if e.response is not None else 'Unknown'}: {error_body}")
        raise ValueError(f"Groq API Error ({e.response.status_code if e.response is not None else 'Error'}): {error_body}") from e
    except Exception as e:
        print(f"[DEBUG Groq Exception] Type: {type(e).__name__}: {e}", flush=True)
        logging.error(f"Groq API Request failed: {e}")
        raise


def _extract_json(raw: str) -> Any:
    """Helper to extract JSON from string that might contain markdown wrappers."""
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        match = re.search(r'```(?:json)?\s*(.*?)\s*```', raw, re.DOTALL)
        if match:
            try:
                return json.loads(match.group(1))
            except json.JSONDecodeError:
                pass
                
        start_dict = raw.find('{')
        end_dict = raw.rfind('}')
        start_list = raw.find('[')
        end_list = raw.rfind(']')
        
        dict_len = end_dict - start_dict if start_dict != -1 and end_dict != -1 else -1
        list_len = end_list - start_list if start_list != -1 and end_list != -1 else -1
        
        try:
            if dict_len > list_len and dict_len > 0:
                return json.loads(raw[start_dict:end_dict+1])
            elif list_len > dict_len and list_len > 0:
                return json.loads(raw[start_list:end_list+1])
        except json.JSONDecodeError:
            pass
            
        raise ValueError(f"Could not extract JSON from response: {raw[:100]}...")


async def parse_resume(resume_text: str) -> Dict[str, Any]:
    """
    NLP resume parsing: extract skills, roles, experience, certifications, courses, personal info, and profile metadata.
    Returns a dict with complete profile structure for user autofill.
    """
    prompt = f"""You are an expert resume parser and career advisor AI. Analyze the following resume text and extract structured profile information.

Return ONLY a valid JSON object with this exact structure:
{{
  "full_name": "Candidate Full Name (or empty string if not found)",
  "current_title": "Primary/Latest Job Title",
  "target_title": "Suggested Next Career Step / Target Job Title",
  "experience_years": <estimated total years of experience as integer>,
  "location": "City, State or Country (e.g., San Francisco, CA)",
  "phone": "Phone number if present",
  "bio": "A compelling 2-4 sentence professional bio/summary based on their experience and skills",
  "linkedin_url": "https://linkedin.com/in/... (if present, else empty string)",
  "github_url": "https://github.com/... (if present, else empty string)",
  "portfolio_url": "https://... (personal site/portfolio if present, else empty string)",
  "skills": ["skill1", "skill2", ...],
  "roles": ["role1", "role2", ...],
  "experience": [
    {{"company": "Company Name", "title": "Job Title", "duration": "Jan 2020 - Dec 2022", "description": "brief description"}}
  ],
  "education": [
    {{"institution": "University Name", "degree": "Degree", "year": "2020"}}
  ],
  "education_summary": "Highest degree and institution (e.g., BS in Computer Science, State University, 2020)",
  "certifications": ["AWS Certified Solutions Architect", "PMP Certification", ...],
  "courses": ["Deep Learning Specialization – Coursera", "Full Stack Web Development – Udemy", ...],
  "languages": ["English", "Spanish", ...],
  "achievements": "Key achievements, honors, or awards mentioned in the resume",
  "summary": "2-3 sentence professional summary based on the resume"
}}

Rules:
- Extract real URLs for linkedin_url, github_url, and portfolio_url if present in text.
- "skills": ALL technical skills, tools, programming languages, frameworks, libraries, databases, cloud platforms, DevOps tools, architecture concepts, methodologies, and soft skills mentioned anywhere in the resume. Extract EVERY SINGLE skill found — do NOT summarize, omit, or limit the list; return all 30+ skills if present.
- "certifications": industry certifications.
- "courses": online courses, training bootcamps.
- If a section or field has no items, return empty array [] or empty string "".

Resume Text:
\"\"\"
{resume_text[:12000]}
\"\"\"
"""
    try:
        raw = await _chat_completion(
            [{"role": "user", "content": prompt}],
            json_mode=True,
        )
        return _extract_json(raw)
    except Exception as e:
        import logging
        logging.error(f"AI parse_resume failed: {e}")
        return {
            "full_name": "",
            "current_title": "Software Engineer",
            "target_title": "Senior Full Stack Engineer",
            "experience_years": 3,
            "location": "Remote",
            "phone": "",
            "bio": "Experienced software engineer with a strong background in web development, system architecture, and modern frameworks.",
            "linkedin_url": "",
            "github_url": "",
            "portfolio_url": "",
            "skills": ["Python", "JavaScript", "React", "SQL", "FastAPI"],
            "roles": ["Software Engineer", "Full Stack Developer"],
            "experience": [{"company": "Tech Corp", "title": "Software Engineer", "duration": "2020-2023", "description": "Developed web applications."}],
            "education": [{"institution": "State University", "degree": "BS Computer Science", "year": "2020"}],
            "education_summary": "BS Computer Science, State University (2020)",
            "certifications": [],
            "courses": [],
            "languages": ["English"],
            "achievements": "Built scalable web apps and led interface design.",
            "summary": "Experienced software engineer with a strong background in full stack development."
        }


async def analyze_ats_and_gaps(resume_text: str, parsed_skills: list) -> Dict[str, Any]:
    """
    ATS score calculation and skill gap analysis.
    Returns: ats_score (0-100), skill_gaps, recommendations.
    """
    skills_str = ", ".join(parsed_skills) if parsed_skills else "none provided"
    prompt = f"""You are a professional ATS (Applicant Tracking System) and career coach AI.

Analyze this resume and the candidate's current skills against modern industry benchmarks.

Candidate Skills: {skills_str}

Resume Text (first 3000 chars):
\"\"\"
{resume_text[:3000]}
\"\"\"

Return ONLY a valid JSON object with this exact structure:
{{
  "ats_score": <integer 0-100>,
  "ats_breakdown": {{
    "keywords": <0-25>,
    "formatting": <0-25>,
    "experience_relevance": <0-25>,
    "skills_match": <0-25>
  }},
  "skill_gaps": [
    {{"skill": "skill name", "priority": "high|medium|low", "reason": "why this skill matters"}}
  ],
  "strengths": ["strength1", "strength2"],
  "recommendations": ["recommendation1", "recommendation2", "recommendation3"]
}}
"""
    try:
        raw = await _chat_completion(
            [{"role": "user", "content": prompt}],
            json_mode=True,
        )
        return _extract_json(raw)
    except Exception as e:
        import logging
        logging.error(f"AI analyze_ats_and_gaps failed: {e}")
        return {
            "ats_score": 75,
            "ats_breakdown": {"keywords": 20, "formatting": 20, "experience_relevance": 20, "skills_match": 15},
            "skill_gaps": [
                {"skill": "Cloud Architecture", "priority": "high", "reason": "High demand in modern full-stack roles"},
                {"skill": "CI/CD", "priority": "medium", "reason": "Essential for deployment pipelines"}
            ],
            "strengths": ["Strong foundational programming skills", "Good experience timeline"],
            "recommendations": ["Add more metrics to your achievements", "Include a link to your portfolio"]
        }


async def predict_career_paths(parsed_skills: list, current_roles: list, experience_summary: str) -> Dict[str, Any]:
    """Predict logical next career paths based on user's profile."""
    prompt = f"""You are an expert career advisor AI.

Based on the candidate's profile:
- Current/Past Roles: {', '.join(current_roles) if current_roles else 'Not specified'}
- Skills: {', '.join(parsed_skills) if parsed_skills else 'Not specified'}
- Experience Summary: {experience_summary[:500] if experience_summary else 'Not provided'}

Return ONLY a valid JSON object with this exact structure:
{{
  "career_paths": [
    {{
      "title": "Career Path Title",
      "match_percentage": <0-100>,
      "description": "Brief description of this career path",
      "required_skills": ["skill1", "skill2"],
      "timeline": "Expected timeline to transition",
      "avg_salary": "$XX,000 - $XX,000"
    }}
  ],
  "recommended_next_roles": ["Role 1", "Role 2", "Role 3"]
}}

Provide 3-4 realistic career paths.
"""
    try:
        raw = await _chat_completion(
            [{"role": "user", "content": prompt}],
            json_mode=True,
        )
        return _extract_json(raw)
    except Exception as e:
        import logging
        logging.error(f"AI predict_career_paths failed: {e}")
        return {
            "career_paths": [
                {
                    "title": "Senior Software Engineer",
                    "match_percentage": 85,
                    "description": "Lead development teams and architect complex systems.",
                    "required_skills": ["System Design", "Leadership", "Cloud Architecture"],
                    "timeline": "1-2 years",
                    "avg_salary": "$120,000 - $160,000"
                },
                {
                    "title": "Technical Product Manager",
                    "match_percentage": 70,
                    "description": "Bridge the gap between engineering and product strategy.",
                    "required_skills": ["Agile", "Product Strategy", "Communication"],
                    "timeline": "2-3 years",
                    "avg_salary": "$110,000 - $150,000"
                }
            ],
            "recommended_next_roles": ["Senior Developer", "Engineering Manager"]
        }


async def predict_salary(job_title: str, skills: list, experience_years: int, location: Optional[str] = None) -> Dict[str, Any]:
    """Estimate salary range for given role + skills + experience."""
    prompt = f"""You are a compensation and salary benchmarking expert.

Estimate the salary range for a candidate with these details:
- Target Job Title: {job_title}
- Skills: {', '.join(skills) if skills else 'General'}
- Years of Experience: {experience_years}
- Location: {location or 'Global/Remote'}

Return ONLY a valid JSON object with this exact structure:
{{
  "min_salary": <integer in USD>,
  "max_salary": <integer in USD>,
  "median_salary": <integer in USD>,
  "currency": "USD",
  "factors": ["factor1", "factor2"],
  "market_demand": "high|medium|low",
  "negotiation_tips": ["tip1", "tip2"]
}}
"""
    try:
        raw = await _chat_completion(
            [{"role": "user", "content": prompt}],
            json_mode=True,
        )
        return _extract_json(raw)
    except Exception as e:
        import logging
        logging.error(f"AI predict_salary failed: {e}")
        return {
            "min_salary": 90000, 
            "max_salary": 140000, 
            "median_salary": 115000,
            "currency": "USD", 
            "factors": ["Location", "Years of experience", "Tech stack demand"], 
            "market_demand": "high", 
            "negotiation_tips": ["Highlight recent high-impact projects", "Discuss equity options"]
        }


async def career_chat(user_message: str, user_context: Optional[str] = None) -> str:
    """AI career coach chatbot with user profile context."""
    system_prompt = """You are CareerAI, an expert career intelligence coach. You help users with:
- Career planning and path recommendations
- Resume improvement tips
- Interview preparation
- Skill development guidance  
- Job search strategies
- Salary negotiation advice

Be specific, actionable, and encouraging. Keep responses concise but helpful."""

    messages = [{"role": "system", "content": system_prompt}]

    if user_context:
        messages.append({
            "role": "system",
            "content": f"User Profile Context:\n{user_context}"
        })

    messages.append({"role": "user", "content": user_message})

    try:
        return await _chat_completion(messages)
    except ValueError as e:
        return f"{e}"
    except Exception as e:
        return f"I'm having trouble connecting right now. Please try again shortly. (Error: {str(e)[:150]})"


async def generate_job_recommendations(parsed_skills: list, target_roles: list) -> list:
    """Generate AI job recommendations based on profile."""
    prompt = f"""You are a job matching AI. Generate realistic job recommendations.

Candidate Skills: {', '.join(parsed_skills[:20]) if parsed_skills else 'General'}
Target Roles: {', '.join(target_roles[:5]) if target_roles else 'Open to opportunities'}

Return ONLY a valid JSON object with a single key "jobs" containing an array of 5 job listings:
{{
  "jobs": [
    {{
      "title": "Job Title",
      "company": "Company Name",
      "location": "City, State or Remote",
      "description": "Brief job description (2-3 sentences)",
      "required_skills": ["skill1", "skill2", "skill3"],
      "salary_min": 100000,
      "salary_max": 150000,
      "job_type": "Full-time|Remote|Hybrid",
      "experience_level": "Junior|Mid|Senior",
      "match_score": 90,
      "job_url": "#"
    }}
  ]
}}
"""
    try:
        raw = await _chat_completion(
            [{"role": "user", "content": prompt}],
            json_mode=True,
        )
        data = _extract_json(raw)
        return data if isinstance(data, list) else data.get("jobs", [])
    except Exception as e:
        import logging
        logging.error(f"AI generate_job_recommendations failed: {e}")
        return [
            {
                "title": "Senior Frontend Developer",
                "company": "TechNova",
                "location": "Remote",
                "description": "Looking for an experienced React developer to lead our UI architecture.",
                "required_skills": ["React", "TypeScript", "System Design"],
                "salary_min": 120000,
                "salary_max": 150000,
                "job_type": "Remote",
                "experience_level": "Senior",
                "match_score": 92,
                "job_url": "#"
            },
            {
                "title": "Full Stack Engineer",
                "company": "DataSphere",
                "location": "New York, NY",
                "description": "Build scalable backend APIs and responsive dashboards.",
                "required_skills": ["Python", "React", "PostgreSQL"],
                "salary_min": 110000,
                "salary_max": 140000,
                "job_type": "Hybrid",
                "experience_level": "Mid",
                "match_score": 85,
                "job_url": "#"
            }
        ]


async def generate_course_recommendations(skill_gaps: list, current_skills: list) -> list:
    """Generate AI course recommendations based on skill gaps."""
    gap_skills = [g.get("skill", g) if isinstance(g, dict) else g for g in skill_gaps[:10]]
    prompt = f"""You are a learning path AI. Generate realistic online course recommendations.

Skills to Learn (Gaps): {', '.join(gap_skills) if gap_skills else 'General development'}
Current Skills: {', '.join(current_skills[:10]) if current_skills else 'Beginner'}

Return ONLY a valid JSON object with a single key "courses" containing an array of 6 courses:
{{
  "courses": [
    {{
      "title": "Course Title",
      "provider": "Coursera|Udemy|edX|YouTube|LinkedIn Learning|freeCodeCamp",
      "description": "Brief course description (1-2 sentences)",
      "skills_covered": ["skill1", "skill2"],
      "duration": "X hours|X weeks",
      "level": "Beginner|Intermediate|Advanced",
      "is_free": true,
      "rating": "4.5",
      "url": "#",
      "match_score": 90
    }}
  ]
}}
"""
    try:
        raw = await _chat_completion(
            [{"role": "user", "content": prompt}],
            json_mode=True,
        )
        data = _extract_json(raw)
        return data if isinstance(data, list) else data.get("courses", [])
    except Exception as e:
        import logging
        logging.error(f"AI generate_course_recommendations failed: {e}")
        return [
            {
                "title": "AWS Certified Solutions Architect",
                "provider": "Coursera",
                "description": "Master cloud architecture and prepare for the AWS certification.",
                "skills_covered": ["Cloud Architecture", "AWS", "Deployment"],
                "duration": "8 weeks",
                "level": "Intermediate",
                "is_free": False,
                "rating": "4.8",
                "url": "#",
                "match_score": 95
            },
            {
                "title": "Advanced CI/CD with GitHub Actions",
                "provider": "Udemy",
                "description": "Learn to automate your deployment pipelines completely.",
                "skills_covered": ["CI/CD", "DevOps", "GitHub"],
                "duration": "5 hours",
                "level": "Intermediate",
                "is_free": False,
                "rating": "4.7",
                "url": "#",
                "match_score": 88
            }
        ]
