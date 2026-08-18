import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ResumeUpload from '../components/ResumeUpload';
import { resumesAPI } from '../api/client';
import { setActiveResumeId } from '../utils/activeResume';
import {
  FileText, Clock, Upload, ChevronRight, Download, Trash2, Eye, X, Loader2, ExternalLink,
} from 'lucide-react';
import toast from 'react-hot-toast';

/* ─── Helper: trigger browser file download from blob ──────────── */
function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* ─── Helper: open blob in a new tab ───────────────────────────── */
function openInNewTab(blob, mimeType) {
  const url = URL.createObjectURL(new Blob([blob], { type: mimeType }));
  window.open(url, '_blank');
  // Revoke after a short delay to allow the tab to load
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

/* ─── Delete Confirmation Modal ────────────────────────────────── */
function DeleteModal({ filename, onConfirm, onCancel, deleting }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <div className="card animate-fade-in" style={{ maxWidth: 400, width: '100%', padding: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 'var(--radius-md)',
            background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Trash2 size={18} color="var(--red-500)" />
          </div>
          <div>
            <p style={{ fontWeight: 700, fontSize: 15, margin: 0 }}>Delete resume?</p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>This action cannot be undone</p>
          </div>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20, lineHeight: 1.5 }}>
          <strong style={{ color: 'var(--text-primary)' }}>{filename}</strong> and all its AI analysis data
          will be permanently deleted.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost btn-sm" onClick={onCancel} disabled={deleting}>
            Cancel
          </button>
          <button
            className="btn btn-sm"
            onClick={onConfirm}
            disabled={deleting}
            style={{ background: 'var(--red-500)', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            {deleting
              ? <><Loader2 size={13} style={{ animation: 'spin 0.6s linear infinite' }} /> Deleting…</>
              : <><Trash2 size={13} /> Delete</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── PDF / File Viewer Modal ──────────────────────────────────── */
function ViewerModal({ resumeId, filename, onClose }) {
  const [blobUrl, setBlobUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isPdf = filename?.toLowerCase().endsWith('.pdf');

  useEffect(() => {
    let url = null;
    resumesAPI.view(resumeId)
      .then((res) => {
        const mimeType = isPdf ? 'application/pdf' : 'text/plain';
        url = URL.createObjectURL(new Blob([res.data], { type: mimeType }));
        setBlobUrl(url);
      })
      .catch(() => setError('Could not load file. It may have been uploaded before file storage was enabled.'))
      .finally(() => setLoading(false));

    return () => { if (url) URL.revokeObjectURL(url); };
  }, [resumeId, isPdf]);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }}>
      <div style={{
        background: 'var(--surface)', borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-lg)',
        width: '100%', maxWidth: 860, maxHeight: '90vh',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        {/* Modal header */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px',
          borderBottom: '1px solid var(--border)',
        }}>
          <FileText size={16} color="var(--accent)" />
          <span style={{ fontWeight: 600, fontSize: 14, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {filename}
          </span>
          {blobUrl && (
            <a
              href={blobUrl}
              target="_blank"
              rel="noreferrer"
              title="Open in new tab"
              style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}
            >
              <ExternalLink size={15} />
            </a>
          )}
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4, display: 'flex' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 10 }}>
              <Loader2 size={22} style={{ animation: 'spin 0.7s linear infinite' }} color="var(--accent)" />
              <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Loading file…</span>
            </div>
          )}
          {error && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12, padding: 32, textAlign: 'center' }}>
              <FileText size={40} color="var(--text-muted)" style={{ opacity: 0.4 }} />
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', maxWidth: 340, lineHeight: 1.6 }}>{error}</p>
            </div>
          )}
          {blobUrl && isPdf && (
            <iframe
              src={blobUrl}
              title={filename}
              style={{ width: '100%', height: '100%', border: 'none', minHeight: 500 }}
            />
          )}
          {blobUrl && !isPdf && (
            <div style={{ padding: 24, height: '100%', overflow: 'auto' }}>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
                This file type cannot be previewed directly. Use the download button instead.
              </p>
              <a href={blobUrl} download={filename} className="btn btn-primary btn-sm">
                <Download size={14} /> Download to view
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Resume Row ────────────────────────────────────────────────── */
function ResumeRow({ resume, onView, onDownload, onDelete, downloading }) {
  const atsColor = resume.ats_score >= 70 ? 'var(--green-600)' : resume.ats_score >= 50 ? 'var(--amber-500)' : 'var(--red-500)';
  const atsBg = resume.ats_score >= 70 ? '#dcfce7' : resume.ats_score >= 50 ? '#fef9c3' : '#fee2e2';

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
      borderRadius: 'var(--radius-md)', transition: 'background var(--transition)',
    }}
      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--gray-50)'}
      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
    >
      {/* Icon */}
      <div style={{
        width: 34, height: 34, borderRadius: 'var(--radius-md)',
        background: 'var(--gray-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <FileText size={15} color="var(--text-muted)" />
      </div>

      {/* Name + date */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontWeight: 500, fontSize: 13, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>
          {resume.filename}
        </p>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0, display: 'flex', alignItems: 'center', gap: 3, marginTop: 2 }}>
          <Clock size={10} />
          {new Date(resume.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
        </p>
      </div>

      {/* ATS badge */}
      {resume.ats_score != null && (
        <span style={{
          fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99,
          color: atsColor, background: atsBg, flexShrink: 0,
        }}>
          ATS {resume.ats_score?.toFixed(0)}
        </span>
      )}

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
        {/* View analysis */}
        <Link
          to={`/career?resume=${resume.id}`}
          onClick={() => setActiveResumeId(resume.id)}
          title="View career analysis"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 30, height: 30, borderRadius: 'var(--radius-sm)',
            color: 'var(--text-muted)', textDecoration: 'none',
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--accent-subtle)'; e.currentTarget.style.color = 'var(--accent)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
        >
          <ChevronRight size={15} />
        </Link>

        {/* View / preview file */}
        {resume.has_file && (
          <button
            title="Preview file"
            onClick={() => onView(resume)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 30, height: 30, borderRadius: 'var(--radius-sm)',
              border: 'none', background: 'none', cursor: 'pointer',
              color: 'var(--text-muted)', transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#eff6ff'; e.currentTarget.style.color = '#3b82f6'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
            id={`view-btn-${resume.id}`}
          >
            <Eye size={14} />
          </button>
        )}

        {/* Download */}
        {resume.has_file && (
          <button
            title="Download original file"
            onClick={() => onDownload(resume)}
            disabled={downloading === resume.id}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 30, height: 30, borderRadius: 'var(--radius-sm)',
              border: 'none', background: 'none', cursor: downloading === resume.id ? 'wait' : 'pointer',
              color: 'var(--text-muted)', transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#f0fdf4'; e.currentTarget.style.color = '#16a34a'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
            id={`download-btn-${resume.id}`}
          >
            {downloading === resume.id
              ? <Loader2 size={14} style={{ animation: 'spin 0.6s linear infinite' }} />
              : <Download size={14} />
            }
          </button>
        )}

        {/* Delete */}
        <button
          title="Delete resume"
          onClick={() => onDelete(resume)}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 30, height: 30, borderRadius: 'var(--radius-sm)',
            border: 'none', background: 'none', cursor: 'pointer',
            color: 'var(--text-muted)', transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = 'var(--red-500)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
          id={`delete-btn-${resume.id}`}
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

/* ─── Main Dashboard Page ───────────────────────────────────────── */
export default function DashboardPage() {
  const { user } = useAuth();
  const [resumes, setResumes] = useState([]);
  const [loadingResumes, setLoadingResumes] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);   // resume obj to delete
  const [deleting, setDeleting] = useState(false);
  const [viewTarget, setViewTarget] = useState(null);       // resume obj to preview
  const [downloading, setDownloading] = useState(null);     // id being downloaded

  useEffect(() => {
    resumesAPI.list()
      .then((r) => setResumes(r.data))
      .catch(() => {})
      .finally(() => setLoadingResumes(false));
  }, []);

  const handleUploadSuccess = (data) => {
    setResumes((prev) => [{
      id: data.id,
      filename: data.filename,
      ats_score: data.ats_score,
      parsed_skills: data.parsed_skills || [],
      has_file: true,
      created_at: new Date().toISOString(),
    }, ...prev]);
  };

  /* ── Download ── */
  const handleDownload = async (resume) => {
    setDownloading(resume.id);
    try {
      const res = await resumesAPI.download(resume.id);
      triggerDownload(res.data, resume.filename);
      toast.success('Download started');
    } catch {
      toast.error('Download failed — original file may no longer be available');
    } finally {
      setDownloading(null);
    }
  };

  /* ── Delete ── */
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await resumesAPI.delete(deleteTarget.id);
      setResumes((prev) => prev.filter((r) => r.id !== deleteTarget.id));
      toast.success('Resume deleted');
      setDeleteTarget(null);
    } catch {
      toast.error('Failed to delete resume');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="page-wrapper">
      {/* Delete modal */}
      {deleteTarget && (
        <DeleteModal
          filename={deleteTarget.filename}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
          deleting={deleting}
        />
      )}

      {/* File viewer modal */}
      {viewTarget && (
        <ViewerModal
          resumeId={viewTarget.id}
          filename={viewTarget.filename}
          onClose={() => setViewTarget(null)}
        />
      )}

      <div className="container page-content">
        <div className="animate-fade-in" style={{
          marginBottom: 28, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 16, borderBottom: '1px solid #e2e8f0', paddingBottom: 20
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                {getGreeting()}, {user?.full_name?.split(' ')[0]}
              </h1>
            </div>
            <p style={{ fontSize: 14, color: '#64748b', margin: 0 }}>
              Upload your resume to get instant ATS scoring, skill gap analysis, and tailored career recommendations.
            </p>
          </div>
        </div>

        {/* Upload Resume Card */}
        <div className="card animate-fade-in" style={{
          animationDelay: '50ms', marginBottom: 24,
          background: '#ffffff', border: '1px solid #e2e8f0',
          boxShadow: '0 4px 16px -2px rgba(15, 23, 42, 0.04)',
        }}>
          <div className="flex items-center gap-2" style={{ marginBottom: 16 }}>
            <Upload size={18} color="#4f46e5" />
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>Upload Resume</h2>
          </div>
          <ResumeUpload onUploadSuccess={handleUploadSuccess} />
        </div>

        {/* Resume History */}
        <div className="card animate-fade-in" style={{ animationDelay: '150ms' }}>
          <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
            <h2 style={{ fontSize: 15, fontWeight: 600 }}>Resume history</h2>
            <span className="badge badge-gray">{resumes.length}</span>
          </div>

          {/* Legend */}
          {resumes.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
              {[
                { icon: ChevronRight, label: 'View analysis', color: 'var(--accent)' },
                { icon: Eye, label: 'Preview file', color: '#3b82f6' },
                { icon: Download, label: 'Download', color: '#16a34a' },
                { icon: Trash2, label: 'Delete', color: 'var(--red-500)' },
              ].map(({ icon: Icon, label, color }) => (
                <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-muted)' }}>
                  <Icon size={11} color={color} /> {label}
                </span>
              ))}
            </div>
          )}

          {loadingResumes ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: 52 }} />)}
            </div>
          ) : resumes.length === 0 ? (
            <div className="empty-state" style={{ padding: '40px 0' }}>
              <div className="empty-state-icon">
                <FileText size={20} />
              </div>
              <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>No resumes uploaded yet</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {resumes.map((r) => (
                <ResumeRow
                  key={r.id}
                  resume={r}
                  onView={setViewTarget}
                  onDownload={handleDownload}
                  onDelete={setDeleteTarget}
                  downloading={downloading}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}
