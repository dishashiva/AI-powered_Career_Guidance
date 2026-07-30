"""Generate CareerAI project report PDF following the template structure."""
import os
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor, white
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Image, Table, TableStyle,
    PageBreak, KeepTogether
)
from reportlab.platypus.flowables import HRFlowable

# ─── Paths ────────────────────────────────────────────────────
BASE = os.path.dirname(os.path.abspath(__file__))
OUTPUT_DIR = os.path.join(BASE, "Outputs")
OUTPUT_PDF = os.path.join(BASE, "CareerAI_Report.pdf")

# ─── Colors ───────────────────────────────────────────────────
BLUE = HexColor("#2e6ff2")
DARK = HexColor("#101828")
GRAY = HexColor("#475467")
LIGHT_GRAY = HexColor("#98a2b3")
BG_LIGHT = HexColor("#f9fafb")
BORDER = HexColor("#eaecf0")

# A4 usable width = 8.27 - 1 - 1 = 6.27 inches
PAGE_W = 6.27 * inch

# ─── Styles ───────────────────────────────────────────────────
styles = getSampleStyleSheet()

styles.add(ParagraphStyle(
    name='CoverTitle', fontName='Helvetica-Bold', fontSize=26, leading=32,
    alignment=TA_CENTER, textColor=DARK, spaceAfter=8,
))
styles.add(ParagraphStyle(
    name='CoverSubtitle', fontName='Helvetica', fontSize=14, leading=20,
    alignment=TA_CENTER, textColor=GRAY, spaceAfter=6,
))
styles.add(ParagraphStyle(
    name='CoverInfo', fontName='Helvetica', fontSize=12, leading=18,
    alignment=TA_CENTER, textColor=GRAY, spaceAfter=4,
))
styles.add(ParagraphStyle(
    name='SectionHeading', fontName='Helvetica-Bold', fontSize=16, leading=22,
    textColor=DARK, spaceBefore=16, spaceAfter=8,
))
styles.add(ParagraphStyle(
    name='SubHeading', fontName='Helvetica-Bold', fontSize=13, leading=18,
    textColor=DARK, spaceBefore=10, spaceAfter=4,
))
styles.add(ParagraphStyle(
    name='BodyText2', fontName='Helvetica', fontSize=11, leading=15,
    textColor=GRAY, alignment=TA_JUSTIFY, spaceAfter=6,
))
styles.add(ParagraphStyle(
    name='BulletItem', fontName='Helvetica', fontSize=11, leading=15,
    textColor=GRAY, leftIndent=18, spaceAfter=3, bulletIndent=6,
))
styles.add(ParagraphStyle(
    name='FigCaption', fontName='Helvetica-Oblique', fontSize=10, leading=13,
    alignment=TA_CENTER, textColor=LIGHT_GRAY, spaceBefore=3, spaceAfter=10,
))
# Cell text styles for the table
styles.add(ParagraphStyle(
    name='CellHeader', fontName='Helvetica-Bold', fontSize=9.5, leading=13,
    textColor=white,
))
styles.add(ParagraphStyle(
    name='CellBold', fontName='Helvetica-Bold', fontSize=9.5, leading=13,
    textColor=DARK,
))
styles.add(ParagraphStyle(
    name='CellBody', fontName='Helvetica', fontSize=9.5, leading=13,
    textColor=GRAY,
))

# ─── Helpers ──────────────────────────────────────────────────
def heading(text):
    return Paragraph(text, styles['SectionHeading'])

def subheading(text):
    return Paragraph(text, styles['SubHeading'])

def body(text):
    return Paragraph(text, styles['BodyText2'])

def bullet(text):
    return Paragraph(f"\u2022  {text}", styles['BulletItem'])

def cell_p(text, style_name='CellBody'):
    """Wrap cell text in a Paragraph for proper wrapping."""
    return Paragraph(text, styles[style_name])

def add_image(story, filename, caption):
    """Add image scaled to fill page width, no forced page break."""
    path = os.path.join(OUTPUT_DIR, filename)
    if not os.path.exists(path):
        story.append(body(f"[Screenshot missing: {filename}]"))
        return
    img = Image(path)
    iw, ih = img.imageWidth, img.imageHeight
    # Scale to page width, cap height at 5.5 inches to leave room for caption
    max_h = 5.5 * inch
    ratio = min(PAGE_W / iw, max_h / ih)
    img.drawWidth = iw * ratio
    img.drawHeight = ih * ratio
    img.hAlign = 'CENTER'
    story.append(img)
    story.append(Paragraph(caption, styles['FigCaption']))

# ─── Build Document ───────────────────────────────────────────
doc = SimpleDocTemplate(
    OUTPUT_PDF,
    pagesize=A4,
    topMargin=0.75*inch,
    bottomMargin=0.6*inch,
    leftMargin=1*inch,
    rightMargin=1*inch,
)

story = []

# ──────────────────────────────────────────────────────────────
# COVER PAGE
# ──────────────────────────────────────────────────────────────
story.append(Spacer(1, 1.8*inch))
story.append(HRFlowable(width="40%", thickness=3, color=BLUE, spaceAfter=20))
story.append(Paragraph("CareerAI", styles['CoverTitle']))
story.append(Paragraph("AI-Powered Career Intelligence Platform", styles['CoverSubtitle']))
story.append(Spacer(1, 24))
story.append(HRFlowable(width="40%", thickness=1, color=BORDER, spaceAfter=24))
story.append(Paragraph("INFOSYS SPRINGBOARD VIRTUAL INTERNSHIP", styles['CoverInfo']))
story.append(Spacer(1, 12))
story.append(Paragraph("Project: CareerAI \u2014 AI-Powered Career Intelligence Platform", styles['CoverInfo']))
story.append(Spacer(1, 36))
story.append(Paragraph("<b>SUBMITTED BY:</b>", styles['CoverInfo']))
story.append(Spacer(1, 6))
story.append(Paragraph("Name: Disha S", styles['CoverInfo']))
story.append(Paragraph("Domain: Artificial Intelligence", styles['CoverInfo']))
story.append(Paragraph("Date: 08.07.2026", styles['CoverInfo']))
story.append(PageBreak())

# ──────────────────────────────────────────────────────────────
# 1. INTRODUCTION
# ──────────────────────────────────────────────────────────────
story.append(heading("1. Introduction"))
story.append(body(
    'The project <b>"CareerAI \u2014 AI-Powered Career Intelligence Platform"</b> '
    'is a full-stack web application that functions as an intelligent career coach. '
    'It leverages artificial intelligence to analyze resumes, detect skill gaps, '
    'predict career paths, and provide real-time AI-powered guidance to help '
    'professionals make informed career decisions.'
))
story.append(body(
    'The platform addresses a common challenge faced by job seekers: understanding '
    'how their resume performs against applicant tracking systems (ATS), identifying '
    'which skills are missing for their target roles, and finding the right career '
    'trajectory. CareerAI automates this analysis using NLP-powered resume parsing '
    'and large language model inference, delivering actionable insights in seconds.'
))
story.append(body(
    'Users can upload their resume in PDF or DOCX format, receive an ATS compatibility '
    'score, view detected skills and skill gaps, explore AI-recommended career paths '
    'with salary estimates, browse personalized job and course recommendations, and '
    'interact with an AI career coach chatbot that understands their profile context.'
))

# ──────────────────────────────────────────────────────────────
# 2. OBJECTIVE
# ──────────────────────────────────────────────────────────────
story.append(heading("2. Objective"))
story.append(body("The primary objectives of the CareerAI platform are:"))
story.append(bullet("<b>Resume Analysis &amp; ATS Scoring</b> \u2014 Parse uploaded resumes using NLP techniques, extract structured data (skills, roles, experience), and generate an ATS compatibility score benchmarked against industry standards."))
story.append(bullet("<b>Skill Gap Detection</b> \u2014 Identify missing skills relative to the user's target career path and provide prioritized recommendations with explanations for each gap."))
story.append(bullet("<b>Career Path Prediction</b> \u2014 Use AI to generate personalized career trajectory recommendations with match percentages, required skills, salary ranges, and timelines."))
story.append(bullet("<b>Salary Intelligence</b> \u2014 Provide role-aware, location-aware salary estimates based on the user's detected skillset and experience level."))
story.append(bullet("<b>Job &amp; Course Recommendations</b> \u2014 Curate personalized job listings and skill-building courses matched to the user's profile and identified gaps."))
story.append(bullet("<b>AI Career Coach</b> \u2014 Offer a conversational chatbot interface that maintains profile context and delivers personalized, actionable career guidance."))
story.append(bullet("<b>Secure Authentication</b> \u2014 Implement JWT-based user authentication with registration, login, and profile management."))
story.append(bullet("<b>Clean, Professional UI</b> \u2014 Deliver a responsive, accessible interface built with React that prioritizes usability and visual clarity."))

# ──────────────────────────────────────────────────────────────
# 3. TECH STACK
# ──────────────────────────────────────────────────────────────
story.append(heading("3. Tech Stack"))
story.append(body("The CareerAI platform was built using the following technologies:"))
story.append(Spacer(1, 4))

# Build table with Paragraph cells for proper wrapping
col_widths = [1.1*inch, 1.4*inch, 3.77*inch]  # total = 6.27 inches

header = [
    cell_p("Layer", 'CellHeader'),
    cell_p("Technology", 'CellHeader'),
    cell_p("Purpose", 'CellHeader'),
]

def row(layer, tech, purpose):
    return [
        cell_p(layer, 'CellBold'),
        cell_p(tech, 'CellBody'),
        cell_p(purpose, 'CellBody'),
    ]

tech_data = [
    header,
    row("Frontend", "React.js + Vite", "Single-page application with fast dev server and optimized builds"),
    row("Backend", "FastAPI (Python)", "High-performance async API framework for REST endpoints"),
    row("Database", "MySQL + SQLAlchemy", "Relational database with ORM for structured data storage"),
    row("AI Engine", "OpenRouter API (Llama 3.1 8B)", "Large language model for resume analysis, career predictions, and chat"),
    row("Auth", "JWT (JSON Web Tokens)", "Stateless authentication for secure API access"),
    row("Resume Parsing", "NLP Libraries", "PDF/DOCX text extraction and skill entity recognition"),
    row("Charts", "Recharts", "Radial and bar charts for ATS score visualization"),
    row("Icons", "Lucide React", "Consistent, lightweight icon system"),
    row("HTTP Client", "Axios", "Promise-based API communication with request/response interceptors"),
    row("Version Control", "Git &amp; GitHub", "Source code management and collaboration"),
]

table = Table(tech_data, colWidths=col_widths, repeatRows=1)
table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), BLUE),
    ('TEXTCOLOR', (0, 0), (-1, 0), white),
    ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ('TOPPADDING', (0, 0), (-1, -1), 5),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ('LEFTPADDING', (0, 0), (-1, -1), 6),
    ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ('GRID', (0, 0), (-1, -1), 0.5, BORDER),
    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [white, BG_LIGHT]),
]))
story.append(table)

# ──────────────────────────────────────────────────────────────
# 4. SYSTEM ARCHITECTURE
# ──────────────────────────────────────────────────────────────
story.append(heading("4. System Architecture"))
story.append(body(
    "The application follows a clean three-tier architecture: a React-based "
    "single-page application (SPA) frontend communicates with a FastAPI backend "
    "over RESTful JSON APIs, which in turn interacts with a MySQL database through "
    "SQLAlchemy ORM. The AI capabilities are provided by an external large language "
    "model accessed via the OpenRouter API."
))
story.append(body(
    "<b>Frontend Layer:</b> Built with React 19 and Vite, the SPA handles routing "
    "(react-router-dom), state management (React Context), and API communication "
    "(Axios with JWT interceptors). The UI uses a clean design system with CSS "
    "custom properties for consistent theming."
))
story.append(body(
    "<b>Backend Layer:</b> FastAPI serves as the API gateway, handling authentication "
    "(JWT token generation and validation), resume file uploads with NLP-based "
    "parsing, and AI inference requests. The backend exposes endpoints for auth, "
    "users, resumes, jobs, courses, and AI operations."
))
story.append(body(
    "<b>Data Layer:</b> MySQL stores user accounts, resume data, parsed analysis "
    "results, and cached recommendations. SQLAlchemy provides ORM abstraction "
    "with automatic table creation on startup."
))

# ──────────────────────────────────────────────────────────────
# 5. SCREENSHOTS AND OUTPUT (continuous flow, no forced breaks)
# ──────────────────────────────────────────────────────────────
story.append(heading("5. Screenshots and Output"))
story.append(body(
    "Below are screenshots demonstrating the key features of the CareerAI platform."
))

add_image(story, "localhost_5173_career (1).png",
          "Fig 1: Dashboard \u2014 Resume upload, ATS score overview, quick navigation, and resume history")

story.append(Spacer(1, 6))

add_image(story, "localhost_5173_career.png",
          "Fig 2: Career Intelligence \u2014 ATS score breakdown, detected skills, skill gap analysis, and career paths")

story.append(Spacer(1, 6))

add_image(story, "localhost_5173_career (4).png",
          "Fig 3: Job Recommendations \u2014 AI-curated job listings with match scores and skill tags")

story.append(Spacer(1, 6))

add_image(story, "localhost_5173_career (3).png",
          "Fig 4: Course Recommendations \u2014 Skill-building courses matched to identified gaps")

story.append(Spacer(1, 6))

add_image(story, "localhost_5173_career (2).png",
          "Fig 5: AI Career Coach \u2014 Conversational interface with resume context and quick prompts")

# ──────────────────────────────────────────────────────────────
# 6. KEY FEATURES SUMMARY
# ──────────────────────────────────────────────────────────────
story.append(heading("6. Key Features Summary"))

features = [
    ("Resume Upload &amp; Parsing", "Supports PDF, DOCX, and TXT formats. Uses NLP to extract skills, roles, experience, and education from unstructured resume text."),
    ("ATS Score Analysis", "Generates a compatibility score (0\u2013100) against applicant tracking system benchmarks, displayed with a radial chart and progress bar."),
    ("Skill Gap Detection", "Compares detected skills against target role requirements. Each gap includes a priority level (high/medium/low) and an explanation."),
    ("Career Path Prediction", "Recommends career trajectories with match percentages, required skills, salary ranges, and estimated timelines."),
    ("Job Recommendations", "AI-curated job listings with match scores, company info, location, salary, job type, and direct apply links."),
    ("Course Recommendations", "Personalized learning resources targeting skill gaps, with match scores, ratings, duration, and provider info."),
    ("AI Career Coach", "Chatbot interface with resume context awareness, quick prompt suggestions, and conversation history."),
    ("Responsive Design", "Clean, professional UI that works across desktop and mobile viewports with a consistent design system."),
]

for title, desc in features:
    story.append(subheading(title))
    story.append(body(desc))

# ──────────────────────────────────────────────────────────────
# 7. CONCLUSION
# ──────────────────────────────────────────────────────────────
story.append(heading("7. Conclusion"))
story.append(body(
    "The CareerAI platform successfully delivers an integrated, AI-powered career "
    "intelligence system that addresses the key challenges job seekers face today. "
    "By combining resume parsing, ATS scoring, skill gap analysis, career path "
    "prediction, and an interactive AI coach into a single platform, it provides "
    "a comprehensive toolkit for career development."
))
story.append(body(
    "The project demonstrates the practical application of large language models "
    "in career services, showing how AI can transform unstructured resume data into "
    "structured, actionable insights. The clean architecture \u2014 separating concerns "
    "across React frontend, FastAPI backend, and MySQL database \u2014 ensures the "
    "system is maintainable and scalable."
))
story.append(body(
    "Future enhancements could include integration with live job boards via APIs, "
    "LinkedIn profile analysis, multi-language resume support, interview preparation "
    "modules, and collaborative features for career mentors and coaches."
))

# ──────────────────────────────────────────────────────────────
# 8. ACKNOWLEDGMENT
# ──────────────────────────────────────────────────────────────
story.append(heading("8. Acknowledgment"))
story.append(body(
    "I would like to express my sincere gratitude to the Infosys Springboard "
    "team and my mentor for their continuous guidance and support throughout the "
    "development of this project. This virtual internship has been a valuable "
    "experience in learning full-stack development, AI integration, and building "
    "real-world applications that solve meaningful problems."
))
story.append(body(
    "The mentorship and structured project framework provided by the Infosys "
    "Springboard program were instrumental in shaping the direction and quality "
    "of this project. I am grateful for the opportunity to work on a project "
    "that combines artificial intelligence with practical career development tools."
))

# ─── Build ────────────────────────────────────────────────────
doc.build(story)
print(f"Report generated: {OUTPUT_PDF}")
