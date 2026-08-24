import re
import json
import asyncio
import logging
import uuid
from datetime import datetime, timezone
from pathlib import Path
from sqlalchemy.orm import Session
from ..models.user import User, Profile
from ..models.resume import Resume
from ..utils.file_utils import extract_text
from . import ai_service

logger = logging.getLogger(__name__)

UPLOAD_DIR = Path(__file__).resolve().parent.parent.parent / "uploads" / "resumes"

RESUME_KEYWORDS = [
    # Core Resume Sections
    "experience", "work experience", "employment history", "professional experience",
    "education", "academic background", "qualifications", "skills", "technical skills",
    "core competencies", "projects", "key projects", "summary", "professional summary",
    "executive summary", "career objective", "certifications", "licenses", "achievements",
    "accomplishments", "publications", "languages", "volunteering", "contact",
    "curriculum vitae", "resume", "cv", "references", "extracurricular", "coursework",
    # Professional & Education Indicators
    "bachelor", "master", "degree", "b.tech", "m.tech", "b.s.", "m.s.", "phd", "diploma",
    "university", "college", "school", "gpa", "cgpa", "percentage",
    "developer", "engineer", "manager", "analyst", "consultant", "specialist",
    "designer", "intern", "internship", "lead", "architect", "administrator",
    "responsibilities", "technologies", "tools", "frameworks", "platforms",
]

ANTI_PATTERN_KEYWORDS = [
    # Recipes
    "ingredients", "tablespoon", "teaspoon", "preheat oven", "baking powder", "recipe",
    # Financial Invoices / Receipts
    "invoice #", "subtotal", "tax rate", "amount due", "balance due", "bill to:",
    # Source Code / Configs (without resume context)
    "dockerfile", "npm install", "git clone", "sudo apt-get",
    # Legal / General Non-Resume Contracts
    "indemnify", "party of the first part", "hereby agreed", "terms and conditions apply",
]


MARKSHEET_ANTI_PATTERNS = [
    "marksheet", "mark sheet", "marks sheet", "grade sheet", "transcript",
    "statement of marks", "grade card", "memorandum of marks", "memo of marks",
    "controller of examinations", "registrar", "hall ticket", "roll no", "roll number",
    "registration no", "registration number", "enrollment no", "enrollment number",
    "seat no", "seat number", "total marks", "marks obtained", "maximum marks",
    "credits earned", "credits registered", "sgpa", "cgpa", "provisional certificate",
    "passing certificate", "grade point", "sub code", "course code", "subject code",
    "semester i", "semester ii", "semester iii", "semester iv", "semester v", "semester vi",
    "semester vii", "semester viii", "sem 1", "sem 2", "sem 3", "sem 4", "sem 5", "sem 6",
    "tabulation sheet", "consolidated grade card", "academic transcript"
]

CAREER_SECTIONS_KEYWORDS = [
    "experience", "work experience", "employment history", "professional experience",
    "projects", "key projects", "technical skills", "skills", "core competencies",
    "career summary", "professional summary", "executive summary", "responsibilities",
    "work history", "internship", "intern", "developer", "engineer", "analyst",
    "education", "technologies", "tools", "background", "summary", "profile",
    "achievements", "certifications", "coursework", "about", "training", "activities", "work"
]


def validate_is_resume(text: str, filename: str = "") -> tuple[bool, str]:
    """
    Validates whether the extracted text represents a genuine candidate resume.
    Returns (is_valid: bool, reason: str).
    """
    if not text or len(text.strip()) == 0:
        return False, "Unable to extract readable text from this document. If your file is a scanned image or image-only PDF, please export it as a text PDF or Word (.docx) document."

    if text.startswith("[PDF extraction error:") or text.startswith("[DOCX extraction error:"):
        return False, "Could not read text from this file. Please ensure the document is not password protected or corrupted."

    text_lower = text.lower()
    fname_lower = (filename or "").lower()

    # 1. Reject very short documents (less than 80 words)
    words = [w for w in text.split() if len(w) > 1]
    if len(words) < 50:
        return False, "Uploaded file contains too little text to be a valid resume. Please upload a complete resume document."

    # 2. Check for Marksheet / Academic Transcript filename or content anti-patterns
    marksheet_matches = [kw for kw in MARKSHEET_ANTI_PATTERNS if kw in text_lower or kw in fname_lower]
    marksheet_score = len(set(marksheet_matches))
    career_matches = [kw for kw in CAREER_SECTIONS_KEYWORDS if kw in text_lower]
    career_score = len(set(career_matches))

    if marksheet_score >= 3 and (career_score <= 2 or marksheet_score > career_score):
        return False, "Uploaded file appears to be an academic mark sheet, grade card, or transcript, not a professional resume."

    if any(fname_kw in fname_lower for fname_kw in ["marksheet", "mark_sheet", "transcript", "grade_card", "hallticket", "certificate"]):
        if career_score <= 2:
            return False, "Uploaded file appears to be an academic certificate, transcript, or grade card, not a candidate resume."

    # 3. Check for non-resume document anti-patterns (recipes, invoices, receipts, source code, research papers, legal contracts)
    anti_matches = [kw for kw in ANTI_PATTERN_KEYWORDS if kw in text_lower]
    anti_score = len(set(anti_matches))

    if anti_score >= 2:
        return False, "Uploaded file appears to be a non-resume document (invoice, recipe, receipt, code file, or contract)."

    # 4. Check for typical Resume structural indicators:
    # Must have at least 2 distinct resume core signals:
    # - Section headings: experience / education / skills / projects / summary
    # - Contact indicators: email / phone / linkedin / github
    # - Professional skills from skill list
    has_contact = bool(
        re.search(r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+', text) or
        re.search(r'(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}', text) or
        "linkedin" in text_lower or "github" in text_lower or "contact" in text_lower
    )

    core_sections = ["experience", "work experience", "education", "skills", "projects", "summary", "qualifications", "profile", "employment"]
    matched_sections = [s for s in core_sections if s in text_lower]

    skills_detected = [s for s in ai_service.KNOWN_SKILLS_LIST if re.search(r'(?<![a-zA-Z0-9])' + re.escape(s.lower()) + r'(?![a-zA-Z0-9])', text_lower)]

    # Scoring resume validity
    validity_score = 0
    if has_contact:
        validity_score += 1
    if len(matched_sections) >= 2:
        validity_score += 2
    elif len(matched_sections) >= 1:
        validity_score += 1
    if len(skills_detected) >= 2:
        validity_score += 1

    if validity_score < 2:
        return False, "Uploaded document does not have standard resume structure (missing contact info, skills, education, or work experience sections). Please upload a valid resume."

    return True, "Valid candidate resume."


def deduplicate_items(items) -> str:
    """Deduplicate list or comma-separated string case-insensitively, preserving first occurrence order."""
    if not items:
        return ""
    if isinstance(items, str):
        raw_list = items.split(",")
    elif isinstance(items, list):
        raw_list = items
    else:
        raw_list = [items]

    seen = set()
    unique = []
    for item in raw_list:
        cleaned = str(item).strip()
        if not cleaned:
            continue
        key = cleaned.lower()
        if key not in seen:
            seen.add(key)
            unique.append(cleaned)
    return ", ".join(unique)


def apply_resume_to_user_profile(db: Session, user_id: int, parsed_data: dict, overwrite: bool = False) -> Profile:
    """Autofill User Profile from parsed AI resume metadata without duplicate items."""
    profile = db.query(Profile).filter(Profile.user_id == user_id).first()
    if not profile:
        profile = Profile(user_id=user_id)
        db.add(profile)

    user = db.query(User).filter(User.id == user_id).first()

    # Full Name update if present
    full_name = parsed_data.get("full_name")
    if full_name and user and (overwrite or not user.full_name or user.full_name.lower() in ("user", "test user", "new user")):
        user.full_name = full_name.strip()

    def update_field(field_name, new_val):
        if new_val is not None and str(new_val).strip() != "":
            curr = getattr(profile, field_name, None)
            if overwrite or curr is None or str(curr).strip() == "":
                setattr(profile, field_name, str(new_val).strip() if isinstance(new_val, str) else new_val)

    # Bio & Titles
    bio = parsed_data.get("bio") or parsed_data.get("summary")
    update_field("bio", bio)

    current_title = parsed_data.get("current_title")
    if not current_title and parsed_data.get("roles"):
        roles = parsed_data.get("roles", [])
        if roles and isinstance(roles, list):
            current_title = roles[0]
    update_field("current_title", current_title)

    update_field("target_title", parsed_data.get("target_title"))

    exp_years = parsed_data.get("experience_years")
    if exp_years is not None:
        try:
            update_field("experience_years", int(exp_years))
        except (ValueError, TypeError):
            pass

    # Contact & Links
    update_field("location", parsed_data.get("location"))
    update_field("phone", parsed_data.get("phone"))
    update_field("linkedin_url", parsed_data.get("linkedin_url"))
    update_field("github_url", parsed_data.get("github_url"))
    update_field("portfolio_url", parsed_data.get("portfolio_url") or parsed_data.get("website_url"))

    # Skills & Lists (Strictly Deduplicated)
    skills = parsed_data.get("skills")
    if skills:
        curr_skills = profile.skills or ""
        if not overwrite and curr_skills:
            raw_combined = f"{curr_skills}, {', '.join([str(s) for s in skills]) if isinstance(skills, list) else str(skills)}"
        else:
            raw_combined = ", ".join([str(s) for s in skills]) if isinstance(skills, list) else str(skills)
        profile.skills = deduplicate_items(raw_combined)

    certs = parsed_data.get("certifications")
    if certs:
        curr_certs = profile.certifications or ""
        if not overwrite and curr_certs:
            raw_combined = f"{curr_certs}, {', '.join([str(c) for c in certs]) if isinstance(certs, list) else str(certs)}"
        else:
            raw_combined = ", ".join([str(c) for c in certs]) if isinstance(certs, list) else str(certs)
        profile.certifications = deduplicate_items(raw_combined)

    courses = parsed_data.get("courses")
    if courses:
        curr_courses = profile.courses or ""
        if not overwrite and curr_courses:
            raw_combined = f"{curr_courses}, {', '.join([str(c) for c in courses]) if isinstance(courses, list) else str(courses)}"
        else:
            raw_combined = ", ".join([str(c) for c in courses]) if isinstance(courses, list) else str(courses)
        profile.courses = deduplicate_items(raw_combined)

    langs = parsed_data.get("languages")
    if langs:
        curr_langs = profile.languages or ""
        if not overwrite and curr_langs:
            raw_combined = f"{curr_langs}, {', '.join([str(l) for l in langs]) if isinstance(langs, list) else str(langs)}"
        else:
            raw_combined = ", ".join([str(l) for l in langs]) if isinstance(langs, list) else str(langs)
        profile.languages = deduplicate_items(raw_combined)

    # Education & Achievements
    edu = parsed_data.get("education_summary")
    if not edu and parsed_data.get("education"):
        if isinstance(parsed_data["education"], list):
            edu_items = []
            for e in parsed_data["education"]:
                if isinstance(e, dict):
                    deg = e.get("degree", "")
                    inst = e.get("institution", "")
                    yr = e.get("year", "")
                    item = f"{deg} at {inst}".strip(" at ")
                    if yr: item += f" ({yr})"
                    edu_items.append(item)
                elif isinstance(e, str):
                    edu_items.append(e)
            edu = "; ".join(edu_items)
        elif isinstance(parsed_data["education"], str):
            edu = parsed_data["education"]
    update_field("education", edu)

    achievements = parsed_data.get("achievements")
    if isinstance(achievements, list):
        achievements = "; ".join([str(a) for a in achievements if a])
    update_field("achievements", achievements)

    db.commit()
    db.refresh(profile)
    return profile


def save_file_to_disk(file_bytes: bytes, filename: str, user_id: int) -> str:
    ext = Path(filename).suffix.lower()
    unique_name = f"{uuid.uuid4().hex}{ext}"
    try:
        user_dir = UPLOAD_DIR / str(user_id)
        user_dir.mkdir(parents=True, exist_ok=True)
        file_path = user_dir / unique_name
        file_path.write_bytes(file_bytes)
        return str(file_path)
    except Exception as e:
        logger.warning(f"Could not save to primary upload dir ({e}), trying /tmp directory...")
        try:
            tmp_dir = Path("/tmp") / "uploads" / "resumes" / str(user_id)
            tmp_dir.mkdir(parents=True, exist_ok=True)
            file_path = tmp_dir / unique_name
            file_path.write_bytes(file_bytes)
            return str(file_path)
        except Exception as e2:
            logger.error(f"Failed writing to /tmp directory: {e2}")
            return f"virtual_upload_{unique_name}"


def create_resume_record(db: Session, user_id: int, filename: str, file_path: str, text: str) -> Resume:
    resume = Resume(
        user_id=user_id,
        filename=filename,
        file_path=file_path,
        text_extract=text,
        parse_status="processing",
    )
    db.add(resume)
    db.commit()
    db.refresh(resume)
    return resume


async def _ai_pipeline_async(resume_id: int, text: str, db: Session) -> None:
    """Core async AI pipeline logic."""
    try:
        logger.info(f"[Resume {resume_id}] Starting AI pipeline")

        # Step 1 – parse resume
        parsed = await ai_service.parse_resume(text)
        skills        = parsed.get("skills", [])
        roles         = parsed.get("roles", [])
        experience    = parsed.get("experience", [])
        summary       = parsed.get("summary", "")
        certifications= parsed.get("certifications", [])
        courses       = parsed.get("courses", [])

        logger.info(f"[Resume {resume_id}] Parse done — {len(skills)} skills")

        # Steps 2-4 — run concurrently
        job_title        = parsed.get("current_title") or (roles[0] if roles else "General Professional")
        experience_years = parsed.get("experience_years") or max(len(experience) * 2, 1)

        results = await asyncio.gather(
            ai_service.analyze_ats_and_gaps(text, skills),
            ai_service.predict_career_paths(skills, roles, summary),
            ai_service.predict_salary(job_title, skills, experience_years),
            return_exceptions=True,
        )

        ats_data    = results[0] if not isinstance(results[0], Exception) else {"ats_score": 0, "skill_gaps": []}
        career_data = results[1] if not isinstance(results[1], Exception) else {"career_paths": []}
        salary_data = results[2] if not isinstance(results[2], Exception) else {}

        if isinstance(results[0], Exception):
            logger.error(f"[Resume {resume_id}] ATS analysis failed: {results[0]}")
        if isinstance(results[1], Exception):
            logger.error(f"[Resume {resume_id}] Career paths failed: {results[1]}")
        if isinstance(results[2], Exception):
            logger.error(f"[Resume {resume_id}] Salary prediction failed: {results[2]}")

        logger.info(f"[Resume {resume_id}] Gather done — ATS: {ats_data.get('ats_score')}")

        # Persist — re-fetch in case session is stale
        db.expire_all()
        resume = db.query(Resume).filter(Resume.id == resume_id).first()
        if not resume:
            logger.error(f"[Resume {resume_id}] Record not found after pipeline!")
            return

        resume.parsed_skills         = json.dumps(skills)
        resume.parsed_roles          = json.dumps(roles)
        resume.parsed_experience     = json.dumps(experience)
        resume.parsed_certifications   = json.dumps(certifications)
        resume.parsed_courses        = json.dumps(courses)
        resume.ats_score             = float(ats_data.get("ats_score", 0))
        resume.skill_gaps_json       = json.dumps(ats_data.get("skill_gaps", []))
        resume.career_paths_json     = json.dumps(career_data.get("career_paths", []))
        resume.salary_range_json     = json.dumps(salary_data)
        resume.parsed_raw_json       = json.dumps(parsed)
        resume.parsed_at             = datetime.now(timezone.utc)
        resume.parse_status          = "done"

        # Autofill missing fields in User Profile automatically
        try:
            apply_resume_to_user_profile(db, resume.user_id, parsed, overwrite=False)
        except Exception as p_err:
            logger.error(f"[Resume {resume_id}] Profile autofill notice: {p_err}")

        db.commit()
        logger.info(f"[Resume {resume_id}] Pipeline complete, profile populated and saved.")

    except Exception as e:
        logger.exception(f"[Resume {resume_id}] Pipeline crashed: {e}")
        _mark_error(db, resume_id)

    except Exception as e:
        logger.exception(f"[Resume {resume_id}] Pipeline crashed: {e}")
        _mark_error(db, resume_id)


def _mark_error(db: Session, resume_id: int) -> None:
    try:
        db.expire_all()
        resume = db.query(Resume).filter(Resume.id == resume_id).first()
        if resume:
            resume.parse_status = "error"
            db.commit()
    except Exception:
        pass


def run_ai_pipeline_sync(resume_id: int, text: str) -> None:
    """
    Sync entry point called by FastAPI BackgroundTasks (runs in a thread pool).
    Creates its own DB session and event loop so it is fully isolated.
    """
    from ..database import SessionLocal
    db = SessionLocal()
    try:
        # Build a fresh event loop for this background thread
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            loop.run_until_complete(_ai_pipeline_async(resume_id, text, db))
        finally:
            loop.close()
    except Exception as e:
        logger.exception(f"[Resume {resume_id}] Background runner failed: {e}")
        _mark_error(db, resume_id)
    finally:
        db.close()


def delete_resume_file(file_path: str) -> None:
    try:
        p = Path(file_path)
        if p.exists():
            p.unlink()
    except Exception:
        pass
