import json
import re
import logging
import asyncio
import httpx
from typing import Any, Dict, Optional
from ..config import get_settings

import time
from ..database import SessionLocal
from ..models.ai_usage import AiApiUsage

settings = get_settings()


def _log_usage_to_db(provider: str, model: str, feature: str, prompt_tokens: int, completion_tokens: int, total_tokens: int, latency_ms: float, status_code: int, is_success: bool, error_message: Optional[str] = None):
    try:
        db = SessionLocal()
        record = AiApiUsage(
            provider=provider,
            model=model,
            feature=feature,
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            total_tokens=total_tokens,
            latency_ms=latency_ms,
            status_code=status_code,
            is_success=is_success,
            error_message=error_message,
        )
        db.add(record)
        db.commit()
        db.close()
    except Exception as ex:
        print(f"[AI Usage Log Error]: {ex}", flush=True)


def _get_headers() -> Dict[str, str]:
    api_key = (settings.GROQ_API_KEY or "").strip().strip('"').strip("'")
    headers = {"Content-Type": "application/json"}
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"
    return headers


FALLBACK_MODELS = [
    "openai/gpt-oss-20b",
    "qwen/qwen3.6-27b",
    "openai/gpt-oss-120b",
    "allam-2-7b",
    "groq/compound-mini",
    "groq/compound"
]


def _sync_chat_completion(url: str, headers: Dict[str, str], payload: Dict[str, Any], feature: str = "General AI") -> str:
    start_time = time.time()
    requested_model = payload.get("model", "openai/gpt-oss-20b")
    provider = "groq"

    # Build model attempt list starting with requested model
    models_to_try = [requested_model] + [m for m in FALLBACK_MODELS if m != requested_model]
    last_exception = None

    with httpx.Client(timeout=120.0, trust_env=False) as client:
        for model_candidate in models_to_try:
            current_payload = dict(payload)
            current_payload["model"] = model_candidate
            
            # Retry up to 3 times per model on 429 rate limit
            for attempt in range(3):
                try:
                    response = client.post(url, headers=headers, json=current_payload)
                    latency_ms = round((time.time() - start_time) * 1000, 2)
                    
                    if response.status_code == 429:
                        print(f"[DEBUG Groq Rate Limit 429 on {model_candidate} (Attempt {attempt+1})]: {response.text[:200]}", flush=True)
                        retry_after = 2 * (attempt + 1)
                        try:
                            resp_json = response.json()
                            msg = resp_json.get("error", {}).get("message", "")
                            match = re.search(r'try again in ([\d\.]+)s', msg)
                            if match:
                                wait_sec = float(match.group(1))
                                if wait_sec <= 4.0:
                                    time.sleep(wait_sec + 0.5)
                                    continue
                        except Exception:
                            pass
                        
                        time.sleep(retry_after)
                        if attempt == 2:
                            break
                        continue

                    # If model not found or forbidden, immediately try next model
                    if response.status_code in (404, 400):
                        print(f"[DEBUG Groq Status {response.status_code} on {model_candidate}]: {response.text[:200]} - trying next fallback model...", flush=True)
                        break

                    if response.status_code != 200:
                        print(f"[DEBUG Groq Error {response.status_code} on {model_candidate}]: {response.text}", flush=True)
                        logging.error(f"[DEBUG Groq Error {response.status_code}]: {response.text}")
                        response.raise_for_status()

                    data = response.json()
                    usage = data.get("usage", {})
                    p_tokens = usage.get("prompt_tokens", 0)
                    c_tokens = usage.get("completion_tokens", 0)
                    t_tokens = usage.get("total_tokens", p_tokens + c_tokens)
                    content = data["choices"][0]["message"]["content"]

                    if t_tokens == 0:
                        msg_str = str(current_payload.get("messages", ""))
                        p_tokens = max(10, len(msg_str) // 4)
                        c_tokens = max(10, len(content) // 4)
                        t_tokens = p_tokens + c_tokens

                    _log_usage_to_db(
                        provider=provider,
                        model=model_candidate,
                        feature=feature,
                        prompt_tokens=p_tokens,
                        completion_tokens=c_tokens,
                        total_tokens=t_tokens,
                        latency_ms=latency_ms,
                        status_code=200,
                        is_success=True,
                    )
                    return content

                except httpx.HTTPStatusError as e:
                    last_exception = e
                    if e.response.status_code in (404, 429, 400):
                        break # Switch to next candidate model
                    raise
                except Exception as e:
                    last_exception = e
                    time.sleep(1)

    latency_ms = round((time.time() - start_time) * 1000, 2)
    _log_usage_to_db(
        provider=provider,
        model=requested_model,
        feature=feature,
        prompt_tokens=0,
        completion_tokens=0,
        total_tokens=0,
        latency_ms=latency_ms,
        status_code=429 if isinstance(last_exception, httpx.HTTPStatusError) and last_exception.response.status_code == 429 else 500,
        is_success=False,
        error_message=str(last_exception)[:500] if last_exception else "All Groq model attempts failed"
    )
    if last_exception:
        raise last_exception
    raise ValueError("Groq AI service is currently unavailable on all configured models. Please check your Groq API key and try again.")


async def _chat_completion(messages: list, json_mode: bool = False, feature: str = "General AI") -> str:
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
    if json_mode:
        payload["response_format"] = {"type": "json_object"}

    url = f"{base_url}/chat/completions"

    try:
        return await asyncio.to_thread(_sync_chat_completion, url, headers, payload, feature)
    except httpx.HTTPStatusError as e:
        error_body = e.response.text if e.response is not None else str(e)
        logging.error(f"Groq API HTTP Error {e.response.status_code if e.response is not None else 'Unknown'}: {error_body}")
        raise ValueError(f"Groq API Error ({e.response.status_code if e.response is not None else 'Error'}): {error_body}") from e
    except Exception as e:
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


KNOWN_SKILLS_LIST = [
    # Programming Languages
    "Python", "Java", "C++", "C#", "C", "JavaScript", "TypeScript", "Go", "Golang", "Rust",
    "PHP", "Ruby", "Swift", "Kotlin", "Scala", "R", "MATLAB", "Perl", "Bash", "Shell", "SQL", "PL/SQL", "HTML", "HTML5", "CSS", "CSS3", "Sass", "LESS",
    # Frameworks & Libraries
    "React", "React.js", "React Native", "Angular", "Vue", "Vue.js", "Next.js", "Nuxt.js", "Svelte", "Node.js", "Express", "Express.js",
    "Django", "Flask", "FastAPI", "Spring Boot", "Spring Framework", "ASP.NET", ".NET", "Laravel", "Ruby on Rails", "Bootstrap", "Tailwind", "Tailwind CSS",
    # Databases & Caching
    "MySQL", "PostgreSQL", "MongoDB", "SQLite", "Redis", "Elasticsearch", "Cassandra", "DynamoDB", "MariaDB", "Oracle", "Microsoft SQL Server", "MS SQL", "Neo4j", "Firebase", "Supabase",
    # Cloud & DevOps
    "AWS", "Amazon Web Services", "Azure", "Microsoft Azure", "Google Cloud", "GCP", "Docker", "Kubernetes", "K8s", "Jenkins", "GitLab CI", "GitHub Actions", "Terraform", "Ansible", "Nginx", "Apache", "Linux", "Unix", "Cloudflare", "Serverless",
    # Machine Learning & AI & Data Science
    "Machine Learning", "Deep Learning", "Artificial Intelligence", "AI", "NLP", "Natural Language Processing", "Computer Vision", "PyTorch", "TensorFlow", "Keras", "Scikit-Learn", "OpenCV", "Pandas", "NumPy", "SciPy", "Matplotlib", "Seaborn", "Hugging Face", "LLM", "Generative AI", "LangChain", "LlamaIndex", "Spacy", "NLTK", "Data Analysis", "Data Mining", "PowerBI", "Tableau", "Apache Spark", "Hadoop", "Data Engineering",
    # Tools, Methodologies & Soft Skills
    "REST API", "RESTful APIs", "GraphQL", "gRPC", "Microservices", "System Design", "Object-Oriented Programming", "OOP", "Data Structures", "Algorithms", "Agile", "Scrum", "Kanban", "JIRA", "Confluence", "Git", "GitHub", "GitLab", "Bitbucket", "CI/CD", "Unit Testing", "Jest", "PyTest", "Selenium", "Cypress", "Postman", "Swagger", "Figma", "UI/UX", "Project Management", "Product Management", "Leadership", "Communication", "Problem Solving", "Teamwork"
]


def _python_rule_based_resume_parser(resume_text: str) -> Dict[str, Any]:
    """
    Exhaustive NLP & Regex fallback parser that extracts actual candidate profile data directly from resume text.
    Used when AI API is unavailable or rate-limited.
    """
    text = resume_text or ""
    text_lower = text.lower()

    # 1. Extract ALL matching skills from database
    detected_skills = []
    seen_skills = set()
    for skill in KNOWN_SKILLS_LIST:
        pattern = r'(?<![a-zA-Z0-9#+])' + re.escape(skill.lower()) + r'(?![a-zA-Z0-9#+])'
        if re.search(pattern, text_lower):
            key = skill.lower()
            if key not in seen_skills:
                seen_skills.add(key)
                detected_skills.append(skill)

    # 2. Extract Contact Info & URLs
    email_match = re.search(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', text)
    phone_match = re.search(r'(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}', text)
    linkedin_match = re.search(r'https?://(www\.)?linkedin\.com/in/[a-zA-Z0-9\-_%]+/?', text)
    github_match = re.search(r'https?://(www\.)?github\.com/[a-zA-Z0-9\-._]+/?', text)
    portfolio_match = re.search(r'https?://[a-zA-Z0-9\-_.]+\.[a-zA-Z]{2,}(/[a-zA-Z0-9\-_.]*)?', text)

    email = email_match.group(0) if email_match else ""
    phone = phone_match.group(0) if phone_match else ""
    linkedin_url = linkedin_match.group(0) if linkedin_match else ""
    github_url = github_match.group(0) if github_match else ""
    portfolio_url = portfolio_match.group(0) if (portfolio_match and not linkedin_match and not github_match) else ""

    # 3. Extract Professional Summary / Bio directly from resume text
    summary = ""
    summary_match = re.search(r'(?:summary|profile|about me|professional summary|executive summary|career objective)[\s:]*\n+(.*?)(?=\n\s*\n|\n[A-Z\s]{4,}:|\Z)', text, re.IGNORECASE | re.DOTALL)
    if summary_match:
        summary = summary_match.group(1).strip()
        summary = re.sub(r'\s+', ' ', summary)

    if not summary or len(summary) < 20:
        lines = [line.strip() for line in text.split('\n') if line.strip() and '@' not in line and 'http' not in line]
        if len(lines) > 1:
            summary = " ".join(lines[1:5])[:350]

    # 4. Extract Job Titles / Roles
    roles = []
    role_matches = re.findall(r'\b(software engineer|full stack engineer|full stack developer|frontend developer|backend developer|data scientist|machine learning engineer|data analyst|devops engineer|cloud architect|product manager|project manager|ui/ux designer|qa engineer|systems engineer|intern)\b', text_lower, re.IGNORECASE)
    if role_matches:
        roles = list(dict.fromkeys([r.title() for r in role_matches]))

    current_title = roles[0] if roles else ("Software Engineer" if detected_skills else "Candidate Profile")

    # 5. Extract Education Summary
    education_summary = ""
    edu_match = re.search(r'(?:education|academic background|qualifications)[\s:]*\n+(.*?)(?=\n\s*\n|\n[A-Z\s]{4,}:|\Z)', text, re.IGNORECASE | re.DOTALL)
    if edu_match:
        education_summary = re.sub(r'\s+', ' ', edu_match.group(1).strip())[:250]

    return {
        "full_name": "",
        "current_title": current_title,
        "target_title": f"Senior {current_title}" if "Senior" not in current_title else current_title,
        "experience_years": 2 if "intern" in current_title.lower() else 4,
        "location": "",
        "phone": phone,
        "email": email,
        "bio": summary or f"Experienced {current_title} proficient in {', '.join(detected_skills[:6]) if detected_skills else 'software development'}.",
        "linkedin_url": linkedin_url,
        "github_url": github_url,
        "portfolio_url": portfolio_url,
        "skills": detected_skills,
        "roles": roles,
        "experience": [],
        "education": [],
        "education_summary": education_summary,
        "certifications": [],
        "courses": [],
        "languages": ["English"],
        "achievements": "",
        "summary": summary or f"Experienced {current_title} proficient in {', '.join(detected_skills[:6]) if detected_skills else 'software development'}."
    }


async def ping_ai_service() -> bool:
    """Fast, lightweight health check ping (1-2 tokens) to test if Groq LLM is currently responsive."""
    try:
        raw = await _chat_completion(
            [{"role": "user", "content": "1"}],
            feature="AI Health Ping"
        )
        return bool(raw and len(raw.strip()) > 0)
    except Exception as e:
        logging.warning(f"AI Health Ping failed: {e}")
        raise ValueError(f"AI Service is currently unavailable or rate limited. Please try again in a few moments. ({str(e)})")


async def parse_resume(resume_text: str) -> Dict[str, Any]:
    """
    NLP resume parsing: extract skills, roles, experience, certifications, courses, personal info, and profile metadata.
    Extracts ALL candidate skills without truncation.
    """
    # Clean text
    cleaned_text = re.sub(r'[ \t]+', ' ', resume_text.strip())
    cleaned_text = re.sub(r'\n{3,}', '\n\n', cleaned_text)[:7000]

    # Pre-extract skills using dictionary scanner to ensure zero missed skills
    lower_text = " " + resume_text.lower() + " "
    scanned_skills = []
    seen_scan = set()
    for sk in KNOWN_SKILLS_LIST:
        pattern = r'(?<![a-zA-Z0-9#+])' + re.escape(sk.lower()) + r'(?![a-zA-Z0-9#+])'
        if re.search(pattern, lower_text):
            if sk.lower() not in seen_scan:
                seen_scan.add(sk.lower())
                scanned_skills.append(sk)

    prompt = f"""You are an elite, highly thorough ATS resume parser.
First, verify whether this document is a genuine candidate resume. If not (e.g. essay, receipt, invoice, transcript/marksheet, code snippet, article), set "is_valid_resume": false.

CRITICAL SKILLS INSTRUCTION:
- Extract EVERY SINGLE technical and professional skill mentioned in the resume (aim for ALL 20-40+ distinct skills: languages, frameworks, libraries, tools, databases, cloud, devops, methodologies). DO NOT truncate or summarize skills.

Required Output Schema (JSON):
{{
  "is_valid_resume": true,
  "full_name": "Full Name",
  "current_title": "Primary Title",
  "target_title": "Target Role",
  "experience_years": 3,
  "location": "City, Country",
  "phone": "Phone",
  "email": "Email",
  "bio": "2-sentence professional bio",
  "summary": "2-sentence executive summary",
  "linkedin_url": "",
  "github_url": "",
  "portfolio_url": "",
  "skills": ["Skill1", "Skill2", "Skill3", "Skill4", "Skill5", "Skill6", "Skill7", "Skill8"],
  "roles": ["Role1", "Role2"],
  "experience": [
    {{"role": "Title", "company": "Company", "duration": "2021-2023", "description": "Key impact and responsibilities"}}
  ],
  "education": [
    {{"degree": "Degree Major", "institution": "University", "year": "2021", "gpa_or_grade": ""}}
  ],
  "education_summary": "Degree, Institution, Year",
  "certifications": [
    {{"name": "Cert Title", "issuer": "Issuer", "year": "2022"}}
  ],
  "courses": [
    {{"title": "Course Title", "platform": "Coursera/Udemy", "skills_covered": ["Skill"]}}
  ],
  "projects": [
    {{"name": "Project Title", "description": "Overview and impact", "technologies": ["Tech1", "Tech2"], "link": ""}}
  ]
}}

Resume:
\"\"\"
{cleaned_text}
\"\"\"
"""
    try:
        raw = await _chat_completion(
            [{"role": "user", "content": prompt}],
            json_mode=True,
            feature="Resume Parser"
        )
        parsed = _extract_json(raw)
        if isinstance(parsed, dict) and parsed.get("is_valid_resume") is False:
            raise ValueError("The uploaded document was analyzed and determined not to be a valid candidate resume.")
        
        # Merge LLM-extracted skills with dictionary-scanned skills for complete coverage
        llm_skills = parsed.get("skills", []) if isinstance(parsed.get("skills"), list) else []
        combined_skills = []
        seen = set()
        for s in llm_skills + scanned_skills:
            clean_s = str(s).strip()
            if clean_s and clean_s.lower() not in seen:
                seen.add(clean_s.lower())
                combined_skills.append(clean_s)
        
        parsed["skills"] = combined_skills
        return parsed
    except Exception as e:
        logging.error(f"AI parse_resume failed: {e}")
        raise ValueError(f"AI resume parser error: {str(e)}")


async def analyze_ats_and_gaps(resume_text: str, parsed_skills: list) -> Dict[str, Any]:
    """
    ATS score calculation and skill gap analysis.
    Considers full skill set for thorough ATS evaluation.
    """
    skills_str = ", ".join(parsed_skills) if parsed_skills else "none provided"
    cleaned_excerpt = re.sub(r'\s+', ' ', resume_text[:3000]).strip()
    
    prompt = f"""You are a professional ATS and career coach AI.
Analyze candidate resume excerpt and skills against industry benchmarks.

Candidate Skills ({len(parsed_skills)}): {skills_str}
Resume Excerpt: {cleaned_excerpt}

Return ONLY valid JSON:
{{
  "ats_score": 85,
  "ats_breakdown": {{"keywords": 22, "formatting": 20, "experience_relevance": 22, "skills_match": 21}},
  "skill_gaps": [{{"skill": "Skill name", "priority": "high|medium|low", "reason": "why needed"}}],
  "strengths": ["Strength 1", "Strength 2"],
  "recommendations": ["Recommendation 1", "Recommendation 2"]
}}
"""
    try:
        raw = await _chat_completion(
            [{"role": "user", "content": prompt}],
            json_mode=True,
            feature="ATS & Gap Analysis"
        )
        return _extract_json(raw)
    except Exception as e:
        logging.error(f"AI analyze_ats_and_gaps failed: {e}")
        raise ValueError(f"AI service is currently unavailable for ATS and Skill Gap analysis. ({str(e)})")


async def predict_career_paths(parsed_skills: list, current_roles: list, experience_summary: str) -> Dict[str, Any]:
    """Predict logical next career paths based on candidate's complete profile."""
    roles_str = ', '.join(current_roles[:5]) if current_roles else 'Software Professional'
    skills_str = ', '.join(parsed_skills) if parsed_skills else 'General technical background'
    
    prompt = f"""You are an expert career advisor AI.
Candidate:
- Roles: {roles_str}
- All Candidate Skills: {skills_str}
- Summary: {experience_summary[:350] if experience_summary else 'Technical background'}

Predict top 3 next career progression paths.
Return ONLY valid JSON:
{{
  "career_paths": [
    {{
      "title": "Target Title",
      "match_percentage": 88,
      "description": "2-sentence fit description",
      "required_skills": ["skill1", "skill2"],
      "timeline": "6-12 months",
      "avg_salary": "$110k - $140k"
    }}
  ],
  "recommended_next_roles": ["Role 1", "Role 2", "Role 3"]
}}
"""
    try:
        raw = await _chat_completion(
            [{"role": "user", "content": prompt}],
            json_mode=True,
            feature="Career Path Prediction"
        )
        return _extract_json(raw)
    except Exception as e:
        logging.error(f"AI predict_career_paths failed: {e}")
        raise ValueError(f"AI service is currently unavailable for career path predictions. ({str(e)})")


async def predict_salary(job_title: str, skills: list, experience_years: int, location: Optional[str] = None) -> Dict[str, Any]:
    """Estimate salary range for given role + all candidate skills + experience."""
    prompt = f"""Estimate salary benchmark for:
- Role: {job_title}
- Skills: {', '.join(skills) if skills else 'General'}
- Years: {experience_years}
- Location: {location or 'Remote / Open'}

Return ONLY valid JSON:
{{
  "min_salary": 95000,
  "max_salary": 145000,
  "median_salary": 120000,
  "currency": "USD",
  "factors": ["Experience level", "Skill specialization"],
  "market_demand": "high",
  "negotiation_tips": ["Highlight recent achievements", "Reference industry benchmarks"]
}}
"""
    try:
        raw = await _chat_completion(
            [{"role": "user", "content": prompt}],
            json_mode=True,
            feature="Salary Predictor"
        )
        return _extract_json(raw)
    except Exception as e:
        logging.error(f"AI predict_salary failed: {e}")
        raise ValueError(f"AI service is currently unavailable for salary benchmarking. ({str(e)})")


async def career_chat(user_message: str, user_context: Optional[str] = None) -> str:
    """AI career coach chatbot with user profile context."""
    system_prompt = """You are CareerAI, a specialized executive career intelligence coach.

STRICT DOMAIN SCOPE RESTRICTION:
- You are strictly prohibited from answering queries unrelated to career guidance, professional development, resume optimization, job search, interview prep, workplace skills, education/certifications, or salary negotiation.
- IF THE USER'S QUERY IS UNRELATED TO CAREERS, RESUMES, JOBS, SKILLS, OR PROFESSIONAL GUIDANCE (e.g. general trivia, cooking/recipes, sports, entertainment, movies, gaming, non-career coding, casual chit-chat, or general science/history):
  You MUST REJECT the request with a professional denial message structured exactly as follows:

### 🛡️ Out of Scope Query
I am your dedicated **CareerAI Advisor**, specialized exclusively in career guidance, resume ATS optimization, interview coaching, skill gap analysis, and job search strategy.

I cannot assist with questions unrelated to professional development and career advancement. Please feel free to ask any question regarding:
- 📄 Resume & Cover Letter Optimization
- 💼 Job Search Strategies & Target Roles
- 🎯 Interview Preparation & STAR Method Answers
- 🚀 Skill Gap Analysis & Recommended Certifications
- 📈 Career Transitions & Salary Negotiation

RESPONSE FORMATTING RULES FOR CAREER QUERIES:
- ALWAYS format career guidance into clean, highly structured, point-wise markdown.
- Use clear markdown subheadings (e.g. ### 🎯 Action Plan, ### 💡 Key Recommendations, ### 🛠️ Recommended Skills, ### 📌 Next Steps).
- ALWAYS use bullet points (•) or numbered lists (1, 2, 3) for all tips, recommendations, and step-by-step advice.
- Use **bold text** for important skills, tools, key concepts, and action verbs.
- Keep paragraphs short (1-2 sentences max). Make responses structured, scannable, and easy to read."""

    messages = [{"role": "system", "content": system_prompt}]

    if user_context:
        messages.append({
            "role": "system",
            "content": f"User Profile Context:\n{user_context}"
        })

    messages.append({"role": "user", "content": user_message})

    try:
        return await _chat_completion(messages, feature="Career Chatbot")
    except ValueError as e:
        raise ValueError(f"AI service unavailable: {e}")
    except Exception as e:
        logging.error(f"AI career_chat failed: {e}")
        raise ValueError(f"AI service is currently unavailable. Please try again shortly. ({str(e)})")


def _build_job_url(title: str, company: str) -> str:
    query = re.sub(r'\s+', '+', f"{title} {company}".strip())
    return f"https://www.linkedin.com/jobs/search/?keywords={query}"


def _build_course_url(title: str, provider: str) -> str:
    prov = (provider or "").lower()
    query = re.sub(r'\s+', '+', title.strip())
    if "coursera" in prov:
        return f"https://www.coursera.org/search?query={query}"
    elif "udemy" in prov:
        return f"https://www.udemy.com/courses/search/?q={query}"
    elif "youtube" in prov:
        return f"https://www.youtube.com/results?search_query={query}+full+course"
    elif "edx" in prov:
        return f"https://www.edx.org/search?q={query}"
    elif "freecodecamp" in prov:
        return f"https://www.freecodecamp.org/news/search/?query={query}"
    elif "linkedin" in prov:
        return f"https://www.linkedin.com/learning/search?keywords={query}"
    else:
        return f"https://www.google.com/search?q={query}+online+course+{re.sub(r'\s+', '+', provider)}"


async def generate_job_recommendations(
    parsed_skills: list,
    target_roles: list,
    current_title: str = "",
    target_title: str = "",
    location: str = "",
) -> list:
    """Generate AI job recommendations based on candidate's profile with real application links."""
    skills_str = ", ".join(parsed_skills[:20]) if parsed_skills else "General software development"
    roles_str = ", ".join(target_roles[:5]) if target_roles else (target_title or current_title or "Open to opportunities")
    
    prompt = f"""You are an elite AI job matching engine. Generate 6 realistic job recommendations for a job seeker.

Candidate Profile:
- Skills: {skills_str}
- Current/Target Roles: {roles_str}
- Preferred Location: {location or 'Remote / Open'}

Return ONLY a valid JSON object with a single key "jobs" containing an array of 6 job listings:
{{
  "jobs": [
    {{
      "title": "Exact Job Title",
      "company": "Real or Top Company Name (e.g. Google, Amazon, Stripe, Microsoft, Databricks, Spotify, Accenture, Startup)",
      "location": "City, State or Remote",
      "description": "2-3 sentence engaging job description outlining key responsibilities and impact.",
      "required_skills": ["skill1", "skill2", "skill3", "skill4"],
      "salary_min": 90000,
      "salary_max": 140000,
      "job_type": "Full-time|Remote|Hybrid",
      "experience_level": "Junior|Mid|Senior|Lead",
      "match_score": 92,
      "job_url": "https://www.linkedin.com/jobs/search/?keywords=Job+Title+Company"
    }}
  ]
}}

Rules:
- Make job titles highly relevant to candidate's actual skills ({skills_str}) and target roles ({roles_str}).
- Provide a valid, clickable search URL for job_url pointing to LinkedIn Jobs or Indeed for that job title and company.
"""
    try:
        raw = await _chat_completion(
            [{"role": "user", "content": prompt}],
            json_mode=True,
            feature="Job Recommender"
        )
        data = _extract_json(raw)
        jobs = data if isinstance(data, list) else data.get("jobs", [])
        for j in jobs:
            if not j.get("job_url") or j.get("job_url") == "#" or not j.get("job_url").startswith("http"):
                j["job_url"] = _build_job_url(j.get("title", "Software"), j.get("company", ""))
        return jobs
    except Exception as e:
        logging.error(f"AI generate_job_recommendations failed: {e}")
        raise ValueError(f"AI service is currently unavailable for generating job recommendations. ({str(e)})")


async def generate_course_recommendations(
    skill_gaps: list,
    current_skills: list,
    target_role: str = "",
) -> list:
    """Generate AI course recommendations based on skill gaps with working provider URLs."""
    gap_skills = [g.get("skill", g) if isinstance(g, dict) else str(g) for g in skill_gaps[:10]]
    gap_str = ", ".join(gap_skills) if gap_skills else "Modern Cloud Architecture, CI/CD, System Design"
    current_str = ", ".join(current_skills[:10]) if current_skills else "Core programming"

    prompt = f"""You are an expert learning paths AI. Generate 6 high-quality online course recommendations to bridge the candidate's skill gaps.

Target Skill Gaps to Close: {gap_str}
Current Skills: {current_str}
Target Role: {target_role or 'Career Advancement'}

Return ONLY a valid JSON object with a single key "courses" containing an array of 6 course listings:
{{
  "courses": [
    {{
      "title": "Complete Course Title",
      "provider": "Coursera|Udemy|edX|YouTube|freeCodeCamp|LinkedIn Learning",
      "description": "1-2 sentence description explaining how this course bridges identified skill gaps.",
      "skills_covered": ["skill1", "skill2"],
      "duration": "4 weeks|12 hours|8 weeks",
      "level": "Beginner|Intermediate|Advanced",
      "is_free": true,
      "rating": "4.8",
      "url": "https://www.coursera.org/search?query=Course+Title",
      "match_score": 95
    }}
  ]
}}

Rules:
- Courses MUST directly address the missing skill gaps ({gap_str}).
- Provide real, working search URLs for the `url` field based on the provider.
"""
    try:
        raw = await _chat_completion(
            [{"role": "user", "content": prompt}],
            json_mode=True,
            feature="Course Recommender"
        )
        data = _extract_json(raw)
        courses = data if isinstance(data, list) else data.get("courses", [])
        for c in courses:
            if not c.get("url") or c.get("url") == "#" or not c.get("url").startswith("http"):
                c["url"] = _build_course_url(c.get("title", "Course"), c.get("provider", "Coursera"))
        return courses
    except Exception as e:
        logging.error(f"AI generate_course_recommendations failed: {e}")
        raise ValueError(f"AI service is currently unavailable for generating course recommendations. ({str(e)})")


async def compare_resume_with_jd(
    resume_text: str,
    parsed_skills: list,
    job_description: str,
    job_title: str = ""
) -> Dict[str, Any]:
    """
    Module 1 & 2: Compare Resume vs Job Description.
    Calculates exact ATS compatibility score, matching skills, missing skills, and improvement recommendations.
    """
    skills_str = ", ".join(parsed_skills) if parsed_skills else "Not specified"
    prompt = f"""You are an advanced ATS Matcher & Skill Gap Analyzer AI.
Compare the candidate's resume against the provided Job Description.

Resume Skills Detected: {skills_str}

Resume Text (excerpt):
\"\"\"
{resume_text[:4000]}
\"\"\"

Target Job Description:
\"\"\"
{job_description[:4000]}
\"\"\"

Return ONLY a valid JSON object with this exact structure:
{{
  "match_score": 85,
  "ats_breakdown": {{
    "keyword_matching": 22,
    "skills_alignment": 20,
    "experience_relevance": 23,
    "education_and_formatting": 20
  }},
  "extracted_jd_skills": ["skill1", "skill2", "skill3"],
  "matching_skills": ["skill1", "skill2"],
  "missing_skills": ["skill3", "skill4"],
  "skill_gap_analysis": [
    {{"skill": "missing skill name", "importance": "critical|recommended|optional", "reason": "why this skill is needed for this job"}}
  ],
  "strengths": ["strength1", "strength2"],
  "resume_improvements": [
    "Specific actionable recommendation to tailor resume to this job description"
  ]
}}
"""
    try:
        raw = await _chat_completion(
            [{"role": "user", "content": prompt}],
            json_mode=True,
            feature="Resume vs JD Matcher"
        )
        return _extract_json(raw)
    except Exception as e:
        logging.error(f"AI compare_resume_with_jd failed: {e}")
        raise ValueError(f"AI service is currently unavailable for resume vs job description comparison. ({str(e)})")


async def generate_resume_improvements(resume_text: str, target_role: str = "") -> Dict[str, Any]:
    """
    Module 6: Resume Improvement Suggestions AI.
    Generates improved summary, missing keywords, improved project descriptions, and recommended certifications.
    """
    prompt = f"""You are a top resume coach and ATS optimization specialist.
Analyze this resume and generate comprehensive improvement suggestions.

Target Role: {target_role or 'Software Professional'}

Resume Text:
\"\"\"
{resume_text[:4000]}
\"\"\"

Return ONLY a valid JSON object with this exact structure:
{{
  "improved_summaries": [
    {{"style": "Executive / Leadership", "text": "Enhanced 3-sentence summary..."}},
    {{"style": "Impact & Technical", "text": "Enhanced 3-sentence technical summary..."}}
  ],
  "missing_keywords": ["keyword1", "keyword2", "keyword3", "keyword4"],
  "project_improvements": [
    {{
      "original_concept": "Describe a project or responsibility found in resume",
      "improved_bullet": "Action-oriented bullet point with strong action verb and metric impact (e.g., 'Architected RESTful APIs resulting in 35% faster response times...')"
    }}
  ],
  "recommended_certifications": [
    {{"name": "Certification Name", "provider": "AWS|Google|Microsoft|PMI|Scrum", "impact": "High ATS value for your profile"}}
  ],
  "general_tips": ["Tip 1", "Tip 2", "Tip 3"]
}}
"""
    try:
        raw = await _chat_completion(
            [{"role": "user", "content": prompt}],
            json_mode=True,
            feature="Resume Improvements"
        )
        return _extract_json(raw)
    except Exception as e:
        logging.error(f"AI generate_resume_improvements failed: {e}")
        raise ValueError(f"AI service is currently unavailable for generating resume improvements. ({str(e)})")


async def generate_learning_path(skill_gaps: list, target_role: str = "") -> Dict[str, Any]:
    """
    Module 5: Generate a structured step-by-step learning path / roadmap.
    """
    gap_skills = [g.get("skill", g) if isinstance(g, dict) else str(g) for g in skill_gaps[:8]]
    gap_str = ", ".join(gap_skills) if gap_skills else "System Design, Cloud Computing, DevOps"

    prompt = f"""You are a master career path and curriculum architect AI.
Design a step-by-step learning path to master missing skill gaps for a candidate.

Target Missing Skills: {gap_str}
Target Role: {target_role or 'Senior Engineering Role'}

Return ONLY a valid JSON object with this exact structure:
{{
  "roadmap_title": "Learning Roadmap: {target_role or 'Career Advancement'}",
  "estimated_total_time": "3-6 months",
  "phases": [
    {{
      "phase_number": 1,
      "phase_name": "Phase 1: Foundations",
      "duration": "2-4 weeks",
      "focus_skills": ["skill1"],
      "objectives": "Key learning objectives for this phase",
      "action_items": ["Action 1", "Action 2"],
      "recommended_resource": "Coursera or freeCodeCamp course"
    }},
    {{
      "phase_number": 2,
      "phase_name": "Phase 2: Core Mastery",
      "duration": "4-6 weeks",
      "focus_skills": ["skill2", "skill3"],
      "objectives": "Key learning objectives",
      "action_items": ["Build project X", "Practice scenario Y"],
      "recommended_resource": "Udemy or YouTube specialization"
    }},
    {{
      "phase_number": 3,
      "phase_name": "Phase 3: Portfolio & Production",
      "duration": "4 weeks",
      "focus_skills": ["skill4"],
      "objectives": "Apply skills to real-world deployment",
      "action_items": ["Deploy project to cloud", "Set up CI/CD pipeline"],
      "recommended_resource": "GitHub open source or certification"
    }}
  ]
}}
"""
    try:
        raw = await _chat_completion(
            [{"role": "user", "content": prompt}],
            json_mode=True,
            feature="Learning Path Generator"
        )
        return _extract_json(raw)
    except Exception as e:
        logging.error(f"AI generate_learning_path failed: {e}")
        raise ValueError(f"AI service is currently unavailable for generating learning paths. ({str(e)})")


async def generate_interview_questions(
    skills: list = None,
    roles: list = None,
    resume_text: str = "",
    target_role: str = "",
    job_description: str = "",
) -> Dict[str, Any]:
    """
    Generate tailored interview preparation questions categorized into:
    Technical, Behavioral, and General questions based on resume, role, and JD.
    """
    skills_str = ", ".join(skills) if skills else "General Software Development"
    roles_str = ", ".join(roles) if roles else (target_role or "Software Professional")

    prompt = f"""You are an expert AI Technical Recruiter and Hiring Manager.
Generate a tailored, high-quality set of interview questions categorized into TECHNICAL, BEHAVIORAL, and GENERAL, each complete with a comprehensive, professional sample answer.

Target Role: {target_role or roles_str}
Candidate Skills: {skills_str}
Job Description Context: {job_description[:2000] if job_description else "None provided"}
Resume Snippet: {resume_text[:2000] if resume_text else "None provided"}

Return ONLY a valid JSON object with this exact structure:
{{
  "job_role": "{target_role or roles_str}",
  "total_questions": 9,
  "questions": [
    {{
      "id": 1,
      "category": "technical",
      "question": "Can you explain how you would architect a scalable web service using your experience in Python and PostgreSQL?",
      "difficulty": "Hard",
      "sample_answer": "To architect a scalable web service in Python and PostgreSQL, I structure the backend as stateless microservices behind a load balancer like NGINX or AWS ALB. For database scalability, I implement connection pooling with SQLAlchemy/pgBouncer, use indexed foreign keys for fast queries, and introduce a Redis caching layer for high-frequency read queries. Asynchronous processes (like emails or background calculations) are offloaded to Celery task queues.",
      "answer_hint": "Focus on horizontal scaling, caching strategies with Redis, database indexing, and RESTful API statelessness.",
      "key_points": ["Stateless Microservices", "Redis Caching", "DB Connection Pooling", "Async Celery Workers"],
      "star_approach": null
    }},
    {{
      "id": 2,
      "category": "behavioral",
      "question": "Describe a time when a critical bug occurred in production. How did you diagnose and resolve it under pressure?",
      "difficulty": "Medium",
      "sample_answer": "In a previous release, a null pointer error occurred in our payment webhook handling. I immediately checked our centralized error monitoring (Sentry) and server logs to isolate the failing payload. I communicated with the product team to inform them of the issue, rolled back to the previous stable release, and wrote a hotfix with comprehensive unit test coverage before re-deploying within 20 minutes.",
      "answer_hint": "Use the STAR method: Situation (bug in prod), Task (restore uptime & identify root cause), Action (roll back / fix patch), Result (restored in 20 mins, added unit test).",
      "key_points": ["Root cause analysis", "Stakeholder communication", "Preventive testing"],
      "star_approach": "Situation: Production webhook crash; Task: Restore API health; Action: Isolated logs, rolled back, wrote hotfix + unit tests; Result: Full recovery in 20 minutes."
    }},
    {{
      "id": 3,
      "category": "general",
      "question": "What draws you to this target role and what key strengths will you bring to our team?",
      "difficulty": "Easy",
      "sample_answer": "I am deeply drawn to this role because it combines my passion for building scalable web systems with solving complex user problems. My key strengths include strong proficiency in modern web frameworks, analytical problem-solving, and a track record of collaborating across engineering and product teams to deliver robust features on schedule.",
      "answer_hint": "Align your personal career goals with the team's mission and highlight 2 top core competencies.",
      "key_points": ["Career alignment", "Technical strength", "Cross-functional collaboration"],
      "star_approach": null
    }}
  ]
}}

Generate 3 TECHNICAL questions, 3 BEHAVIORAL questions, and 3 GENERAL questions (total 9 questions). Provide full, detailed, professional sample_answer text for every single question!
"""
    try:
        raw = await _chat_completion(
            [{"role": "user", "content": prompt}],
            json_mode=True,
            feature="Interview Prep Generator"
        )
        return _extract_json(raw)
    except Exception as e:
        logging.error(f"AI generate_interview_questions failed: {e}")
        raise ValueError(f"AI service is currently unavailable for generating interview questions. ({str(e)})")


