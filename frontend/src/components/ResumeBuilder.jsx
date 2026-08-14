import React, { useState, useRef, useEffect } from 'react';
import {
  FileText, Download, Plus, Trash2, Eye, EyeOff, Sparkles, RefreshCw,
  Palette, Check, ChevronDown, ChevronUp, Briefcase, GraduationCap,
  Code, FolderGit2, Award, User, HelpCircle, Layers, MoveUp, MoveDown,
  Globe, Mail, Phone, MapPin, Printer, Copy, Link as LinkIcon
} from 'lucide-react';
import toast from 'react-hot-toast';

function LinkedinIcon({ size = 12, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
      <rect x="2" y="9" width="4" height="12"></rect>
      <circle cx="4" cy="4" r="2"></circle>
    </svg>
  );
}

function GithubIcon({ size = 12, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
    </svg>
  );
}

// ─── Default Sample Resume Data ──────────────────────────────────────
const DEFAULT_RESUME_DATA = {
  personal: {
    fullName: 'Alex Morgan',
    jobTitle: 'Senior Full Stack Engineer',
    email: 'alex.morgan@example.com',
    phone: '+1 (555) 234-5678',
    location: 'San Francisco, CA',
    website: 'alexmorgan.dev',
    linkedin: 'linkedin.com/in/alexmorgan',
    github: 'github.com/alexmorgan',
    customFields: [
      { id: 'c1', label: 'Portfolio', value: 'portfolio.alexmorgan.dev' }
    ]
  },
  summary: 'Innovative and results-driven Senior Full Stack Engineer with 6+ years of experience designing and scaling web applications, microservices, and AI integrations. Proven track record of improving system performance by 40% and leading cross-functional engineering teams.',
  experience: [
    {
      id: 'exp-1',
      company: 'TechSphere Solutions',
      position: 'Senior Full Stack Engineer',
      location: 'San Francisco, CA',
      startDate: 'Jan 2022',
      endDate: 'Present',
      current: true,
      highlights: [
        'Architected microservices infrastructure using Node.js and React handling 3M+ active daily users.',
        'Engineered AI-assisted search pipelines, decreasing query processing latency by 35%.',
        'Mentored 5 junior engineers and established automated CI/CD code deployment standards.'
      ]
    },
    {
      id: 'exp-2',
      company: 'DataPulse Systems',
      position: 'Frontend Engineer',
      location: 'Austin, TX',
      startDate: 'Jun 2019',
      endDate: 'Dec 2021',
      current: false,
      highlights: [
        'Built responsive customer dashboard components in React and TypeScript with unit coverage > 90%.',
        'Optimized bundle size by 45% through lazy loading, code splitting, and asset compression.'
      ]
    }
  ],
  education: [
    {
      id: 'edu-1',
      institution: 'University of California, Berkeley',
      degree: 'B.S. in Computer Science',
      location: 'Berkeley, CA',
      startDate: '2015',
      endDate: '2019',
      gpa: '3.8 / 4.0'
    }
  ],
  skills: [
    { category: 'Frontend', items: ['React', 'TypeScript', 'Next.js', 'Redux', 'HTML5/CSS3', 'Tailwind CSS'] },
    { category: 'Backend & Cloud', items: ['Node.js', 'Python', 'FastAPI', 'PostgreSQL', 'Docker', 'AWS', 'RESTful APIs'] },
    { category: 'Tools & DevOps', items: ['Git', 'CI/CD Pipelines', 'Jest', 'Webpack', 'Vite', 'GraphQL'] }
  ],
  projects: [
    {
      id: 'proj-1',
      title: 'CareerAI Intelligence Hub',
      subtitle: 'Creator & Lead Developer',
      date: '2023 - Present',
      description: 'Developed an AI-driven career optimization suite providing automated resume ATS analysis, JD matching, and interactive interview tools.',
      link: 'github.com/alexmorgan/career-ai'
    }
  ],
  certifications: [
    { id: 'cert-1', name: 'AWS Certified Solutions Architect – Associate', issuer: 'Amazon Web Services', date: '2023' },
    { id: 'cert-2', name: 'Meta Senior Full Stack Developer Certificate', issuer: 'Meta', date: '2022' }
  ],
  customSections: [
    {
      id: 'cust-1',
      title: 'Languages & Interests',
      items: ['English (Native)', 'Spanish (Conversational)', 'Open Source Contributing', 'Algorithmic Trading']
    }
  ]
};

// ─── Color Options ───────────────────────────────────────────────────
const ACCENT_COLORS = [
  { id: 'blue', label: 'Royal Blue', hex: '#2563eb' },
  { id: 'indigo', label: 'Indigo', hex: '#4f46e5' },
  { id: 'emerald', label: 'Emerald Green', hex: '#059669' },
  { id: 'teal', label: 'Deep Teal', hex: '#0d9488' },
  { id: 'rose', label: 'Crimson Rose', hex: '#e11d48' },
  { id: 'purple', label: 'Violet', hex: '#7c3aed' },
  { id: 'slate', label: 'Charcoal Slate', hex: '#1e293b' }
];

// ─── Template Definitions ───────────────────────────────────────────
const TEMPLATES = [
  { id: 'modern', name: 'Modern Clean', description: 'Two-column minimalist layout with colored section dividers and crisp typography.' },
  { id: 'executive', name: 'Executive Formal', description: 'Classic corporate header with subtle border lines, centered layout & serif headers.' },
  { id: 'creative', name: 'Tech Sidebar', description: 'Distinct accent sidebar for contact info & skills with high readability.' },
  { id: 'minimal', name: 'Minimalist Compact', description: 'Streamlined single-column design maximizing space efficiency.' }
];

export default function ResumeBuilder({ activeResume, resumesList = [], onSelectResume }) {
  const [data, setData] = useState(DEFAULT_RESUME_DATA);
  const [selectedTemplate, setSelectedTemplate] = useState('modern');
  const [accentColor, setAccentColor] = useState(ACCENT_COLORS[0]);
  const [activeTab, setActiveTab] = useState('editor'); // 'editor' | 'preview' | 'split'
  const [openSection, setOpenSection] = useState('personal');

  // Track hidden/deleted sections & fields
  const [hiddenSections, setHiddenSections] = useState({
    personal: false,
    summary: false,
    experience: false,
    education: false,
    skills: false,
    projects: false,
    certifications: false,
    customSections: false
  });

  const [hiddenFields, setHiddenFields] = useState({
    phone: false,
    location: false,
    website: false,
    linkedin: false,
    github: false,
    jobTitle: false
  });

  const printRef = useRef();

  // Populate from active resume if provided
  const populateFromActiveResume = (showToast = true) => {
    if (!activeResume) {
      if (showToast) toast.error('No parsed resume data available to load.');
      return;
    }

    try {
      const raw = activeResume.parsed_raw || {};
      
      // 1. Contact / Personal Info
      const rawName = raw.full_name || raw.name || activeResume.full_name;
      let fullName = '';
      if (rawName && typeof rawName === 'string' && rawName.trim().length > 0) {
        fullName = rawName.trim();
      } else {
        const cleanFilename = activeResume.filename ? activeResume.filename.replace(/\.[^/.]+$/, "").replace(/_/g, " ").replace(/-/g, " ") : '';
        const isHash = /^[a-f0-9]{15,}$/i.test(cleanFilename) || cleanFilename.length > 25;
        if (!isHash && cleanFilename && !cleanFilename.toLowerCase().includes('resume')) {
          fullName = cleanFilename;
        } else {
          fullName = 'Candidate Full Name';
        }
      }

      const jobTitle = raw.current_title || raw.job_title || raw.target_title || (activeResume.parsed_roles && activeResume.parsed_roles[0]) || '';
      const email = raw.email || activeResume.email || '';
      const phone = raw.phone || activeResume.phone || '';
      const location = raw.location || activeResume.location || '';
      const website = raw.portfolio_url || raw.website || '';
      const linkedin = raw.linkedin_url || raw.linkedin || '';
      const github = raw.github_url || raw.github || '';

      // 2. Summary / Bio
      const summary = raw.summary || raw.bio || activeResume.summary || '';

      // 3. Skills
      const rawSkills = (raw.skills && raw.skills.length > 0)
        ? raw.skills
        : (activeResume.parsed_skills && activeResume.parsed_skills.length > 0)
          ? activeResume.parsed_skills
          : [];

      let skillsCategorized = [];
      if (Array.isArray(rawSkills) && rawSkills.length > 0) {
        if (typeof rawSkills[0] === 'string') {
          const items = rawSkills.filter(s => s && typeof s === 'string' && s.trim());
          if (items.length > 10) {
            const mid = Math.ceil(items.length / 2);
            skillsCategorized = [
              { category: 'Core & Programming Skills', items: items.slice(0, mid) },
              { category: 'Frameworks, Tools & Platforms', items: items.slice(mid) }
            ];
          } else {
            skillsCategorized = [{ category: 'Core & Technical Skills', items: items }];
          }
        } else if (typeof rawSkills[0] === 'object') {
          skillsCategorized = rawSkills.map(cat => ({
            category: cat.category || cat.name || 'Skills',
            items: Array.isArray(cat.items) ? cat.items : (cat.skills || [])
          }));
        }
      }

      // 4. Work Experience
      const rawExperience = (raw.experience && raw.experience.length > 0)
        ? raw.experience
        : (activeResume.parsed_experience && Array.isArray(activeResume.parsed_experience))
          ? activeResume.parsed_experience
          : [];

      const parsedExperience = rawExperience.map((exp, idx) => {
        let highlights = [];
        if (Array.isArray(exp.bullet_points) && exp.bullet_points.length > 0) {
          highlights = exp.bullet_points;
        } else if (Array.isArray(exp.highlights) && exp.highlights.length > 0) {
          highlights = exp.highlights;
        } else if (exp.description) {
          highlights = String(exp.description).split('\n').map(l => l.trim()).filter(l => l.length > 0);
        } else {
          highlights = ['Key achievements and responsibilities in this role.'];
        }

        let startDate = exp.start_date || exp.start_year || '';
        let endDate = exp.end_date || exp.end_year || '';
        if ((!startDate || !endDate) && (exp.duration || exp.year)) {
          const dur = exp.duration || exp.year;
          const parts = String(dur).split(/[-–—to]+/i);
          startDate = parts[0] ? parts[0].trim() : String(dur);
          endDate = parts[1] ? parts[1].trim() : 'Present';
        }

        return {
          id: `exp_parsed_${idx}_${Date.now()}`,
          company: exp.company || exp.organization || 'Company',
          position: exp.title || exp.position || exp.role || 'Position Title',
          location: exp.location || '',
          startDate: startDate || '2020',
          endDate: endDate || 'Present',
          current: !endDate || String(endDate).toLowerCase().includes('present'),
          highlights: highlights
        };
      });

      // 5. Education
      const rawEducation = (raw.education && raw.education.length > 0)
        ? raw.education
        : (activeResume.parsed_education && Array.isArray(activeResume.parsed_education))
          ? activeResume.parsed_education
          : [];

      const parsedEducation = rawEducation.map((edu, idx) => {
        let startDate = edu.start_year || edu.start_date || '';
        let endDate = edu.end_year || edu.end_date || edu.year || '';
        if (!startDate && endDate && String(endDate).includes('-')) {
          const parts = String(endDate).split('-');
          startDate = parts[0].trim();
          endDate = parts[1].trim();
        }

        return {
          id: `edu_parsed_${idx}_${Date.now()}`,
          institution: edu.institution || edu.school || edu.university || 'University Name',
          degree: edu.degree || edu.field_of_study || 'Degree / Major',
          location: edu.location || '',
          startDate: startDate || '',
          endDate: endDate || '',
          gpa: edu.gpa || ''
        };
      });

      // 6. Certifications
      const rawCertifications = (raw.certifications && raw.certifications.length > 0)
        ? raw.certifications
        : (activeResume.parsed_certifications && Array.isArray(activeResume.parsed_certifications))
          ? activeResume.parsed_certifications
          : [];

      const parsedCertifications = rawCertifications.map((c, idx) => {
        if (typeof c === 'string') {
          return {
            id: `cert_parsed_${idx}_${Date.now()}`,
            name: c,
            issuer: 'Certified Authority',
            date: ''
          };
        }
        return {
          id: `cert_parsed_${idx}_${Date.now()}`,
          name: c.name || c.title || 'Certification Name',
          issuer: c.issuer || c.organization || '',
          date: c.date || c.year || ''
        };
      });

      // 7. Custom Sections (Languages / Courses)
      const customSections = [];
      const languages = raw.languages || [];
      if (Array.isArray(languages) && languages.length > 0) {
        customSections.push({
          id: `cust_lang_${Date.now()}`,
          title: 'Languages',
          items: languages
        });
      }

      const courses = raw.courses || activeResume.parsed_courses || [];
      if (Array.isArray(courses) && courses.length > 0) {
        customSections.push({
          id: `cust_course_${Date.now()}`,
          title: 'Courses & Training',
          items: courses.map(c => typeof c === 'string' ? c : c.name || JSON.stringify(c))
        });
      }

      // Update State cleanly
      setData(prev => ({
        personal: {
          ...prev.personal,
          fullName: fullName || prev.personal.fullName,
          jobTitle: jobTitle || prev.personal.jobTitle,
          email: email || prev.personal.email,
          phone: phone || prev.personal.phone,
          location: location || prev.personal.location,
          website: website || prev.personal.website,
          linkedin: linkedin || prev.personal.linkedin,
          github: github || prev.personal.github
        },
        summary: summary || prev.summary,
        experience: parsedExperience.length > 0 ? parsedExperience : prev.experience,
        education: parsedEducation.length > 0 ? parsedEducation : prev.education,
        skills: skillsCategorized.length > 0 ? skillsCategorized : prev.skills,
        projects: prev.projects,
        certifications: parsedCertifications.length > 0 ? parsedCertifications : prev.certifications,
        customSections: customSections.length > 0 ? customSections : prev.customSections
      }));

      if (showToast) toast.success('Auto-filled resume builder with full active resume contents!');
    } catch (err) {
      console.error('Error auto-filling from active resume:', err);
      if (showToast) toast.error('Failed to import full resume content.');
    }
  };

  // Auto-populate when activeResume changes
  useEffect(() => {
    if (activeResume && activeResume.id) {
      populateFromActiveResume(false);
    }
  }, [activeResume?.id]);

  // Field/Section Handlers
  const toggleSectionHide = (sectionKey) => {
    setHiddenSections(prev => ({ ...prev, [sectionKey]: !prev[sectionKey] }));
  };

  const toggleFieldHide = (fieldKey) => {
    setHiddenFields(prev => ({ ...prev, [fieldKey]: !prev[fieldKey] }));
  };

  const updatePersonal = (field, value) => {
    setData(prev => ({
      ...prev,
      personal: { ...prev.personal, [field]: value }
    }));
  };

  // Add custom contact field
  const addCustomContactField = () => {
    const id = `c_${Date.now()}`;
    setData(prev => ({
      ...prev,
      personal: {
        ...prev.personal,
        customFields: [...(prev.personal.customFields || []), { id, label: 'Custom Link', value: '' }]
      }
    }));
  };

  const updateCustomContactField = (id, field, value) => {
    setData(prev => ({
      ...prev,
      personal: {
        ...prev.personal,
        customFields: (prev.personal.customFields || []).map(f => f.id === id ? { ...f, [field]: value } : f)
      }
    }));
  };

  const deleteCustomContactField = (id) => {
    setData(prev => ({
      ...prev,
      personal: {
        ...prev.personal,
        customFields: (prev.personal.customFields || []).filter(f => f.id !== id)
      }
    }));
  };

  // Experience Handlers
  const addExperience = () => {
    const newExp = {
      id: `exp_${Date.now()}`,
      company: 'New Company',
      position: 'Job Title',
      location: 'City, Country',
      startDate: 'Month Year',
      endDate: 'Present',
      current: true,
      highlights: ['Key responsibility or major achievement bullet point']
    };
    setData(prev => ({ ...prev, experience: [...prev.experience, newExp] }));
  };

  const updateExperience = (id, field, value) => {
    setData(prev => ({
      ...prev,
      experience: prev.experience.map(exp => exp.id === id ? { ...exp, [field]: value } : exp)
    }));
  };

  const deleteExperience = (id) => {
    setData(prev => ({
      ...prev,
      experience: prev.experience.filter(exp => exp.id !== id)
    }));
  };

  const addExpHighlight = (expId) => {
    setData(prev => ({
      ...prev,
      experience: prev.experience.map(exp => {
        if (exp.id === expId) {
          return { ...exp, highlights: [...(exp.highlights || []), 'New key achievement or responsibility.'] };
        }
        return exp;
      })
    }));
  };

  const updateExpHighlight = (expId, index, value) => {
    setData(prev => ({
      ...prev,
      experience: prev.experience.map(exp => {
        if (exp.id === expId) {
          const highlights = [...exp.highlights];
          highlights[index] = value;
          return { ...exp, highlights };
        }
        return exp;
      })
    }));
  };

  const deleteExpHighlight = (expId, index) => {
    setData(prev => ({
      ...prev,
      experience: prev.experience.map(exp => {
        if (exp.id === expId) {
          return { ...exp, highlights: exp.highlights.filter((_, i) => i !== index) };
        }
        return exp;
      })
    }));
  };

  // Education Handlers
  const addEducation = () => {
    const newEdu = {
      id: `edu_${Date.now()}`,
      institution: 'University / Institute Name',
      degree: 'Degree / Major',
      location: 'City, State',
      startDate: '2020',
      endDate: '2024',
      gpa: ''
    };
    setData(prev => ({ ...prev, education: [...prev.education, newEdu] }));
  };

  const updateEducation = (id, field, value) => {
    setData(prev => ({
      ...prev,
      education: prev.education.map(edu => edu.id === id ? { ...edu, [field]: value } : edu)
    }));
  };

  const deleteEducation = (id) => {
    setData(prev => ({ ...prev, education: prev.education.filter(edu => edu.id !== id) }));
  };

  // Skills Handlers
  const addSkillCategory = () => {
    const newSkillCat = {
      category: 'New Category',
      items: ['Skill Item 1', 'Skill Item 2']
    };
    setData(prev => ({ ...prev, skills: [...prev.skills, newSkillCat] }));
  };

  const updateSkillCategoryName = (catIndex, name) => {
    setData(prev => ({
      ...prev,
      skills: prev.skills.map((cat, idx) => idx === catIndex ? { ...cat, category: name } : cat)
    }));
  };

  const addSkillItem = (catIndex, skillName) => {
    if (!skillName.trim()) return;
    setData(prev => ({
      ...prev,
      skills: prev.skills.map((cat, idx) => {
        if (idx === catIndex) {
          return { ...cat, items: [...cat.items, skillName.trim()] };
        }
        return cat;
      })
    }));
  };

  const deleteSkillItem = (catIndex, itemIndex) => {
    setData(prev => ({
      ...prev,
      skills: prev.skills.map((cat, idx) => {
        if (idx === catIndex) {
          return { ...cat, items: cat.items.filter((_, i) => i !== itemIndex) };
        }
        return cat;
      })
    }));
  };

  const deleteSkillCategory = (catIndex) => {
    setData(prev => ({ ...prev, skills: prev.skills.filter((_, idx) => idx !== catIndex) }));
  };

  // Projects Handlers
  const addProject = () => {
    const newProj = {
      id: `proj_${Date.now()}`,
      title: 'New Project Title',
      subtitle: 'Role / Tech Stack',
      date: '2024',
      description: 'Brief description of key achievements and technology utilized.',
      link: 'github.com/username/project'
    };
    setData(prev => ({ ...prev, projects: [...prev.projects, newProj] }));
  };

  const updateProject = (id, field, value) => {
    setData(prev => ({
      ...prev,
      projects: prev.projects.map(p => p.id === id ? { ...p, [field]: value } : p)
    }));
  };

  const deleteProject = (id) => {
    setData(prev => ({ ...prev, projects: prev.projects.filter(p => p.id !== id) }));
  };

  // Certifications Handlers
  const addCertification = () => {
    const newCert = {
      id: `cert_${Date.now()}`,
      name: 'Certification Name',
      issuer: 'Issuing Organization',
      date: 'Year'
    };
    setData(prev => ({ ...prev, certifications: [...prev.certifications, newCert] }));
  };

  const updateCertification = (id, field, value) => {
    setData(prev => ({
      ...prev,
      certifications: prev.certifications.map(c => c.id === id ? { ...c, [field]: value } : c)
    }));
  };

  const deleteCertification = (id) => {
    setData(prev => ({ ...prev, certifications: prev.certifications.filter(c => c.id !== id) }));
  };

  // Custom Sections Handlers
  const addCustomSection = () => {
    const newSec = {
      id: `cust_${Date.now()}`,
      title: 'Custom Section Title',
      items: ['Custom detail item 1', 'Custom detail item 2']
    };
    setData(prev => ({ ...prev, customSections: [...(prev.customSections || []), newSec] }));
  };

  const updateCustomSection = (id, field, value) => {
    setData(prev => ({
      ...prev,
      customSections: prev.customSections.map(c => c.id === id ? { ...c, [field]: value } : c)
    }));
  };

  const addCustomSectionItem = (secId, text) => {
    if (!text.trim()) return;
    setData(prev => ({
      ...prev,
      customSections: prev.customSections.map(c => {
        if (c.id === secId) {
          return { ...c, items: [...c.items, text.trim()] };
        }
        return c;
      })
    }));
  };

  const deleteCustomSectionItem = (secId, itemIdx) => {
    setData(prev => ({
      ...prev,
      customSections: prev.customSections.map(c => {
        if (c.id === secId) {
          return { ...c, items: c.items.filter((_, i) => i !== itemIdx) };
        }
        return c;
      })
    }));
  };

  const deleteCustomSection = (id) => {
    setData(prev => ({
      ...prev,
      customSections: prev.customSections.filter(c => c.id !== id)
    }));
  };

  // Clean PDF Print Trigger using isolated print frame
  const handlePrint = () => {
    const elem = document.getElementById('printable-resume-paper');
    if (!elem) {
      toast.error('Resume preview element not found.');
      return;
    }

    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'fixed';
    printFrame.style.right = '0';
    printFrame.style.bottom = '0';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = '0';
    document.body.appendChild(printFrame);

    const doc = printFrame.contentWindow.document;
    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${data.personal.fullName ? data.personal.fullName.replace(/\s+/g, '_') + '_Resume' : 'Resume'}</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Georgia:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet">
          <style>
            @page {
              size: A4 portrait;
              margin: 10mm 12mm;
            }
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            html, body {
              background: #ffffff !important;
              color: #1e293b !important;
              font-family: ${selectedTemplate === 'executive' ? "'Georgia', serif" : "'Inter', sans-serif"} !important;
              font-size: 12px;
              line-height: 1.5;
              width: 100%;
            }
            h1, h2, h3, h4, h5, h6, p, ul, li, div {
              page-break-inside: avoid;
            }
            svg {
              display: inline-block;
              vertical-align: middle;
            }
          </style>
        </head>
        <body style="padding: 10px 15px;">
          <div style="width: 100%; background: #ffffff;">
            ${elem.innerHTML}
          </div>
        </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      printFrame.contentWindow.focus();
      printFrame.contentWindow.print();
      setTimeout(() => {
        if (document.body.contains(printFrame)) {
          document.body.removeChild(printFrame);
        }
      }, 1000);
    }, 250);
  };

  // Export JSON
  const handleExportJSON = () => {
    const jsonStr = JSON.stringify({ data, template: selectedTemplate, color: accentColor.id }, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${data.personal.fullName.replace(/\s+/g, '_')}_Resume.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Resume configuration exported as JSON!');
  };

  // Import JSON
  const handleImportJSON = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target.result);
        if (parsed.data) setData(parsed.data);
        if (parsed.template) setSelectedTemplate(parsed.template);
        if (parsed.color) {
          const found = ACCENT_COLORS.find(c => c.id === parsed.color);
          if (found) setAccentColor(found);
        }
        toast.success('Resume imported successfully!');
      } catch {
        toast.error('Invalid JSON file.');
      }
    };
    reader.readAsText(file);
  };

  const resetToDefault = () => {
    if (window.confirm('Reset all resume fields to template defaults?')) {
      setData(DEFAULT_RESUME_DATA);
      setHiddenSections({
        personal: false, summary: false, experience: false, education: false,
        skills: false, projects: false, certifications: false, customSections: false
      });
      setHiddenFields({ phone: false, location: false, website: false, linkedin: false, github: false, jobTitle: false });
      toast.success('Reset to default template data.');
    }
  };

  return (
    <div className="resume-builder-container">
      {/* Fallback global print isolation */}
      <style>{`
        @media print {
          body > * {
            display: none !important;
          }
          #root {
            display: none !important;
          }
        }
      `}</style>

      {/* Active Resume Context Header Banner */}
      <div className="card animate-fade-in" style={{ padding: '14px 20px', marginBottom: 16, background: 'var(--accent-subtle)', borderColor: 'var(--border-accent)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center', justifyContent: 'space-between' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 'var(--radius-md)', background: 'var(--accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <FileText size={18} color="#ffffff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--accent)' }}>
                  Active Resume Context:
                </span>
                {activeResume?.ats_score && (
                  <span className="badge badge-blue" style={{ fontSize: 10, fontWeight: 700 }}>
                    {activeResume.ats_score}% ATS Match
                  </span>
                )}
              </div>
              <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                {activeResume?.filename || 'No resume selected'}
              </h3>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {resumesList && resumesList.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-surface)', padding: '6px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Switch Active Resume:</span>
                <select
                  value={activeResume?.id || ''}
                  onChange={(e) => {
                    if (onSelectResume) onSelectResume(e.target.value);
                  }}
                  style={{ background: 'none', border: 'none', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', cursor: 'pointer', outline: 'none' }}
                >
                  {resumesList.map(r => (
                    <option key={r.id} value={r.id}>{r.filename}</option>
                  ))}
                </select>
              </div>
            )}

            <button
              onClick={() => populateFromActiveResume(true)}
              className="btn btn-primary"
              style={{ padding: '7px 14px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Sparkles size={14} /> Auto-Fill Active Resume Data
            </button>
          </div>

        </div>
      </div>

      {/* Top Controls Header Bar */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: 20 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', justifyContent: 'space-between' }}>
          
          {/* Template Selector & Accent Picker */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                Choose Template
              </span>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {TEMPLATES.map(tmpl => (
                  <button
                    key={tmpl.id}
                    onClick={() => setSelectedTemplate(tmpl.id)}
                    className="btn"
                    style={{
                      padding: '6px 12px',
                      fontSize: 12,
                      fontWeight: selectedTemplate === tmpl.id ? 600 : 400,
                      background: selectedTemplate === tmpl.id ? 'var(--blue-50)' : 'var(--bg-surface)',
                      borderColor: selectedTemplate === tmpl.id ? 'var(--accent)' : 'var(--border)',
                      color: selectedTemplate === tmpl.id ? 'var(--accent)' : 'var(--text-primary)',
                      borderRadius: 'var(--radius-md)'
                    }}
                  >
                    {tmpl.name}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ height: 32, width: 1, background: 'var(--border)', margin: '0 4px' }} className="hide-mobile" />

            <div>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                Color Theme
              </span>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                {ACCENT_COLORS.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setAccentColor(c)}
                    title={c.label}
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      background: c.hex,
                      border: accentColor.id === c.id ? '2px solid var(--text-primary)' : '2px solid transparent',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'transform 0.15s ease',
                      transform: accentColor.id === c.id ? 'scale(1.15)' : 'scale(1)'
                    }}
                  >
                    {accentColor.id === c.id && <Check size={12} color="#ffffff" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            {activeResume && (
              <button
                onClick={populateFromActiveResume}
                className="btn btn-secondary"
                style={{ fontSize: 12, padding: '7px 12px' }}
                title="Populate builder with active resume parsed data"
              >
                <Sparkles size={14} color="var(--accent)" /> Auto-Fill Active Resume
              </button>
            )}

            <button
              onClick={handlePrint}
              className="btn btn-primary"
              style={{ fontSize: 12, padding: '7px 14px', background: accentColor.hex, borderColor: accentColor.hex }}
            >
              <Printer size={14} /> Download / Print PDF
            </button>

            <button
              onClick={handleExportJSON}
              className="btn btn-secondary"
              style={{ fontSize: 12, padding: '7px 12px' }}
              title="Save resume structure to JSON"
            >
              <Download size={14} /> Export JSON
            </button>

            <label className="btn btn-secondary" style={{ fontSize: 12, padding: '7px 12px', cursor: 'pointer', margin: 0 }}>
              <Plus size={14} /> Import JSON
              <input type="file" accept=".json" onChange={handleImportJSON} style={{ display: 'none' }} />
            </label>

            <button
              onClick={resetToDefault}
              className="btn btn-secondary"
              style={{ fontSize: 12, padding: '7px 10px' }}
              title="Reset fields to sample template"
            >
              <RefreshCw size={13} />
            </button>
          </div>
        </div>

        {/* View Toggle Bar (Editor / Preview / Split) */}
        <div style={{ display: 'flex', gap: 8, marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--border)', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            <strong>Template:</strong> {TEMPLATES.find(t => t.id === selectedTemplate)?.name} &nbsp;•&nbsp;
            <span style={{ color: 'var(--text-muted)' }}>Customize sections and fields below in real time</span>
          </div>

          <div style={{ display: 'flex', background: 'var(--gray-100)', padding: 3, borderRadius: 'var(--radius-md)', gap: 2 }}>
            <button
              onClick={() => setActiveTab('split')}
              style={{
                padding: '4px 10px', fontSize: 12, borderRadius: 'var(--radius-sm)', border: 'none',
                background: activeTab === 'split' ? 'var(--white)' : 'transparent',
                fontWeight: activeTab === 'split' ? 600 : 400,
                boxShadow: activeTab === 'split' ? 'var(--shadow-xs)' : 'none', cursor: 'pointer'
              }}
            >
              Split View
            </button>
            <button
              onClick={() => setActiveTab('editor')}
              style={{
                padding: '4px 10px', fontSize: 12, borderRadius: 'var(--radius-sm)', border: 'none',
                background: activeTab === 'editor' ? 'var(--white)' : 'transparent',
                fontWeight: activeTab === 'editor' ? 600 : 400,
                boxShadow: activeTab === 'editor' ? 'var(--shadow-xs)' : 'none', cursor: 'pointer'
              }}
            >
              Form Editor Only
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              style={{
                padding: '4px 10px', fontSize: 12, borderRadius: 'var(--radius-sm)', border: 'none',
                background: activeTab === 'preview' ? 'var(--white)' : 'transparent',
                fontWeight: activeTab === 'preview' ? 600 : 400,
                boxShadow: activeTab === 'preview' ? 'var(--shadow-xs)' : 'none', cursor: 'pointer'
              }}
            >
              Full Preview Only
            </button>
          </div>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: activeTab === 'editor' ? '1fr' : activeTab === 'preview' ? '1fr' : 'repeat(auto-fit, minmax(420px, 1fr))',
        gap: 20,
        alignItems: 'start'
      }}>
        
        {/* LEFT PANEL: Form Editor Controls */}
        {(activeTab === 'editor' || activeTab === 'split') && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Section 1: Personal Contact Info */}
            <EditorAccordion
              title="Personal & Contact Information"
              icon={User}
              isOpen={openSection === 'personal'}
              onToggle={() => setOpenSection(openSection === 'personal' ? '' : 'personal')}
              isHidden={hiddenSections.personal}
              onToggleHide={() => toggleSectionHide('personal')}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div style={{ gridColumn: 'span 2' }}>
                  <label className="field-label">Full Name</label>
                  <input
                    type="text" className="input"
                    value={data.personal.fullName}
                    onChange={e => updatePersonal('fullName', e.target.value)}
                    placeholder="e.g. John Doe"
                  />
                </div>

                {!hiddenFields.jobTitle && (
                  <div style={{ gridColumn: 'span 2' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label className="field-label">Professional Title</label>
                      <button onClick={() => toggleFieldHide('jobTitle')} className="btn-icon-danger" title="Delete job title field">
                        <Trash2 size={12} />
                      </button>
                    </div>
                    <input
                      type="text" className="input"
                      value={data.personal.jobTitle}
                      onChange={e => updatePersonal('jobTitle', e.target.value)}
                      placeholder="e.g. Senior Full Stack Engineer"
                    />
                  </div>
                )}

                <div>
                  <label className="field-label">Email Address</label>
                  <input
                    type="email" className="input"
                    value={data.personal.email}
                    onChange={e => updatePersonal('email', e.target.value)}
                    placeholder="email@domain.com"
                  />
                </div>

                {!hiddenFields.phone && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label className="field-label">Phone Number</label>
                      <button onClick={() => toggleFieldHide('phone')} className="btn-icon-danger" title="Delete phone field">
                        <Trash2 size={12} />
                      </button>
                    </div>
                    <input
                      type="text" className="input"
                      value={data.personal.phone}
                      onChange={e => updatePersonal('phone', e.target.value)}
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                )}

                {!hiddenFields.location && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label className="field-label">Location / City</label>
                      <button onClick={() => toggleFieldHide('location')} className="btn-icon-danger" title="Delete location field">
                        <Trash2 size={12} />
                      </button>
                    </div>
                    <input
                      type="text" className="input"
                      value={data.personal.location}
                      onChange={e => updatePersonal('location', e.target.value)}
                      placeholder="San Francisco, CA"
                    />
                  </div>
                )}

                {!hiddenFields.website && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label className="field-label">Portfolio / Website</label>
                      <button onClick={() => toggleFieldHide('website')} className="btn-icon-danger" title="Delete website field">
                        <Trash2 size={12} />
                      </button>
                    </div>
                    <input
                      type="text" className="input"
                      value={data.personal.website}
                      onChange={e => updatePersonal('website', e.target.value)}
                      placeholder="myportfolio.dev"
                    />
                  </div>
                )}

                {!hiddenFields.linkedin && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label className="field-label">LinkedIn Profile</label>
                      <button onClick={() => toggleFieldHide('linkedin')} className="btn-icon-danger" title="Delete linkedin field">
                        <Trash2 size={12} />
                      </button>
                    </div>
                    <input
                      type="text" className="input"
                      value={data.personal.linkedin}
                      onChange={e => updatePersonal('linkedin', e.target.value)}
                      placeholder="linkedin.com/in/username"
                    />
                  </div>
                )}

                {!hiddenFields.github && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label className="field-label">GitHub Profile</label>
                      <button onClick={() => toggleFieldHide('github')} className="btn-icon-danger" title="Delete github field">
                        <Trash2 size={12} />
                      </button>
                    </div>
                    <input
                      type="text" className="input"
                      value={data.personal.github}
                      onChange={e => updatePersonal('github', e.target.value)}
                      placeholder="github.com/username"
                    />
                  </div>
                )}
              </div>

              {/* Custom contact fields */}
              {(data.personal.customFields || []).length > 0 && (
                <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px dashed var(--border)' }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Custom Contact Fields</span>
                  {(data.personal.customFields || []).map(cf => (
                    <div key={cf.id} style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center' }}>
                      <input
                        type="text" className="input" style={{ width: '35%' }}
                        value={cf.label}
                        onChange={e => updateCustomContactField(cf.id, 'label', e.target.value)}
                        placeholder="Label"
                      />
                      <input
                        type="text" className="input" style={{ flex: 1 }}
                        value={cf.value}
                        onChange={e => updateCustomContactField(cf.id, 'value', e.target.value)}
                        placeholder="Value / URL"
                      />
                      <button onClick={() => deleteCustomContactField(cf.id)} className="btn-icon-danger" title="Delete custom field">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Button to add extra custom field */}
              <div style={{ marginTop: 12, display: 'flex', gap: 10 }}>
                <button onClick={addCustomContactField} className="btn btn-secondary" style={{ fontSize: 12, width: '100%' }}>
                  <Plus size={13} /> Add Custom Contact Field
                </button>

                {(hiddenFields.phone || hiddenFields.location || hiddenFields.website || hiddenFields.linkedin || hiddenFields.github || hiddenFields.jobTitle) && (
                  <button
                    onClick={() => setHiddenFields({ phone: false, location: false, website: false, linkedin: false, github: false, jobTitle: false })}
                    className="btn btn-secondary" style={{ fontSize: 12, whiteSpace: 'nowrap' }}
                  >
                    Restore Deleted Fields
                  </button>
                )}
              </div>
            </EditorAccordion>

            {/* Section 2: Professional Summary */}
            <EditorAccordion
              title="Professional Summary"
              icon={FileText}
              isOpen={openSection === 'summary'}
              onToggle={() => setOpenSection(openSection === 'summary' ? '' : 'summary')}
              isHidden={hiddenSections.summary}
              onToggleHide={() => toggleSectionHide('summary')}
            >
              <div>
                <label className="field-label">Summary / Objective Statement</label>
                <textarea
                  className="input"
                  rows={4}
                  value={data.summary}
                  onChange={e => setData(prev => ({ ...prev, summary: e.target.value }))}
                  placeholder="Summarize your experience, strengths, and career objective..."
                />
              </div>
            </EditorAccordion>

            {/* Section 3: Work Experience */}
            <EditorAccordion
              title={`Work Experience (${data.experience.length})`}
              icon={Briefcase}
              isOpen={openSection === 'experience'}
              onToggle={() => setOpenSection(openSection === 'experience' ? '' : 'experience')}
              isHidden={hiddenSections.experience}
              onToggleHide={() => toggleSectionHide('experience')}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {data.experience.map((exp, idx) => (
                  <div key={exp.id} style={{ padding: 12, borderRadius: 'var(--radius-md)', background: 'var(--gray-50)', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--accent)' }}>Experience #{idx + 1}</span>
                      <button onClick={() => deleteExperience(exp.id)} className="btn-icon-danger" title="Delete job experience">
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <div>
                        <label className="field-label">Company</label>
                        <input
                          type="text" className="input"
                          value={exp.company}
                          onChange={e => updateExperience(exp.id, 'company', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="field-label">Job Title / Role</label>
                        <input
                          type="text" className="input"
                          value={exp.position}
                          onChange={e => updateExperience(exp.id, 'position', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="field-label">Location</label>
                        <input
                          type="text" className="input"
                          value={exp.location}
                          onChange={e => updateExperience(exp.id, 'location', e.target.value)}
                        />
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <div style={{ flex: 1 }}>
                          <label className="field-label">Start Date</label>
                          <input
                            type="text" className="input"
                            value={exp.startDate}
                            onChange={e => updateExperience(exp.id, 'startDate', e.target.value)}
                          />
                        </div>
                        <div style={{ flex: 1 }}>
                          <label className="field-label">End Date</label>
                          <input
                            type="text" className="input"
                            value={exp.endDate}
                            onChange={e => updateExperience(exp.id, 'endDate', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Bullet Points */}
                    <div style={{ marginTop: 10 }}>
                      <label className="field-label">Key Responsibilities / Bullet Points</label>
                      {(exp.highlights || []).map((hl, hIdx) => (
                        <div key={hIdx} style={{ display: 'flex', gap: 6, marginBottom: 6, alignItems: 'center' }}>
                          <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>•</span>
                          <input
                            type="text" className="input" style={{ flex: 1 }}
                            value={hl}
                            onChange={e => updateExpHighlight(exp.id, hIdx, e.target.value)}
                          />
                          <button onClick={() => deleteExpHighlight(exp.id, hIdx)} className="btn-icon-danger" title="Delete bullet line">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))}
                      <button onClick={() => addExpHighlight(exp.id)} className="btn btn-secondary" style={{ fontSize: 11, padding: '4px 8px', marginTop: 4 }}>
                        <Plus size={12} /> Add Bullet Point
                      </button>
                    </div>
                  </div>
                ))}

                <button onClick={addExperience} className="btn btn-secondary" style={{ fontSize: 12 }}>
                  <Plus size={14} /> Add Experience Entry
                </button>
              </div>
            </EditorAccordion>

            {/* Section 4: Education */}
            <EditorAccordion
              title={`Education (${data.education.length})`}
              icon={GraduationCap}
              isOpen={openSection === 'education'}
              onToggle={() => setOpenSection(openSection === 'education' ? '' : 'education')}
              isHidden={hiddenSections.education}
              onToggleHide={() => toggleSectionHide('education')}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {data.education.map((edu, idx) => (
                  <div key={edu.id} style={{ padding: 12, borderRadius: 'var(--radius-md)', background: 'var(--gray-50)', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--accent)' }}>Education #{idx + 1}</span>
                      <button onClick={() => deleteEducation(edu.id)} className="btn-icon-danger" title="Delete education entry">
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <div style={{ gridColumn: 'span 2' }}>
                        <label className="field-label">Institution / School</label>
                        <input
                          type="text" className="input"
                          value={edu.institution}
                          onChange={e => updateEducation(edu.id, 'institution', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="field-label">Degree / Field of Study</label>
                        <input
                          type="text" className="input"
                          value={edu.degree}
                          onChange={e => updateEducation(edu.id, 'degree', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="field-label">Location</label>
                        <input
                          type="text" className="input"
                          value={edu.location}
                          onChange={e => updateEducation(edu.id, 'location', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="field-label">Dates (e.g. 2016 - 2020)</label>
                        <input
                          type="text" className="input"
                          value={`${edu.startDate}${edu.endDate ? ' - ' + edu.endDate : ''}`}
                          onChange={e => {
                            const parts = e.target.value.split('-');
                            updateEducation(edu.id, 'startDate', parts[0]?.trim() || '');
                            updateEducation(edu.id, 'endDate', parts[1]?.trim() || '');
                          }}
                        />
                      </div>
                      <div>
                        <label className="field-label">GPA / Honors (Optional)</label>
                        <input
                          type="text" className="input"
                          value={edu.gpa}
                          onChange={e => updateEducation(edu.id, 'gpa', e.target.value)}
                          placeholder="e.g. 3.9 GPA"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <button onClick={addEducation} className="btn btn-secondary" style={{ fontSize: 12 }}>
                  <Plus size={14} /> Add Education Entry
                </button>
              </div>
            </EditorAccordion>

            {/* Section 5: Skills */}
            <EditorAccordion
              title={`Skills & Technical Competencies`}
              icon={Code}
              isOpen={openSection === 'skills'}
              onToggle={() => setOpenSection(openSection === 'skills' ? '' : 'skills')}
              isHidden={hiddenSections.skills}
              onToggleHide={() => toggleSectionHide('skills')}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {data.skills.map((cat, catIdx) => (
                  <div key={catIdx} style={{ padding: 12, borderRadius: 'var(--radius-md)', background: 'var(--gray-50)', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <input
                        type="text" className="input" style={{ width: '60%', fontWeight: 600 }}
                        value={cat.category}
                        onChange={e => updateSkillCategoryName(catIdx, e.target.value)}
                      />
                      <button onClick={() => deleteSkillCategory(catIdx)} className="btn-icon-danger" title="Delete skill group">
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                      {cat.items.map((item, itemIdx) => (
                        <span key={itemIdx} className="badge badge-gray" style={{ gap: 4, paddingRight: 6 }}>
                          {item}
                          <button onClick={() => deleteSkillItem(catIdx, itemIdx)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', color: 'var(--text-muted)' }}>
                            ×
                          </button>
                        </span>
                      ))}
                    </div>

                    {/* Quick add skill item */}
                    <div style={{ display: 'flex', gap: 6 }}>
                      <input
                        type="text" className="input" style={{ fontSize: 12 }}
                        placeholder="Add skill tag (press Enter)"
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addSkillItem(catIdx, e.target.value);
                            e.target.value = '';
                          }
                        }}
                      />
                      <button
                        onClick={(e) => {
                          const input = e.currentTarget.previousElementSibling;
                          addSkillItem(catIdx, input.value);
                          input.value = '';
                        }}
                        className="btn btn-secondary" style={{ fontSize: 11, padding: '0 10px' }}
                      >
                        Add
                      </button>
                    </div>
                  </div>
                ))}

                <button onClick={addSkillCategory} className="btn btn-secondary" style={{ fontSize: 12 }}>
                  <Plus size={14} /> Add Skill Category Group
                </button>
              </div>
            </EditorAccordion>

            {/* Section 6: Projects */}
            <EditorAccordion
              title={`Key Projects (${data.projects.length})`}
              icon={FolderGit2}
              isOpen={openSection === 'projects'}
              onToggle={() => setOpenSection(openSection === 'projects' ? '' : 'projects')}
              isHidden={hiddenSections.projects}
              onToggleHide={() => toggleSectionHide('projects')}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {data.projects.map((proj, idx) => (
                  <div key={proj.id} style={{ padding: 12, borderRadius: 'var(--radius-md)', background: 'var(--gray-50)', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--accent)' }}>Project #{idx + 1}</span>
                      <button onClick={() => deleteProject(proj.id)} className="btn-icon-danger" title="Delete project entry">
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <div>
                        <label className="field-label">Project Name</label>
                        <input
                          type="text" className="input"
                          value={proj.title}
                          onChange={e => updateProject(proj.id, 'title', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="field-label">Subtitle / Technologies</label>
                        <input
                          type="text" className="input"
                          value={proj.subtitle}
                          onChange={e => updateProject(proj.id, 'subtitle', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="field-label">Link / GitHub URL</label>
                        <input
                          type="text" className="input"
                          value={proj.link}
                          onChange={e => updateProject(proj.id, 'link', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="field-label">Date Range</label>
                        <input
                          type="text" className="input"
                          value={proj.date}
                          onChange={e => updateProject(proj.id, 'date', e.target.value)}
                        />
                      </div>
                      <div style={{ gridColumn: 'span 2' }}>
                        <label className="field-label">Project Description</label>
                        <textarea
                          className="input" rows={2}
                          value={proj.description}
                          onChange={e => updateProject(proj.id, 'description', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <button onClick={addProject} className="btn btn-secondary" style={{ fontSize: 12 }}>
                  <Plus size={14} /> Add Project Entry
                </button>
              </div>
            </EditorAccordion>

            {/* Section 7: Certifications */}
            <EditorAccordion
              title={`Certifications & Licenses (${data.certifications.length})`}
              icon={Award}
              isOpen={openSection === 'certifications'}
              onToggle={() => setOpenSection(openSection === 'certifications' ? '' : 'certifications')}
              isHidden={hiddenSections.certifications}
              onToggleHide={() => toggleSectionHide('certifications')}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {data.certifications.map((cert) => (
                  <div key={cert.id} style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr auto', gap: 8, alignItems: 'center' }}>
                    <input
                      type="text" className="input" placeholder="Certification Name"
                      value={cert.name} onChange={e => updateCertification(cert.id, 'name', e.target.value)}
                    />
                    <input
                      type="text" className="input" placeholder="Issuer"
                      value={cert.issuer} onChange={e => updateCertification(cert.id, 'issuer', e.target.value)}
                    />
                    <input
                      type="text" className="input" placeholder="Year"
                      value={cert.date} onChange={e => updateCertification(cert.id, 'date', e.target.value)}
                    />
                    <button onClick={() => deleteCertification(cert.id)} className="btn-icon-danger" title="Delete certification">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                <button onClick={addCertification} className="btn btn-secondary" style={{ fontSize: 12 }}>
                  <Plus size={14} /> Add Certification
                </button>
              </div>
            </EditorAccordion>

            {/* Section 8: Custom Sections */}
            <EditorAccordion
              title={`Custom Sections (${(data.customSections || []).length})`}
              icon={Layers}
              isOpen={openSection === 'custom'}
              onToggle={() => setOpenSection(openSection === 'custom' ? '' : 'custom')}
              isHidden={hiddenSections.customSections}
              onToggleHide={() => toggleSectionHide('customSections')}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {(data.customSections || []).map((sec) => (
                  <div key={sec.id} style={{ padding: 12, borderRadius: 'var(--radius-md)', background: 'var(--gray-50)', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <input
                        type="text" className="input" style={{ width: '70%', fontWeight: 600 }}
                        value={sec.title}
                        onChange={e => updateCustomSection(sec.id, 'title', e.target.value)}
                        placeholder="Section Title (e.g. Languages, Hobbies)"
                      />
                      <button onClick={() => deleteCustomSection(sec.id)} className="btn-icon-danger" title="Delete entire section">
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
                      {sec.items.map((item, itemIdx) => (
                        <div key={itemIdx} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <input
                            type="text" className="input" style={{ flex: 1, fontSize: 12 }}
                            value={item}
                            onChange={e => {
                              const newItems = [...sec.items];
                              newItems[itemIdx] = e.target.value;
                              updateCustomSection(sec.id, 'items', newItems);
                            }}
                          />
                          <button onClick={() => deleteCustomSectionItem(sec.id, itemIdx)} className="btn-icon-danger" title="Delete line">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => addCustomSectionItem(sec.id, 'New detail line')}
                      className="btn btn-secondary" style={{ fontSize: 11, padding: '4px 8px' }}
                    >
                      <Plus size={12} /> Add Line Item
                    </button>
                  </div>
                ))}

                <button onClick={addCustomSection} className="btn btn-secondary" style={{ fontSize: 12 }}>
                  <Plus size={14} /> Add Custom Section
                </button>
              </div>
            </EditorAccordion>

          </div>
        )}

        {/* RIGHT PANEL: Live Resume Document Preview */}
        {(activeTab === 'preview' || activeTab === 'split') && (
          <div style={{ position: 'sticky', top: 20 }}>
            <div
              id="printable-resume-paper"
              ref={printRef}
              style={{
                background: '#ffffff',
                color: '#1e293b',
                borderRadius: 4,
                boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)',
                padding: '36px 40px',
                minHeight: '800px',
                fontFamily: selectedTemplate === 'executive' ? "'Georgia', serif" : "'Inter', sans-serif",
                transition: 'all 0.2s ease'
              }}
            >
              {/* Template Render Logic */}
              {selectedTemplate === 'modern' && (
                <RenderModernTemplate
                  data={data}
                  accent={accentColor.hex}
                  hiddenSections={hiddenSections}
                  hiddenFields={hiddenFields}
                />
              )}

              {selectedTemplate === 'executive' && (
                <RenderExecutiveTemplate
                  data={data}
                  accent={accentColor.hex}
                  hiddenSections={hiddenSections}
                  hiddenFields={hiddenFields}
                />
              )}

              {selectedTemplate === 'creative' && (
                <RenderCreativeTemplate
                  data={data}
                  accent={accentColor.hex}
                  hiddenSections={hiddenSections}
                  hiddenFields={hiddenFields}
                />
              )}

              {selectedTemplate === 'minimal' && (
                <RenderMinimalTemplate
                  data={data}
                  accent={accentColor.hex}
                  hiddenSections={hiddenSections}
                  hiddenFields={hiddenFields}
                />
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// ─── Accordion Wrapper for Form Sections ────────────────────────────
function EditorAccordion({ title, icon: Icon, isOpen, onToggle, isHidden, onToggleHide, children }) {
  return (
    <div className="card" style={{ padding: 0, opacity: isHidden ? 0.6 : 1, transition: 'all 0.2s ease' }}>
      <div
        style={{
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          borderBottom: isOpen ? '1px solid var(--border)' : 'none',
          background: isOpen ? 'var(--gray-50)' : 'transparent',
          borderTopLeftRadius: 'var(--radius-lg)',
          borderTopRightRadius: 'var(--radius-lg)'
        }}
        onClick={onToggle}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Icon size={16} color={isHidden ? 'var(--text-muted)' : 'var(--accent)'} />
          <span style={{ fontWeight: 600, fontSize: 13, textDecoration: isHidden ? 'line-through' : 'none' }}>
            {title}
          </span>
          {isHidden && <span className="badge badge-amber" style={{ fontSize: 10 }}>Hidden from Preview</span>}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }} onClick={e => e.stopPropagation()}>
          <button
            onClick={onToggleHide}
            className="btn-icon-secondary"
            title={isHidden ? 'Show section in preview' : 'Hide/delete section from preview'}
          >
            {isHidden ? <EyeOff size={14} color="var(--amber-500)" /> : <Eye size={14} />}
          </button>
          <button onClick={onToggle} className="btn-icon-secondary">
            {isOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
        </div>
      </div>

      {isOpen && <div style={{ padding: 16 }}>{children}</div>}
    </div>
  );
}

// ─── 1. MODERN CLEAN TEMPLATE ─────────────────────────────────────────
function RenderModernTemplate({ data, accent, hiddenSections, hiddenFields }) {
  const { personal, summary, experience, education, skills, projects, certifications, customSections } = data;

  return (
    <div>
      {/* Header */}
      {!hiddenSections.personal && (
        <div style={{ borderBottom: `3px solid ${accent}`, paddingBottom: 16, marginBottom: 20 }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
            {personal.fullName}
          </h1>
          {!hiddenFields.jobTitle && personal.jobTitle && (
            <p style={{ fontSize: 15, fontWeight: 600, color: accent, marginTop: 3, marginBottom: 10 }}>
              {personal.jobTitle}
            </p>
          )}

          {/* Contact Bar */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px', fontSize: 12, color: '#475467' }}>
            {personal.email && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <Mail size={12} color={accent} /> {personal.email}
              </span>
            )}
            {!hiddenFields.phone && personal.phone && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <Phone size={12} color={accent} /> {personal.phone}
              </span>
            )}
            {!hiddenFields.location && personal.location && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <MapPin size={12} color={accent} /> {personal.location}
              </span>
            )}
            {!hiddenFields.website && personal.website && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <Globe size={12} color={accent} /> {personal.website}
              </span>
            )}
            {!hiddenFields.linkedin && personal.linkedin && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <LinkedinIcon size={12} color={accent} /> {personal.linkedin}
              </span>
            )}
            {!hiddenFields.github && personal.github && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <GithubIcon size={12} color={accent} /> {personal.github}
              </span>
            )}
            {(personal.customFields || []).map(cf => cf.value && (
              <span key={cf.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <strong>{cf.label}:</strong> {cf.value}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Summary */}
      {!hiddenSections.summary && summary && (
        <div style={{ marginBottom: 20 }}>
          <SectionHeader title="Professional Summary" accent={accent} />
          <p style={{ fontSize: 13, lineHeight: 1.6, color: '#334155', margin: 0 }}>{summary}</p>
        </div>
      )}

      {/* Work Experience */}
      {!hiddenSections.experience && experience.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <SectionHeader title="Work Experience" accent={accent} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {experience.map(exp => (
              <div key={exp.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{exp.position}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: accent }}>
                    {exp.startDate} – {exp.endDate}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#64748b', fontStyle: 'italic', marginBottom: 6 }}>
                  <span>{exp.company}</span>
                  <span>{exp.location}</span>
                </div>
                {exp.highlights && exp.highlights.length > 0 && (
                  <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12.5, lineHeight: 1.5, color: '#334155' }}>
                    {exp.highlights.map((h, i) => h && <li key={i} style={{ marginBottom: 3 }}>{h}</li>)}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Education */}
      {!hiddenSections.education && education.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <SectionHeader title="Education" accent={accent} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {education.map(edu => (
              <div key={edu.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontSize: 13.5, fontWeight: 700, color: '#0f172a' }}>{edu.degree}</span>
                  <span style={{ fontSize: 12, color: '#64748b' }}>{edu.startDate} – {edu.endDate}</span>
                </div>
                <div style={{ fontSize: 12, color: '#475467' }}>
                  {edu.institution}{edu.location ? `, ${edu.location}` : ''}
                  {edu.gpa && <span style={{ marginLeft: 8, fontWeight: 600, color: accent }}>GPA: {edu.gpa}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skills */}
      {!hiddenSections.skills && skills.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <SectionHeader title="Skills & Core Competencies" accent={accent} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {skills.map((cat, idx) => (
              <div key={idx} style={{ fontSize: 12.5 }}>
                <strong style={{ color: '#0f172a' }}>{cat.category}: </strong>
                <span style={{ color: '#475467' }}>{(cat.items || []).join(', ')}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Projects */}
      {!hiddenSections.projects && projects.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <SectionHeader title="Key Projects" accent={accent} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {projects.map(p => (
              <div key={p.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontSize: 13.5, fontWeight: 700, color: '#0f172a' }}>
                    {p.title} <span style={{ fontWeight: 400, fontSize: 12, color: '#64748b' }}>| {p.subtitle}</span>
                  </span>
                  <span style={{ fontSize: 11.5, color: '#64748b' }}>{p.date}</span>
                </div>
                {p.description && <p style={{ fontSize: 12, color: '#334155', margin: '2px 0 0', lineHeight: 1.45 }}>{p.description}</p>}
                {p.link && <div style={{ fontSize: 11, color: accent, marginTop: 2 }}>{p.link}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Certifications */}
      {!hiddenSections.certifications && certifications.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <SectionHeader title="Certifications" accent={accent} />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 20px', fontSize: 12 }}>
            {certifications.map(c => (
              <div key={c.id}>
                <strong style={{ color: '#0f172a' }}>{c.name}</strong> – <span style={{ color: '#64748b' }}>{c.issuer} ({c.date})</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Custom Sections */}
      {!hiddenSections.customSections && (customSections || []).length > 0 && (
        <div>
          {customSections.map(sec => (
            <div key={sec.id} style={{ marginBottom: 16 }}>
              <SectionHeader title={sec.title} accent={accent} />
              <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12.5, color: '#334155' }}>
                {(sec.items || []).map((it, i) => <li key={i}>{it}</li>)}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── 2. EXECUTIVE FORMAL TEMPLATE ────────────────────────────────────
function RenderExecutiveTemplate({ data, accent, hiddenSections, hiddenFields }) {
  const { personal, summary, experience, education, skills, projects, certifications, customSections } = data;

  return (
    <div style={{ textAlign: 'left', fontFamily: "'Georgia', 'Times New Roman', serif" }}>
      {/* Header */}
      {!hiddenSections.personal && (
        <div style={{ textAlign: 'center', borderBottom: `1px solid #cbd5e1`, paddingBottom: 16, marginBottom: 20 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#0f172a', margin: 0 }}>
            {personal.fullName}
          </h1>
          {!hiddenFields.jobTitle && personal.jobTitle && (
            <div style={{ fontSize: 14, fontStyle: 'italic', color: accent, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {personal.jobTitle}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '6px 16px', fontSize: 12, color: '#475467', marginTop: 10 }}>
            {personal.email && <span>{personal.email}</span>}
            {!hiddenFields.phone && personal.phone && <span>• &nbsp;{personal.phone}</span>}
            {!hiddenFields.location && personal.location && <span>• &nbsp;{personal.location}</span>}
            {!hiddenFields.linkedin && personal.linkedin && <span>• &nbsp;{personal.linkedin}</span>}
            {!hiddenFields.website && personal.website && <span>• &nbsp;{personal.website}</span>}
          </div>
        </div>
      )}

      {/* Summary */}
      {!hiddenSections.summary && summary && (
        <div style={{ marginBottom: 20 }}>
          <ExecutiveHeader title="Executive Summary" accent={accent} />
          <p style={{ fontSize: 13, lineHeight: 1.6, color: '#1e293b', fontStyle: 'italic' }}>{summary}</p>
        </div>
      )}

      {/* Experience */}
      {!hiddenSections.experience && experience.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <ExecutiveHeader title="Professional Experience" accent={accent} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {experience.map(exp => (
              <div key={exp.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <strong style={{ fontSize: 14, color: '#0f172a' }}>{exp.position}</strong>
                  <span style={{ fontSize: 12, fontWeight: 600, color: accent }}>{exp.startDate} – {exp.endDate}</span>
                </div>
                <div style={{ fontSize: 12.5, fontStyle: 'italic', color: '#475467', marginBottom: 6 }}>
                  {exp.company}{exp.location ? `, ${exp.location}` : ''}
                </div>
                {exp.highlights && (
                  <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, lineHeight: 1.5, color: '#334155' }}>
                    {exp.highlights.map((h, i) => h && <li key={i} style={{ marginBottom: 2 }}>{h}</li>)}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Education */}
      {!hiddenSections.education && education.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <ExecutiveHeader title="Education & Credentials" accent={accent} />
          {education.map(edu => (
            <div key={edu.id} style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <strong style={{ color: '#0f172a' }}>{edu.institution}</strong>
                <span style={{ fontSize: 12, color: '#64748b' }}>{edu.startDate} – {edu.endDate}</span>
              </div>
              <div style={{ fontSize: 12, fontStyle: 'italic', color: '#334155' }}>
                {edu.degree} {edu.gpa ? `(GPA: ${edu.gpa})` : ''}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Skills */}
      {!hiddenSections.skills && skills.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <ExecutiveHeader title="Areas of Expertise" accent={accent} />
          <div style={{ fontSize: 12.5, lineHeight: 1.6, color: '#1e293b' }}>
            {skills.map((s, i) => (
              <div key={i}>
                <strong>{s.category}:</strong> {(s.items || []).join(' • ')}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── 3. TECH SIDEBAR TEMPLATE ────────────────────────────────────────
function RenderCreativeTemplate({ data, accent, hiddenSections, hiddenFields }) {
  const { personal, summary, experience, education, skills, projects, certifications, customSections } = data;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 24 }}>
      {/* LEFT SIDEBAR */}
      <div style={{ background: '#f8fafc', padding: 16, borderRadius: 8, borderRight: `3px solid ${accent}` }}>
        {!hiddenSections.personal && (
          <div style={{ marginBottom: 20 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', margin: 0 }}>{personal.fullName}</h2>
            {!hiddenFields.jobTitle && <div style={{ fontSize: 12, fontWeight: 600, color: accent, marginTop: 4 }}>{personal.jobTitle}</div>}

            <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8, fontSize: 11.5, color: '#475467', wordBreak: 'break-all' }}>
              {personal.email && <div>✉ {personal.email}</div>}
              {!hiddenFields.phone && personal.phone && <div>📞 {personal.phone}</div>}
              {!hiddenFields.location && personal.location && <div>📍 {personal.location}</div>}
              {!hiddenFields.website && personal.website && <div>🌐 {personal.website}</div>}
              {!hiddenFields.linkedin && personal.linkedin && <div>🔗 {personal.linkedin}</div>}
              {!hiddenFields.github && personal.github && <div>💻 {personal.github}</div>}
            </div>
          </div>
        )}

        {/* Skills in Sidebar */}
        {!hiddenSections.skills && skills.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <SidebarHeader title="SKILLS" accent={accent} />
            {skills.map((cat, idx) => (
              <div key={idx} style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#0f172a', textTransform: 'uppercase', marginBottom: 4 }}>{cat.category}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {(cat.items || []).map((sk, sIdx) => (
                    <span key={sIdx} style={{ fontSize: 10.5, background: '#e2e8f0', padding: '2px 6px', borderRadius: 4, color: '#334155' }}>
                      {sk}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Education in Sidebar */}
        {!hiddenSections.education && education.length > 0 && (
          <div>
            <SidebarHeader title="EDUCATION" accent={accent} />
            {education.map(edu => (
              <div key={edu.id} style={{ marginBottom: 10, fontSize: 11 }}>
                <strong style={{ color: '#0f172a', display: 'block' }}>{edu.degree}</strong>
                <span style={{ color: '#64748b' }}>{edu.institution}</span>
                <div style={{ color: accent, fontSize: 10 }}>{edu.startDate} – {edu.endDate}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* RIGHT MAIN CONTENT */}
      <div>
        {!hiddenSections.summary && summary && (
          <div style={{ marginBottom: 20 }}>
            <SectionHeader title="ABOUT ME" accent={accent} />
            <p style={{ fontSize: 12.5, lineHeight: 1.5, color: '#334155', margin: 0 }}>{summary}</p>
          </div>
        )}

        {!hiddenSections.experience && experience.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <SectionHeader title="EXPERIENCE" accent={accent} />
            {experience.map(exp => (
              <div key={exp.id} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                  <span>{exp.position}</span>
                  <span style={{ color: accent, fontSize: 11.5 }}>{exp.startDate} – {exp.endDate}</span>
                </div>
                <div style={{ fontSize: 12, color: '#64748b', fontStyle: 'italic', marginBottom: 4 }}>{exp.company}</div>
                <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, lineHeight: 1.45, color: '#334155' }}>
                  {(exp.highlights || []).map((h, i) => <li key={i}>{h}</li>)}
                </ul>
              </div>
            ))}
          </div>
        )}

        {!hiddenSections.projects && projects.length > 0 && (
          <div>
            <SectionHeader title="PROJECTS" accent={accent} />
            {projects.map(p => (
              <div key={p.id} style={{ marginBottom: 10 }}>
                <strong style={{ fontSize: 12.5, color: '#0f172a' }}>{p.title}</strong>
                <p style={{ fontSize: 12, color: '#475467', margin: '2px 0 0' }}>{p.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── 4. MINIMALIST COMPACT TEMPLATE ──────────────────────────────────
function RenderMinimalTemplate({ data, accent, hiddenSections, hiddenFields }) {
  const { personal, summary, experience, education, skills } = data;

  return (
    <div>
      {!hiddenSections.personal && (
        <div style={{ textAlign: 'center', marginBottom: 18 }}>
          <h1 style={{ fontSize: 24, fontWeight: 600, color: '#0f172a', margin: 0 }}>{personal.fullName}</h1>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
            {[personal.email, !hiddenFields.phone && personal.phone, !hiddenFields.location && personal.location, !hiddenFields.website && personal.website].filter(Boolean).join('  |  ')}
          </div>
        </div>
      )}

      {!hiddenSections.summary && summary && (
        <p style={{ fontSize: 12, lineHeight: 1.5, color: '#334155', textAlign: 'center', marginBottom: 16, fontStyle: 'italic' }}>
          {summary}
        </p>
      )}

      {!hiddenSections.experience && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: accent, borderBottom: '1px solid #e2e8f0', paddingBottom: 2, marginBottom: 8 }}>
            Experience
          </div>
          {experience.map(exp => (
            <div key={exp.id} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 600 }}>
                <span>{exp.position} — {exp.company}</span>
                <span style={{ color: '#64748b', fontWeight: 400 }}>{exp.startDate} - {exp.endDate}</span>
              </div>
              <ul style={{ margin: '3px 0 0', paddingLeft: 16, fontSize: 11.5, color: '#475467' }}>
                {(exp.highlights || []).map((h, i) => <li key={i}>{h}</li>)}
              </ul>
            </div>
          ))}
        </div>
      )}

      {!hiddenSections.education && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: accent, borderBottom: '1px solid #e2e8f0', paddingBottom: 2, marginBottom: 8 }}>
            Education
          </div>
          {education.map(edu => (
            <div key={edu.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5 }}>
              <span><strong>{edu.degree}</strong>, {edu.institution}</span>
              <span style={{ color: '#64748b' }}>{edu.startDate} - {edu.endDate}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Header Helpers ──────────────────────────────────────────────────
function SectionHeader({ title, accent }) {
  return (
    <div style={{
      fontSize: 12,
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.06em',
      color: accent,
      borderBottom: '1.5px solid #e2e8f0',
      paddingBottom: 3,
      marginBottom: 10
    }}>
      {title}
    </div>
  );
}

function ExecutiveHeader({ title, accent }) {
  return (
    <div style={{
      fontSize: 13,
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.1em',
      color: '#0f172a',
      borderBottom: `1px solid ${accent}`,
      paddingBottom: 2,
      marginBottom: 10
    }}>
      {title}
    </div>
  );
}

function SidebarHeader({ title, accent }) {
  return (
    <div style={{
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: '0.08em',
      color: accent,
      borderBottom: '1px solid #cbd5e1',
      paddingBottom: 2,
      marginBottom: 8
    }}>
      {title}
    </div>
  );
}
