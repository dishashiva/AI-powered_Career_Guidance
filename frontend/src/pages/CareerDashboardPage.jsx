import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { resumesAPI } from '../api/client';
import ResumeBuilder from '../components/ResumeBuilder';
import AIInterviewPrep from '../components/AIInterviewPrep';
import { getActiveResumeId, setActiveResumeId } from '../utils/activeResume';
import {
  RadialBarChart, RadialBar, ResponsiveContainer,
} from 'recharts';
import {
  Target, TrendingUp, AlertTriangle, CheckCircle, Brain, DollarSign,
  Download, Trash2, FileText, Clock, ChevronRight, Eye,
  ChevronDown, Sparkles, Copy, Check, Briefcase, BookOpen, Layers,
  Zap, FileCheck, Award, HelpCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

const priorityColor = { high: 'var(--red-500)', medium: 'var(--amber-500)', low: 'var(--blue-500)' };
const priorityBadge = { high: 'badge-red', medium: 'badge-amber', low: 'badge-blue' };

function fmtDate(str) {
  if (!str) return '—';
  return new Date(str).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

function atsColor(score) {
  if (score >= 70) return 'var(--green-500)';
  if (score >= 50) return 'var(--amber-500)';
  return 'var(--red-500)';
}

/* ─── Sample Job Description Templates ──────────────────────────── */
const SAMPLE_JDS = [
  {
    title: 'Senior Full Stack Engineer',
    jd: 'We are seeking a Senior Full Stack Engineer with expertise in Python, React, PostgreSQL, Docker, and AWS. Responsibilities include building scalable RESTful APIs, designing reactive frontend interfaces, setting up CI/CD automation pipelines, and optimizing database performance.'
  },
  {
    title: 'Data Scientist & AI Engineer',
    jd: 'Looking for a Data Scientist / AI Engineer proficient in Python, PyTorch, TensorFlow, Pandas, SQL, and LLM orchestration. You will design machine learning models, build data pipelines, analyze large datasets, and integrate LLM APIs into production applications.'
  },
  {
    title: 'Cloud & DevOps Engineer',
    jd: 'Hiring a DevOps & Cloud Infrastructure Engineer with hands-on experience in AWS, Kubernetes, Terraform, Docker, and GitHub Actions. Essential skills include CI/CD automation, system monitoring, cloud architecture, and security hardening.'
  },
  {
    title: 'Technical Product Manager',
    jd: 'Seeking a Technical Product Manager to define product roadmap, collaborate with cross-functional engineering teams, manage Agile sprints, conduct competitive market analysis, and translate business requirements into technical user stories.'
  }
];

/* ─── Resume History Panel ──────────────────────────────────────── */
function ResumeHistoryPanel({ resumes, activeId, onSwitch, onDelete, onDownload }) {
  const [open, setOpen] = useState(false);

  if (resumes.length === 0) return null;

  return (
    <div style={{ marginBottom: 20 }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)', padding: '8px 14px',
          cursor: 'pointer', fontSize: 13, fontWeight: 500,
          color: 'var(--text-secondary)', transition: 'all 0.15s',
        }}
        id="resume-history-toggle"
      >
        <FileText size={14} color="var(--accent)" />
        Resume History ({resumes.length})
        <ChevronDown
          size={14}
          style={{ marginLeft: 2, transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </button>

      {open && (
        <div className="card animate-fade-in" style={{ marginTop: 10, padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', background: 'var(--gray-50)' }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
              Your uploaded resumes
            </p>
          </div>
          <div>
            {resumes.map((r, idx) => {
              const isActive = r.id === activeId;
              return (
                <div
                  key={r.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 16px',
                    borderBottom: idx < resumes.length - 1 ? '1px solid var(--border)' : 'none',
                    background: isActive ? 'var(--accent-subtle)' : 'transparent',
                    transition: 'background 0.15s',
                  }}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: 'var(--radius-md)',
                    background: isActive ? 'var(--accent)' : 'var(--gray-100)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <FileText size={16} color={isActive ? '#fff' : 'var(--text-muted)'} />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontSize: 13, fontWeight: 600, margin: 0,
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      color: isActive ? 'var(--accent)' : 'var(--text-primary)',
                    }}>
                      {r.filename}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3 }}>
                        <Clock size={10} /> {fmtDate(r.created_at)}
                      </span>
                      {r.ats_score != null && (
                        <span style={{
                          fontSize: 11, fontWeight: 600,
                          color: atsColor(r.ats_score),
                          background: atsColor(r.ats_score) + '18',
                          padding: '1px 7px', borderRadius: 99,
                        }}>
                          ATS {r.ats_score?.toFixed(0)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                    {!isActive && (
                      <button
                        title="View analysis"
                        onClick={() => onSwitch(r.id)}
                        style={{
                          background: 'var(--accent-subtle)', border: 'none', borderRadius: 'var(--radius-sm)',
                          padding: '5px 10px', cursor: 'pointer', fontSize: 12,
                          color: 'var(--accent)', fontWeight: 500,
                          display: 'flex', alignItems: 'center', gap: 4,
                        }}
                      >
                        <Eye size={12} /> View
                      </button>
                    )}
                    {isActive && (
                      <span style={{
                        fontSize: 11, color: 'var(--accent)', fontWeight: 600,
                        padding: '5px 10px', background: 'var(--accent-subtle)',
                        borderRadius: 'var(--radius-sm)',
                      }}>
                        Active
                      </span>
                    )}

                    {r.has_file && (
                      <button
                        title="Download file"
                        onClick={() => onDownload(r.id, r.filename)}
                        style={{
                          background: 'none', border: 'none', padding: '6px',
                          cursor: 'pointer', borderRadius: 'var(--radius-sm)',
                          color: 'var(--text-muted)', display: 'flex', alignItems: 'center',
                        }}
                      >
                        <Download size={14} />
                      </button>
                    )}

                    <button
                      title="Delete resume"
                      onClick={() => onDelete(r.id, r.filename)}
                      style={{
                        background: 'none', border: 'none', padding: '6px',
                        cursor: 'pointer', borderRadius: 'var(--radius-sm)',
                        color: 'var(--text-muted)', display: 'flex', alignItems: 'center',
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Module 1 & 2: Job Description Matcher Component ───────────── */
function JdMatcherSection({ resumeId, resumeName }) {
  const [jdText, setJdText] = useState('');
  const [jdTitle, setJdTitle] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [matchResult, setMatchResult] = useState(null);

  const handleCompare = async (textToUse = null, titleToUse = null) => {
    const text = textToUse || jdText;
    const title = titleToUse || jdTitle;

    if (!text || text.trim().length < 15) {
      toast.error('Please paste or select a Job Description first');
      return;
    }

    setAnalyzing(true);
    try {
      const res = await resumesAPI.compareJd({
        resume_id: resumeId,
        job_description: text,
        job_title: title,
      });
      setMatchResult(res.data);
      toast.success('ATS Job Match analysis complete!');
    } catch {
      toast.error('Failed to analyze Job Description match');
    } finally {
      setAnalyzing(false);
    }
  };

  const selectTemplate = (item) => {
    setJdTitle(item.title);
    setJdText(item.jd);
    handleCompare(item.jd, item.title);
  };

  return (
    <div className="animate-fade-in">
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ marginBottom: 16 }}>
          <div className="flex items-center gap-2" style={{ marginBottom: 4 }}>
            <FileCheck size={18} color="var(--accent)" />
            <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>ATS Resume vs Job Description Matcher</h2>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
            Compare <strong>{resumeName}</strong> against any target job description to calculate exact match %, missing skills, and tailoring suggestions.
          </p>
        </div>

        {/* Quick Sample Templates */}
        <div style={{ marginBottom: 16 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 8 }}>
            Quick Test Templates
          </span>
          <div className="flex" style={{ flexWrap: 'wrap', gap: 8 }}>
            {SAMPLE_JDS.map((tmpl, idx) => (
              <button
                key={idx}
                onClick={() => selectTemplate(tmpl)}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: 12, gap: 6 }}
              >
                <Zap size={12} color="var(--amber-500)" />
                {tmpl.title}
              </button>
            ))}
          </div>
        </div>

        {/* JD Input */}
        <div style={{ marginBottom: 16 }}>
          <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 600 }}>Target Job Description Text</label>
            <input
              type="text"
              className="input"
              placeholder="Job Title (optional)..."
              value={jdTitle}
              onChange={(e) => setJdTitle(e.target.value)}
              style={{ maxWidth: 220, padding: '4px 10px', fontSize: 12 }}
            />
          </div>
          <textarea
            className="input"
            rows={5}
            placeholder="Paste complete Job Description text here (e.g. required skills, qualifications, responsibilities)..."
            value={jdText}
            onChange={(e) => setJdText(e.target.value)}
            style={{ width: '100%', resize: 'vertical', fontSize: 13, fontFamily: 'inherit' }}
          />
        </div>

        <button
          onClick={() => handleCompare()}
          className="btn btn-primary"
          disabled={analyzing || !jdText.trim()}
          style={{ width: '100%', justifyContent: 'center' }}
        >
          {analyzing ? (
            <><div className="spinner" style={{ width: 16, height: 16 }} /> Analyzing ATS Compatibility...</>
          ) : (
            <><Sparkles size={16} /> Calculate ATS Compatibility & Skill Gaps</>
          )}
        </button>
      </div>

      {/* Match Results Display */}
      {matchResult && (
        <div className="card animate-fade-in" style={{ border: '1px solid var(--accent-subtle)' }}>
          <div className="flex items-center justify-between" style={{ marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <span className="badge badge-violet" style={{ marginBottom: 4 }}>
                {jdTitle || 'Job Match Results'}
              </span>
              <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>
                Compatibility Score: {matchResult.match_score}%
              </h3>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span className={`badge ${matchResult.match_score >= 75 ? 'badge-green' : matchResult.match_score >= 55 ? 'badge-amber' : 'badge-red'}`} style={{ fontSize: 14, padding: '6px 14px' }}>
                {matchResult.match_score >= 75 ? 'Strong Match' : matchResult.match_score >= 55 ? 'Moderate Match' : 'Action Required'}
              </span>
            </div>
          </div>

          {/* Breakdown Grid */}
          {matchResult.ats_breakdown && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 20 }}>
              {[
                { label: 'Keywords', val: matchResult.ats_breakdown.keyword_matching || matchResult.ats_breakdown.keywords || 20 },
                { label: 'Skills Alignment', val: matchResult.ats_breakdown.skills_alignment || matchResult.ats_breakdown.skills_match || 20 },
                { label: 'Experience', val: matchResult.ats_breakdown.experience_relevance || 20 },
                { label: 'Formatting', val: matchResult.ats_breakdown.education_and_formatting || matchResult.ats_breakdown.formatting || 20 },
              ].map(({ label, val }) => (
                <div key={label} style={{ background: 'var(--gray-50)', padding: 12, borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</span>
                  <p style={{ fontSize: 16, fontWeight: 700, margin: '4px 0 0', color: 'var(--accent)' }}>{val} / 25</p>
                </div>
              ))}
            </div>
          )}

          {/* Skills Comparison */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 20 }}>
            {/* Matching Skills */}
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: 16, borderRadius: 'var(--radius-lg)' }}>
              <div className="flex items-center gap-2" style={{ marginBottom: 10 }}>
                <CheckCircle size={16} color="var(--green-600)" />
                <h4 style={{ fontSize: 14, fontWeight: 600, margin: 0, color: '#166534' }}>
                  Matching Skills ({matchResult.matching_skills?.length || 0})
                </h4>
              </div>
              <div className="flex" style={{ flexWrap: 'wrap', gap: 6 }}>
                {(matchResult.matching_skills || []).map((s, idx) => (
                  <span key={idx} className="badge badge-green">{s}</span>
                ))}
              </div>
            </div>

            {/* Missing Skills */}
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: 16, borderRadius: 'var(--radius-lg)' }}>
              <div className="flex items-center gap-2" style={{ marginBottom: 10 }}>
                <AlertTriangle size={16} color="var(--red-500)" />
                <h4 style={{ fontSize: 14, fontWeight: 600, margin: 0, color: '#991b1b' }}>
                  Missing Skills ({matchResult.missing_skills?.length || 0})
                </h4>
              </div>
              <div className="flex" style={{ flexWrap: 'wrap', gap: 6 }}>
                {(matchResult.missing_skills || []).map((s, idx) => (
                  <span key={idx} className="badge badge-red">{s}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Recommendations to Tailor Resume */}
          {matchResult.resume_improvements && matchResult.resume_improvements.length > 0 && (
            <div>
              <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Sparkles size={15} color="var(--accent)" /> Tailoring Recommendations for this Job
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {matchResult.resume_improvements.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, background: 'var(--gray-50)', padding: '10px 12px', borderRadius: 'var(--radius-md)' }}>
                    <ChevronRight size={14} color="var(--accent)" style={{ marginTop: 2, flexShrink: 0 }} />
                    <span style={{ color: 'var(--text-primary)' }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Module 6: Resume Improvement Suggestions Component ─────────── */
function ResumeImprovementSection({ resumeId, resumeName }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [copiedIdx, setCopiedIdx] = useState(null);

  useEffect(() => {
    if (!resumeId) return;
    setLoading(true);
    resumesAPI.getImprovements(resumeId)
      .then((res) => setData(res.data))
      .catch(() => toast.error('Could not fetch resume improvement suggestions'))
      .finally(() => setLoading(false));
  }, [resumeId]);

  const copyText = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  if (loading) {
    return (
      <div className="card" style={{ padding: 32, textAlign: 'center' }}>
        <div className="spinner" style={{ margin: '0 auto 16px', width: 28, height: 28 }} />
        <p style={{ color: 'var(--text-muted)' }}>Generating AI Resume Improvement Suggestions...</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header card */}
      <div className="card">
        <div className="flex items-center gap-2" style={{ marginBottom: 4 }}>
          <Sparkles size={18} color="var(--accent)" />
          <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>AI Resume Improvement Suggestions</h2>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
          Optimized enhancements based on <strong>{resumeName}</strong> to boost your ATS pass rate and impress recruiters.
        </p>
      </div>

      {/* Upgraded Summaries */}
      {data.improved_summaries && data.improved_summaries.length > 0 && (
        <div className="card">
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileText size={16} color="var(--accent)" /> AI-Upgraded Professional Summaries
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {data.improved_summaries.map((item, idx) => (
              <div key={idx} style={{ background: 'var(--gray-50)', padding: 16, borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
                <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
                  <span className="badge badge-violet" style={{ fontSize: 11 }}>{item.style}</span>
                  <button
                    onClick={() => copyText(item.text, idx)}
                    className="btn btn-ghost btn-sm"
                    style={{ fontSize: 12, gap: 4 }}
                  >
                    {copiedIdx === idx ? <><Check size={12} color="var(--green-600)" /> Copied!</> : <><Copy size={12} /> Copy Summary</>}
                  </button>
                </div>
                <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--text-primary)', margin: 0 }}>
                  "{item.text}"
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Missing Keywords */}
      {data.missing_keywords && data.missing_keywords.length > 0 && (
        <div className="card">
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Target size={16} color="var(--amber-500)" /> Target ATS Keywords to Add
          </h3>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
            Including these high-frequency industry keywords in your skills section and bullet points will increase ATS scoring:
          </p>
          <div className="flex" style={{ flexWrap: 'wrap', gap: 6 }}>
            {data.missing_keywords.map((kw, idx) => (
              <span key={idx} className="badge badge-amber" style={{ fontSize: 12, padding: '4px 10px' }}>
                + {kw}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Project Bullet Point Enhancer */}
      {data.project_improvements && data.project_improvements.length > 0 && (
        <div className="card">
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Zap size={16} color="var(--green-500)" /> Project Bullet Point Transformation
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {data.project_improvements.map((proj, idx) => (
              <div key={idx} style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                <div style={{ background: 'var(--gray-50)', padding: '10px 14px', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Original Concept: {proj.original_concept}
                  </span>
                </div>
                <div style={{ padding: 14, background: '#f0fdf4' }}>
                  <div className="flex items-center gap-2" style={{ marginBottom: 4 }}>
                    <CheckCircle size={14} color="var(--green-600)" />
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#166534' }}>AI Enhanced Bullet (Action + Metric Impact)</span>
                  </div>
                  <p style={{ fontSize: 13, lineHeight: 1.5, color: '#14532d', margin: 0 }}>
                    "{proj.improved_bullet}"
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommended Certifications */}
      {data.recommended_certifications && data.recommended_certifications.length > 0 && (
        <div className="card">
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Award size={16} color="var(--accent)" /> Recommended Certifications
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
            {data.recommended_certifications.map((cert, idx) => (
              <div
                key={idx}
                style={{
                  padding: 16,
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border)',
                  background: 'var(--gray-50)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: 12,
                  minWidth: 0,
                }}
              >
                <div>
                  <h4 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 4px', color: 'var(--text-primary)', wordBreak: 'break-word' }}>
                    {cert.name}
                  </h4>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0, wordBreak: 'break-word' }}>
                    Issuer: <strong style={{ color: 'var(--text-secondary)' }}>{cert.provider}</strong>
                  </p>
                </div>
                {cert.impact && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 6,
                      background: 'var(--blue-50)',
                      color: 'var(--blue-600)',
                      border: '1px solid var(--blue-100)',
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-md)',
                      fontSize: 11,
                      fontWeight: 500,
                      lineHeight: 1.45,
                      whiteSpace: 'normal',
                      wordBreak: 'break-word',
                    }}
                  >
                    <Sparkles size={13} style={{ flexShrink: 0, marginTop: 2, color: 'var(--blue-500)' }} />
                    <span>{cert.impact}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Main Career Intelligence Dashboard ─────────────────────────── */
export default function CareerDashboardPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [resume, setResume] = useState(null);
  const [allResumes, setAllResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'jd_match' | 'career' | 'improvements'

  const resumeId = params.get('resume');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const list = await resumesAPI.list();
      setAllResumes(list.data);

      const idToLoad = resumeId ? parseInt(resumeId) : getActiveResumeId(list.data);

      if (idToLoad) {
        setActiveResumeId(idToLoad);
        const r = await resumesAPI.get(idToLoad);
        setResume(r.data);
      } else {
        setResume(null);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [resumeId]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSwitch = (id) => {
    setActiveResumeId(id);
    navigate(`/career?resume=${id}`);
    resumesAPI.get(id)
      .then((r) => setResume(r.data))
      .catch(() => toast.error('Failed to load resume'));
  };

  const handleDownload = async (id, filename) => {
    try {
      const res = await resumesAPI.download(id);
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Download started');
    } catch {
      toast.error('Download failed');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await resumesAPI.delete(deleteTarget.id);
      toast.success('Resume deleted');
      setDeleteTarget(null);

      const remaining = allResumes.filter((r) => r.id !== deleteTarget.id);
      setAllResumes(remaining);
      if (resume?.id === deleteTarget.id) {
        if (remaining.length > 0) {
          const r = await resumesAPI.get(remaining[0].id);
          setResume(r.data);
          navigate(`/career?resume=${remaining[0].id}`);
        } else {
          setResume(null);
          navigate('/career');
        }
      }
    } catch {
      toast.error('Failed to delete resume');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <LoadingState />;

  if (!resume && activeTab !== 'resume_builder') return (
    <div className="page-wrapper">
      <div className="container page-content">
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontSize: '1.375rem', marginBottom: 4 }}>AI-Powered Career Intelligence</h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            Build a professional resume or upload an existing resume for AI career insights.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid var(--border)', marginBottom: 20, overflowX: 'auto' }}>
          <button
            onClick={() => setActiveTab('overview')}
            style={{
              padding: '10px 14px', background: 'none', border: 'none', borderBottom: activeTab === 'overview' ? '2px solid var(--accent)' : '2px solid transparent',
              fontWeight: activeTab === 'overview' ? 600 : 500, color: activeTab === 'overview' ? 'var(--accent)' : 'var(--text-secondary)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, whiteSpace: 'nowrap'
            }}
          >
            <Layers size={15} /> Dashboard Analytics
          </button>
          <button
            onClick={() => setActiveTab('resume_builder')}
            style={{
              padding: '10px 14px', background: 'none', border: 'none', borderBottom: activeTab === 'resume_builder' ? '2px solid var(--accent)' : '2px solid transparent',
              fontWeight: activeTab === 'resume_builder' ? 600 : 500, color: activeTab === 'resume_builder' ? 'var(--accent)' : 'var(--text-secondary)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, whiteSpace: 'nowrap'
            }}
          >
            <FileText size={15} /> Resume Builder
          </button>
        </div>

        <div style={{ padding: '60px 20px', textAlign: 'center', background: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
          <div style={{ width: 56, height: 56, borderRadius: 'var(--radius-lg)', background: 'var(--gray-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Brain size={24} color="var(--text-muted)" />
          </div>
          <h2 style={{ marginBottom: 6 }}>No resume analyzed yet</h2>
          <p style={{ marginBottom: 20, fontSize: 14, color: 'var(--text-secondary)' }}>Upload a resume for AI analysis or start building a new custom resume with interactive templates!</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="/dashboard" className="btn btn-primary">Upload Resume to Analyze</a>
            <button onClick={() => setActiveTab('resume_builder')} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <FileText size={15} /> Open Resume Builder
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const atsScore = resume.ats_score || 0;
  const skillGaps = resume.skill_gaps || [];
  const careerPaths = resume.career_paths || [];
  const skills = resume.parsed_skills || [];
  const salaryRange = resume.salary_range || {};

  const atsData = [{ name: 'ATS', value: atsScore, fill: atsColor(atsScore) }];

  return (
    <div className="page-wrapper">
      <div className="container page-content">
        {/* Header */}
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontSize: '1.375rem', marginBottom: 4 }}>AI-Powered Career Intelligence</h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            Active Resume: <strong>{resume.filename}</strong> (Parsed: {fmtDate(resume.parsed_at)})
          </p>
        </div>

        {/* History panel */}
        <ResumeHistoryPanel
          resumes={allResumes}
          activeId={resume.id}
          onSwitch={handleSwitch}
          onDelete={(id, filename) => setDeleteTarget({ id, filename })}
          onDownload={handleDownload}
        />

        {/* Navigation Tabs for PPT Modules */}
        <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid var(--border)', marginBottom: 20, overflowX: 'auto' }}>
          <button
            onClick={() => setActiveTab('overview')}
            style={{
              padding: '10px 14px', background: 'none', border: 'none', borderBottom: activeTab === 'overview' ? '2px solid var(--accent)' : '2px solid transparent',
              fontWeight: activeTab === 'overview' ? 600 : 500, color: activeTab === 'overview' ? 'var(--accent)' : 'var(--text-secondary)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, whiteSpace: 'nowrap'
            }}
          >
            <Layers size={15} /> Dashboard Analytics
          </button>

          <button
            onClick={() => setActiveTab('jd_match')}
            style={{
              padding: '10px 14px', background: 'none', border: 'none', borderBottom: activeTab === 'jd_match' ? '2px solid var(--accent)' : '2px solid transparent',
              fontWeight: activeTab === 'jd_match' ? 600 : 500, color: activeTab === 'jd_match' ? 'var(--accent)' : 'var(--text-secondary)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, whiteSpace: 'nowrap'
            }}
          >
            <FileCheck size={15} /> ATS & JD Matcher
          </button>

          <button
            onClick={() => setActiveTab('career')}
            style={{
              padding: '10px 14px', background: 'none', border: 'none', borderBottom: activeTab === 'career' ? '2px solid var(--accent)' : '2px solid transparent',
              fontWeight: activeTab === 'career' ? 600 : 500, color: activeTab === 'career' ? 'var(--accent)' : 'var(--text-secondary)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, whiteSpace: 'nowrap'
            }}
          >
            <TrendingUp size={15} /> Career Paths & Salary
          </button>

          <button
            onClick={() => setActiveTab('improvements')}
            style={{
              padding: '10px 14px', background: 'none', border: 'none', borderBottom: activeTab === 'improvements' ? '2px solid var(--accent)' : '2px solid transparent',
              fontWeight: activeTab === 'improvements' ? 600 : 500, color: activeTab === 'improvements' ? 'var(--accent)' : 'var(--text-secondary)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, whiteSpace: 'nowrap'
            }}
          >
            <Sparkles size={15} /> Resume Improvements
          </button>

          <button
            onClick={() => setActiveTab('interview_prep')}
            style={{
              padding: '10px 14px', background: 'none', border: 'none', borderBottom: activeTab === 'interview_prep' ? '2px solid var(--accent)' : '2px solid transparent',
              fontWeight: activeTab === 'interview_prep' ? 600 : 500, color: activeTab === 'interview_prep' ? 'var(--accent)' : 'var(--text-secondary)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, whiteSpace: 'nowrap'
            }}
          >
            <HelpCircle size={15} /> AI Interview Prep
          </button>
        </div>

        {/* Tab 1: Overview & Analytics (Module 7) */}
        {activeTab === 'overview' && (
          <div className="animate-fade-in">
            {/* Quick Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 20 }}>
              <StatCard icon={Brain} label="Skills" value={skills.length} sub="detected" />
              <StatCard icon={AlertTriangle} label="Skill Gaps" value={skillGaps.length} sub="identified" />
              <StatCard icon={TrendingUp} label="Career Paths" value={careerPaths.length} sub="recommended" />
            </div>

            {/* Gauge + Skills */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16, marginBottom: 20 }}>
              <div className="card">
                <h3 style={{ marginBottom: 16, fontSize: 14, fontWeight: 600 }}>ATS Compatibility Score</h3>
                <div style={{ height: 180, position: 'relative' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%" data={atsData} startAngle={90} endAngle={-270}>
                      <RadialBar background={{ fill: 'var(--gray-100)' }} dataKey="value" cornerRadius={6} />
                    </RadialBarChart>
                  </ResponsiveContainer>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="stat-value">{atsScore.toFixed(0)}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>out of 100</div>
                  </div>
                </div>
                <div className="progress-bar" style={{ marginTop: 8 }}>
                  <div className="progress-fill" style={{ width: `${atsScore}%`, background: atsColor(atsScore) }} />
                </div>
              </div>

              <div className="card">
                <h3 style={{ marginBottom: 14, fontSize: 14, fontWeight: 600 }}>All Detected Skills ({skills.length})</h3>
                <div className="flex" style={{ flexWrap: 'wrap', gap: 6, minHeight: 120, maxHeight: 180, overflowY: 'auto', paddingRight: 4 }}>
                  {skills.map((s, i) => (
                    <span key={i} className="badge badge-blue">{s}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Skill Gaps Overview */}
            {skillGaps.length > 0 && (
              <div className="card" style={{ marginBottom: 20 }}>
                <div className="flex items-center justify-between" style={{ marginBottom: 14 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <AlertTriangle size={15} color="var(--amber-500)" />
                    Skill Gap Analysis ({skillGaps.length})
                  </h3>
                  <Link to="/courses" className="btn btn-ghost btn-sm" style={{ fontSize: 12 }}>
                    Bridge Gaps via Courses <ChevronRight size={13} />
                  </Link>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
                  {skillGaps.map((g, i) => (
                    <div key={i} style={{
                      padding: '12px 14px', borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border)', display: 'flex', alignItems: 'flex-start', gap: 10,
                    }}>
                      <div style={{ width: 6, height: 6, borderRadius: 'var(--radius-full)', background: priorityColor[g.priority] || 'var(--gray-400)', marginTop: 5, flexShrink: 0 }} />
                      <div>
                        <div className="flex items-center gap-2" style={{ marginBottom: 2 }}>
                          <span style={{ fontWeight: 600, fontSize: 13 }}>{g.skill || g}</span>
                          <span className={`badge ${priorityBadge[g.priority] || 'badge-gray'}`}>{g.priority || 'medium'}</span>
                        </div>
                        {g.reason && <p style={{ fontSize: 12, lineHeight: 1.4, color: 'var(--text-secondary)', margin: 0 }}>{g.reason}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Action Navigation Modules */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
              <Link to="/jobs" className="card" style={{ padding: 18, textDecoration: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div className="flex items-center justify-between">
                  <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', background: 'var(--accent-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Briefcase size={18} color="var(--accent)" />
                  </div>
                  <ChevronRight size={16} color="var(--text-muted)" />
                </div>
                <div>
                  <h4 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 2px', color: 'var(--text-primary)' }}>Recommended Jobs</h4>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>Browse role-matched jobs with direct apply links</p>
                </div>
              </Link>

              <Link to="/courses" className="card" style={{ padding: 18, textDecoration: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div className="flex items-center justify-between">
                  <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', background: '#f3e8ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <BookOpen size={18} color="#7c3aed" />
                  </div>
                  <ChevronRight size={16} color="var(--text-muted)" />
                </div>
                <div>
                  <h4 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 2px', color: 'var(--text-primary)' }}>Recommended Courses</h4>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>Explore Coursera & Udemy courses with direct links</p>
                </div>
              </Link>
            </div>
          </div>
        )}

        {/* Tab 2: ATS & Job Description Matcher (Module 1 & 2) */}
        {activeTab === 'jd_match' && (
          <JdMatcherSection resumeId={resume.id} resumeName={resume.filename} />
        )}

        {/* Tab 3: Career Paths & Salary (Module 3) */}
        {activeTab === 'career' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {salaryRange.min_salary && (
              <div className="card">
                <h3 style={{ marginBottom: 14, fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <DollarSign size={15} color="var(--green-500)" /> Salary Benchmark Estimate
                </h3>
                <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                  {[
                    { label: 'Min', value: `$${salaryRange.min_salary?.toLocaleString()}` },
                    { label: 'Median', value: `$${salaryRange.median_salary?.toLocaleString()}` },
                    { label: 'Max', value: `$${salaryRange.max_salary?.toLocaleString()}` },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</p>
                      <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--green-600)', margin: 0 }}>{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {careerPaths.length > 0 && (
              <div className="card">
                <h3 style={{ marginBottom: 16, fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <TrendingUp size={15} color="var(--accent)" /> Recommended Career Paths
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
                  {careerPaths.map((path, i) => (
                    <div key={i} style={{ padding: 16, borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
                      <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
                        <h4 style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>{path.title}</h4>
                        <span className="badge badge-blue">{path.match_percentage}%</span>
                      </div>
                      <p style={{ fontSize: 13, lineHeight: 1.6, marginBottom: 10, color: 'var(--text-secondary)' }}>{path.description}</p>
                      <div className="flex" style={{ gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                        {(path.required_skills || []).slice(0, 3).map((s, j) => (
                          <span key={j} className="badge badge-gray">{s}</span>
                        ))}
                      </div>
                      {path.avg_salary && (
                        <div className="flex items-center gap-1" style={{ fontSize: 13, color: 'var(--green-600)', fontWeight: 500 }}>
                          <DollarSign size={13} /> {path.avg_salary}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Resume Improvement Suggestions (Module 6) */}
        {activeTab === 'improvements' && (
          <ResumeImprovementSection resumeId={resume.id} resumeName={resume.filename} />
        )}

        {/* Tab 5: AI Interview Prep */}
        {activeTab === 'interview_prep' && (
          <AIInterviewPrep resumeId={resume?.id} />
        )}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub }) {
  return (
    <div className="stat-card">
      <div className="flex items-center gap-2" style={{ marginBottom: 8 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 'var(--radius-md)',
          background: 'var(--gray-100)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={14} color="var(--text-secondary)" />
        </div>
        <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</span>
      </div>
      <div className="stat-value" style={{ fontSize: '1.25rem' }}>{value}</div>
      {sub && <p style={{ fontSize: 12, marginTop: 2, color: 'var(--text-muted)' }}>{sub}</p>}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="container page-content">
      <div className="skeleton" style={{ height: 32, width: '30%', marginBottom: 28 }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {[1, 2, 3, 4].map(i => <div key={i} className="skeleton" style={{ height: 90 }} />)}
      </div>
    </div>
  );
}
