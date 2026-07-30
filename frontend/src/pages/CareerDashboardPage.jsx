import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { resumesAPI } from '../api/client';
import {
  RadialBarChart, RadialBar, ResponsiveContainer,
} from 'recharts';
import {
  Target, TrendingUp, AlertTriangle, CheckCircle, Brain, DollarSign,
  Download, Trash2, FileText, Clock, ChevronRight, X, Eye,
  ChevronDown,
} from 'lucide-react';
import toast from 'react-hot-toast';

const priorityColor = { high: 'var(--red-500)', medium: 'var(--amber-500)', low: 'var(--blue-500)' };
const priorityBadge = { high: 'badge-red', medium: 'badge-amber', low: 'badge-blue' };

/* ─── Date formatter ───────────────────────────────────────────── */
function fmtDate(str) {
  if (!str) return '—';
  return new Date(str).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

/* ─── ATS colour helper ─────────────────────────────────────────── */
function atsColor(score) {
  if (score >= 70) return 'var(--green-500)';
  if (score >= 50) return 'var(--amber-500)';
  return 'var(--red-500)';
}

/* ─── Resume History Panel ──────────────────────────────────────── */
function ResumeHistoryPanel({ resumes, activeId, onSwitch, onDelete, onDownload, loading }) {
  const [open, setOpen] = useState(false);

  if (resumes.length === 0) return null;

  return (
    <div style={{ marginBottom: 20 }}>
      {/* Toggle button */}
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)', padding: '8px 14px',
          cursor: 'pointer', fontSize: 13, fontWeight: 500,
          color: 'var(--text-secondary)',
          transition: 'all 0.15s',
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

      {/* Panel */}
      {open && (
        <div
          className="card animate-fade-in"
          style={{ marginTop: 10, padding: 0, overflow: 'hidden' }}
        >
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
                  {/* File icon + info */}
                  <div style={{
                    width: 36, height: 36, borderRadius: 'var(--radius-md)',
                    background: isActive ? 'var(--accent)' : 'var(--gray-100)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <FileText size={16} color={isActive ? '#fff' : 'var(--text-muted)'} />
                  </div>

                  {/* Name + meta */}
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

                  {/* Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                    {/* View / Switch */}
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
                        id={`view-resume-${r.id}`}
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

                    {/* Download */}
                    {r.has_file && (
                      <button
                        title="Download original file"
                        onClick={() => onDownload(r.id, r.filename)}
                        style={{
                          background: 'none', border: 'none', padding: '6px',
                          cursor: 'pointer', borderRadius: 'var(--radius-sm)',
                          color: 'var(--text-muted)',
                          display: 'flex', alignItems: 'center',
                        }}
                        id={`download-resume-${r.id}`}
                      >
                        <Download size={14} />
                      </button>
                    )}

                    {/* Delete */}
                    <button
                      title="Delete resume"
                      onClick={() => onDelete(r.id, r.filename)}
                      style={{
                        background: 'none', border: 'none', padding: '6px',
                        cursor: 'pointer', borderRadius: 'var(--radius-sm)',
                        color: 'var(--text-muted)',
                        display: 'flex', alignItems: 'center',
                      }}
                      id={`delete-resume-${r.id}`}
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

/* ─── Delete Confirm Modal ──────────────────────────────────────── */
function DeleteModal({ filename, onConfirm, onCancel, deleting }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <div className="card animate-fade-in" style={{ maxWidth: 400, width: '100%', padding: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 'var(--radius-md)',
            background: 'var(--red-50)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Trash2 size={18} color="var(--red-500)" />
          </div>
          <div>
            <p style={{ fontWeight: 700, fontSize: 15, margin: 0 }}>Delete resume?</p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>This cannot be undone</p>
          </div>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
          <strong>{filename}</strong> and all its analysis data will be permanently deleted.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost btn-sm" onClick={onCancel} disabled={deleting}>
            Cancel
          </button>
          <button
            className="btn btn-sm"
            onClick={onConfirm}
            disabled={deleting}
            style={{ background: 'var(--red-500)', color: '#fff', border: 'none' }}
          >
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ─────────────────────────────────────────────────── */
export default function CareerDashboardPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [resume, setResume] = useState(null);
  const [allResumes, setAllResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null); // { id, filename }
  const [deleting, setDeleting] = useState(false);
  const resumeId = params.get('resume');

  /* ── Load resume list + active resume ────────── */
  const loadData = useCallback(async (targetId = null) => {
    setLoading(true);
    try {
      const list = await resumesAPI.list();
      setAllResumes(list.data);

      const idToLoad = targetId
        ? parseInt(targetId)
        : resumeId
          ? parseInt(resumeId)
          : list.data[0]?.id;

      if (idToLoad) {
        const r = await resumesAPI.get(idToLoad);
        setResume(r.data);
      } else {
        setResume(null);
      }
    } catch {
      // silently fail — no resume yet
    } finally {
      setLoading(false);
    }
  }, [resumeId]);

  useEffect(() => { loadData(); }, [loadData]);

  /* ── Switch active resume ─────────────────────── */
  const handleSwitch = (id) => {
    navigate(`/career?resume=${id}`);
    // Update URL, then reload that resume
    resumesAPI.get(id)
      .then((r) => setResume(r.data))
      .catch(() => toast.error('Failed to load resume'));
  };

  /* ── Download ─────────────────────────────────── */
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
      toast.error('Download failed — original file may no longer be available');
    }
  };

  /* ── Delete ───────────────────────────────────── */
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await resumesAPI.delete(deleteTarget.id);
      toast.success('Resume deleted');
      setDeleteTarget(null);

      // Pick next resume to show
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

  if (!resume) return (
    <div style={{ minHeight: 'calc(100vh - 65px)', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
      <div>
        <div style={{ width: 56, height: 56, borderRadius: 'var(--radius-lg)', background: 'var(--gray-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <Brain size={24} color="var(--text-muted)" />
        </div>
        <h2 style={{ marginBottom: 6 }}>No resume analyzed yet</h2>
        <p style={{ marginBottom: 20, fontSize: 14 }}>Upload a resume from your profile to see career insights</p>
        <a href="/profile" className="btn btn-primary">Upload Resume</a>
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
      {/* Delete confirmation modal */}
      {deleteTarget && (
        <DeleteModal
          filename={deleteTarget.filename}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
          deleting={deleting}
        />
      )}

      <div className="container page-content">
        {/* Header */}
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontSize: '1.375rem', marginBottom: 4 }}>Career Intelligence</h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            Based on: <strong>{resume.filename}</strong>
          </p>
        </div>

        {/* Resume history panel */}
        <ResumeHistoryPanel
          resumes={allResumes}
          activeId={resume.id}
          onSwitch={handleSwitch}
          onDelete={(id, filename) => setDeleteTarget({ id, filename })}
          onDownload={handleDownload}
        />

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 20 }}>
          <StatCard icon={Target} label="ATS Score" value={`${atsScore.toFixed(0)}/100`}
            sub={atsScore >= 70 ? 'Excellent' : atsScore >= 50 ? 'Good' : 'Needs work'} />
          <StatCard icon={Brain} label="Skills" value={skills.length} sub="detected" />
          <StatCard icon={AlertTriangle} label="Skill gaps" value={skillGaps.length} sub="identified" />
          <StatCard icon={TrendingUp} label="Career paths" value={careerPaths.length} sub="recommended" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16, marginBottom: 20 }}>
          {/* ATS Gauge */}
          <div className="card">
            <h3 style={{ marginBottom: 16, fontSize: 14, fontWeight: 600 }}>ATS score breakdown</h3>
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

          {/* Skills */}
          <div className="card">
            <h3 style={{ marginBottom: 14, fontSize: 14, fontWeight: 600 }}>All Detected Skills ({skills.length})</h3>
            <div className="flex" style={{ flexWrap: 'wrap', gap: 6, minHeight: 60, overflowY: 'auto', paddingRight: 2 }}>
              {skills.map((s, i) => (
                <span key={i} className="badge badge-blue">{s}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Salary Range */}
        {salaryRange.min_salary && (
          <div className="card" style={{ marginBottom: 20 }}>
            <h3 style={{ marginBottom: 14, fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
              <DollarSign size={15} color="var(--green-500)" />
              Salary estimate
            </h3>
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              {[
                { label: 'Min', value: `$${salaryRange.min_salary?.toLocaleString()}` },
                { label: 'Median', value: `$${salaryRange.median_salary?.toLocaleString()}` },
                { label: 'Max', value: `$${salaryRange.max_salary?.toLocaleString()}` },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</p>
                  <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--green-600)' }}>{value}</p>
                </div>
              ))}
              {salaryRange.market_demand && (
                <div>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Market Demand</p>
                  <span className={`badge ${salaryRange.market_demand === 'high' ? 'badge-green' : salaryRange.market_demand === 'medium' ? 'badge-amber' : 'badge-red'}`}>
                    {salaryRange.market_demand}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Skill Gaps */}
        {skillGaps.length > 0 && (
          <div className="card" style={{ marginBottom: 20 }}>
            <h3 style={{ marginBottom: 16, fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertTriangle size={15} color="var(--amber-500)" />
              Skill gap analysis
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
              {skillGaps.map((g, i) => (
                <div key={i} style={{
                  padding: '12px 14px', borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)',
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                }}>
                  <div style={{ width: 6, height: 6, borderRadius: 'var(--radius-full)', background: priorityColor[g.priority] || 'var(--gray-400)', marginTop: 5, flexShrink: 0 }} />
                  <div>
                    <div className="flex items-center gap-2" style={{ marginBottom: 2 }}>
                      <span style={{ fontWeight: 600, fontSize: 13 }}>{g.skill || g}</span>
                      <span className={`badge ${priorityBadge[g.priority] || 'badge-gray'}`}>{g.priority || 'medium'}</span>
                    </div>
                    {g.reason && <p style={{ fontSize: 12, lineHeight: 1.5, color: 'var(--text-secondary)' }}>{g.reason}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Career Paths */}
        {careerPaths.length > 0 && (
          <div className="card" style={{ marginBottom: 20 }}>
            <h3 style={{ marginBottom: 16, fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
              <TrendingUp size={15} color="var(--accent)" />
              Recommended career paths
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
              {careerPaths.map((path, i) => (
                <div key={i} style={{
                  padding: 16, borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border)',
                }}>
                  <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
                    <h4 style={{ fontSize: 14, fontWeight: 600 }}>{path.title}</h4>
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
                      <DollarSign size={13} />
                      {path.avg_salary}
                    </div>
                  )}
                  {path.timeline && <p style={{ fontSize: 12, marginTop: 4, color: 'var(--text-muted)' }}>{path.timeline}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Experience roles */}
        {resume.parsed_roles?.length > 0 && (
          <div className="card" style={{ marginBottom: 20 }}>
            <h3 style={{ marginBottom: 14, fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
              <CheckCircle size={15} color="var(--green-500)" />
              Experience roles detected
            </h3>
            <div className="flex" style={{ flexWrap: 'wrap', gap: 6 }}>
              {resume.parsed_roles.map((r, i) => (
                <span key={i} className="badge badge-green">{r}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Stat Card ─────────────────────────────────────────────────── */
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

/* ─── Loading State ─────────────────────────────────────────────── */
function LoadingState() {
  return (
    <div className="container page-content">
      <div className="skeleton" style={{ height: 32, width: '30%', marginBottom: 28 }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {[1, 2, 3, 4].map(i => <div key={i} className="skeleton" style={{ height: 90 }} />)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="skeleton" style={{ height: 260 }} />
        <div className="skeleton" style={{ height: 260 }} />
      </div>
    </div>
  );
}
