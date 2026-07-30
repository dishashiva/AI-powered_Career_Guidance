import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usersAPI, resumesAPI } from '../api/client';
import toast from 'react-hot-toast';
import {
  User, MapPin, Phone, Globe, ExternalLink, Code2, AtSign, Briefcase,
  BookOpen, Star, Languages, Target, DollarSign, Award, ChevronRight,
  Save, Edit3, Check, X, Loader2, Link2, Heart, GraduationCap, Zap,
  Upload, FileText, Sparkles, RefreshCw, ChevronDown, ChevronUp,
} from 'lucide-react';

const AVAILABILITY_OPTIONS = [
  'Open to work',
  'Open to freelance',
  'Open to contract',
  'Not looking',
];

const WORK_PREF_OPTIONS = ['Remote', 'Hybrid', 'On-site', 'Flexible'];

/* ─── URL Validators ───────────────────────────────────────────── */
const URL_VALIDATORS = {
  linkedin_url: {
    label: 'LinkedIn',
    pattern: /^https?:\/\/(www\.)?linkedin\.com\/(in|pub|company)\/[A-Za-z0-9\-_%]+\/?$/,
    hint: 'Must be like https://linkedin.com/in/yourname',
  },
  github_url: {
    label: 'GitHub',
    pattern: /^https?:\/\/(www\.)?github\.com\/[A-Za-z0-9\-._]+\/?$/,
    hint: 'Must be like https://github.com/yourname',
  },
  twitter_url: {
    label: 'Twitter / X',
    pattern: /^https?:\/\/(www\.)?(twitter\.com|x\.com)\/[A-Za-z0-9_]+\/?$/,
    hint: 'Must be like https://twitter.com/yourname or https://x.com/yourname',
  },
  website_url: {
    label: 'Personal Website',
    pattern: /^https?:\/\/.+\..+/,
    hint: 'Must be a valid URL starting with http:// or https://',
  },
  portfolio_url: {
    label: 'Portfolio',
    pattern: /^https?:\/\/.+\..+/,
    hint: 'Must be a valid URL starting with http:// or https://',
  },
};

function validateUrls(form) {
  const errors = {};
  for (const [key, rule] of Object.entries(URL_VALIDATORS)) {
    const val = form[key];
    if (val && val.trim() && !rule.pattern.test(val.trim())) {
      errors[key] = rule.hint;
    }
  }
  return errors;
}

/* ─── Profile Completeness ─────────────────────────────────────── */
function calcCompleteness(user, profile) {
  const checks = [
    user?.full_name,
    profile?.current_title,
    profile?.target_title,
    profile?.bio,
    profile?.location,
    profile?.phone,
    profile?.linkedin_url,
    profile?.github_url,
    profile?.skills,
    profile?.certifications,
    profile?.interests,
    profile?.education,
    profile?.experience_years != null,
    profile?.availability,
    profile?.work_preference,
  ];
  const filled = checks.filter(Boolean).length;
  return Math.round((filled / checks.length) * 100);
}

/* ─── Avatar ───────────────────────────────────────────────────── */
function Avatar({ name, size = 80 }) {
  const initials = name
    ? name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: 'linear-gradient(135deg, var(--blue-500), #7c3aed)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.35, fontWeight: 700, color: '#fff',
      flexShrink: 0, boxShadow: 'var(--shadow-md)',
    }}>
      {initials}
    </div>
  );
}

/* ─── Inline editable name ─────────────────────────────────────── */
function EditableName({ value, onSave }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!draft.trim()) return;
    setSaving(true);
    try {
      await onSave(draft.trim());
      setEditing(false);
      toast.success('Name updated');
    } catch {
      toast.error('Failed to update name');
    } finally {
      setSaving(false);
    }
  };

  if (editing) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input
          className="input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setEditing(false); }}
          style={{ fontSize: 22, fontWeight: 700, padding: '4px 10px', maxWidth: 260 }}
          autoFocus
        />
        <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 size={14} style={{ animation: 'spin 0.6s linear infinite' }} /> : <Check size={14} />}
        </button>
        <button className="btn btn-ghost btn-sm" onClick={() => { setEditing(false); setDraft(value); }}>
          <X size={14} />
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <h1 style={{ fontSize: 24, margin: 0 }}>{value}</h1>
      <button className="btn btn-ghost btn-sm" onClick={() => setEditing(true)} style={{ padding: '4px 6px' }}>
        <Edit3 size={14} color="var(--text-muted)" />
      </button>
    </div>
  );
}

/* ─── Section Wrapper ──────────────────────────────────────────── */
function Section({ icon: Icon, title, color = 'var(--accent)', children }) {
  return (
    <div className="card animate-fade-in" style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <div style={{
          width: 34, height: 34, borderRadius: 'var(--radius-md)',
          background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={17} color={color} />
        </div>
        <h2 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>{title}</h2>
      </div>
      {children}
    </div>
  );
}

/* ─── Field Group ──────────────────────────────────────────────── */
function Field({ label, children }) {
  return (
    <div className="input-group">
      <label className="input-label">{label}</label>
      {children}
    </div>
  );
}

/* ─── Case-insensitive deduplication helpers ──────────────────── */
function deduplicateTags(tagsArray) {
  if (!Array.isArray(tagsArray)) return [];
  const seen = new Set();
  const result = [];
  for (const item of tagsArray) {
    if (!item) continue;
    const str = String(item).trim();
    if (!str) continue;
    const key = str.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      result.push(str);
    }
  }
  return result;
}

function deduplicateCommaStr(str) {
  if (!str) return '';
  const arr = typeof str === 'string' ? str.split(',') : Array.isArray(str) ? str : [str];
  return deduplicateTags(arr).join(', ');
}

/* ─── Skills Tag Input ─────────────────────────────────────────── */
function TagInput({ value, onChange, placeholder = 'Add item…', accentColor = 'var(--accent)' }) {
  const [input, setInput] = useState('');
  const tags = value ? deduplicateTags(typeof value === 'string' ? value.split(',') : value) : [];

  const addTag = (rawInput) => {
    if (!rawInput || !rawInput.trim()) return;
    const newItems = rawInput.split(',').map((s) => s.trim()).filter(Boolean);
    const combined = deduplicateTags([...tags, ...newItems]);
    onChange(combined.join(', '));
    setInput('');
  };

  const removeTag = (tagToRemove) => {
    const remaining = tags.filter((t) => t.toLowerCase() !== tagToRemove.toLowerCase());
    onChange(remaining.join(', '));
  };

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
        {tags.map((tag) => (
          <span key={tag} style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '4px 10px', borderRadius: 'var(--radius-full)',
            background: accentColor + '18', color: accentColor,
            fontSize: 13, fontWeight: 500,
          }}>
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: accentColor, padding: 0, lineHeight: 1 }}
            >
              <X size={12} />
            </button>
          </span>
        ))}
        {tags.length === 0 && (
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Nothing added yet</span>
        )}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          className="input"
          placeholder={placeholder}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(input); }
          }}
          style={{ flex: 1 }}
        />
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => addTag(input)}>Add</button>
      </div>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>Press Enter or comma to add</p>
    </div>
  );
}

/* ─── Resume Review Panel ──────────────────────────────────────── */
function ResumeReviewPanel({ extracted, onApply, onDismiss }) {
  const raw = extracted.parsed_raw || {};
  const [bio, setBio] = useState(raw.bio || raw.summary || extracted.bio || '');
  const [currentTitle, setCurrentTitle] = useState(raw.current_title || extracted.current_title || '');
  const [targetTitle, setTargetTitle] = useState(raw.target_title || extracted.target_title || '');
  const [location, setLocation] = useState(raw.location || extracted.location || '');
  const [phone, setPhone] = useState(raw.phone || extracted.phone || '');
  const [linkedinUrl, setLinkedinUrl] = useState(raw.linkedin_url || extracted.linkedin_url || '');
  const [githubUrl, setGithubUrl] = useState(raw.github_url || extracted.github_url || '');
  const [portfolioUrl, setPortfolioUrl] = useState(raw.portfolio_url || raw.website_url || extracted.portfolio_url || '');
  const [education, setEducation] = useState(raw.education_summary || extracted.education || '');
  const [achievements, setAchievements] = useState(raw.achievements || extracted.achievements || '');

  const [skills, setSkills] = useState(extracted.skills || raw.skills || []);
  const [certs, setCerts] = useState(extracted.certifications || raw.certifications || []);
  const [courses, setCourses] = useState(extracted.courses || raw.courses || []);

  const removeItem = (setter) => (item) => setter((prev) => prev.filter((x) => x !== item));

  const TagGroup = ({ label, items, onRemove, color, emptyText }) => (
    <div style={{ marginBottom: 14 }}>
      <p style={{ fontSize: 11, fontWeight: 600, color, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
        {label} ({items.length})
      </p>
      {items.length === 0 ? (
        <p style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>{emptyText}</p>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {items.map((item) => (
            <span key={item} style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '3px 9px', borderRadius: 'var(--radius-full)',
              background: color + '18', color, fontSize: 12, fontWeight: 500,
              border: `1px solid ${color}30`,
            }}>
              {item}
              <button
                onClick={() => onRemove(item)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color, padding: 0, lineHeight: 1 }}
                title="Remove"
              >
                <X size={11} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div style={{
      border: '1px solid var(--border-accent)',
      borderRadius: 'var(--radius-lg)',
      background: 'var(--surface)',
      padding: 20,
      marginTop: 16,
      boxShadow: 'var(--shadow-md)',
      animation: 'fadeIn 0.3s ease',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <div style={{
          width: 34, height: 34, borderRadius: 'var(--radius-md)',
          background: 'linear-gradient(135deg, #7c3aed22, #3b82f622)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Sparkles size={18} color="#7c3aed" />
        </div>
        <div>
          <p style={{ fontWeight: 700, fontSize: 15, margin: 0, color: 'var(--text-primary)' }}>
            ✨ AI Resume Data Extracted
          </p>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
            Review and customize the bio, titles, contact info & skills extracted from your resume
          </p>
        </div>
      </div>

      {/* Grid of extracted metadata */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12, marginBottom: 16 }}>
        {/* Bio / Summary */}
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
            Professional Summary / Bio
          </label>
          <textarea
            className="input"
            rows={2}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="AI extracted bio/summary..."
            style={{ fontSize: 13, resize: 'vertical' }}
          />
        </div>

        {/* Current & Target Title */}
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
            Current Job Title
          </label>
          <input
            className="input"
            value={currentTitle}
            onChange={(e) => setCurrentTitle(e.target.value)}
            placeholder="e.g. Full Stack Developer"
            style={{ fontSize: 13 }}
          />
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
            Target Career Role
          </label>
          <input
            className="input"
            value={targetTitle}
            onChange={(e) => setTargetTitle(e.target.value)}
            placeholder="e.g. Senior Cloud Architect"
            style={{ fontSize: 13 }}
          />
        </div>

        {/* Location & Phone */}
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
            Location
          </label>
          <input
            className="input"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. San Francisco, CA"
            style={{ fontSize: 13 }}
          />
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
            Phone Number
          </label>
          <input
            className="input"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="e.g. +1 555-0199"
            style={{ fontSize: 13 }}
          />
        </div>

        {/* Links */}
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
            LinkedIn URL
          </label>
          <input
            className="input"
            value={linkedinUrl}
            onChange={(e) => setLinkedinUrl(e.target.value)}
            placeholder="https://linkedin.com/in/..."
            style={{ fontSize: 13 }}
          />
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
            GitHub URL
          </label>
          <input
            className="input"
            value={githubUrl}
            onChange={(e) => setGithubUrl(e.target.value)}
            placeholder="https://github.com/..."
            style={{ fontSize: 13 }}
          />
        </div>
      </div>

      {/* Tag Groups */}
      <TagGroup
        label="Extracted Skills"
        items={skills}
        onRemove={removeItem(setSkills)}
        color="var(--accent)"
        emptyText="No skills extracted"
      />
      <TagGroup
        label="Certifications"
        items={certs}
        onRemove={removeItem(setCerts)}
        color="#7c3aed"
        emptyText="No certifications found"
      />
      <TagGroup
        label="Courses & Training"
        items={courses}
        onRemove={removeItem(setCourses)}
        color="#059669"
        emptyText="No courses found"
      />

      {/* Actions */}
      <div style={{ display: 'flex', gap: 10, marginTop: 14, justifyContent: 'flex-end' }}>
        <button className="btn btn-ghost btn-sm" onClick={onDismiss}>
          Dismiss
        </button>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => onApply({
            bio,
            current_title: currentTitle,
            target_title: targetTitle,
            location,
            phone,
            linkedin_url: linkedinUrl,
            github_url: githubUrl,
            portfolio_url: portfolioUrl,
            education,
            achievements,
            skills,
            certifications: certs,
            courses,
            full_name: raw.full_name,
          })}
          style={{
            background: 'linear-gradient(135deg, #7c3aed, var(--blue-500))',
            border: 'none',
            padding: '8px 16px',
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          <Sparkles size={14} />
          Autofill Complete Profile
        </button>
      </div>
    </div>
  );
}

/* ─── Resume Upload Card ───────────────────────────────────────── */
function ResumeUploadSection({ onExtracted }) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [extracted, setExtracted] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const inputRef = useRef(null);

  const handleFile = useCallback(async (file) => {
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['pdf', 'doc', 'docx', 'txt'].includes(ext)) {
      toast.error('Please upload a PDF, DOCX, DOC, or TXT file');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File must be under 10 MB');
      return;
    }

    setUploading(true);
    setUploadProgress(10);
    setExtracted(null);
    setUploadedFile(file.name);

    try {
      // Step 1: Upload file — server responds instantly (202)
      const res = await resumesAPI.upload(file, (e) => {
        if (e.total) setUploadProgress(Math.max(10, Math.round((e.loaded / e.total) * 60)));
      });
      const resumeId = res.data.id;
      setUploadProgress(60);

      // Step 2: Poll /status until parse_status === 'done' or 'error'
      const MAX_WAIT_MS  = 5 * 60 * 1000;  // 5 min
      const INTERVAL_MS  = 3000;
      const started = Date.now();

      await new Promise((resolve, reject) => {
        const timer = setInterval(async () => {
          if (Date.now() - started > MAX_WAIT_MS) {
            clearInterval(timer);
            reject(new Error('Analysis timed out'));
            return;
          }
          try {
            const statusRes = await resumesAPI.getStatus(resumeId);
            const { parse_status } = statusRes.data;
            // Animate progress bar while waiting
            setUploadProgress((p) => Math.min(p + 5, 92));

            if (parse_status === 'done') {
              clearInterval(timer);
              setUploadProgress(100);
              setExtracted({
                skills:          statusRes.data.parsed_skills          || [],
                certifications:  statusRes.data.parsed_certifications  || [],
                courses:         statusRes.data.parsed_courses          || [],
                parsed_raw:      statusRes.data.parsed_raw              || {},
              });
              toast.success('Resume processed! Review the extracted data below.');
              resolve();
            } else if (parse_status === 'error') {
              clearInterval(timer);
              reject(new Error('AI analysis failed'));
            }
          } catch (pollErr) {
            // Network blip — keep polling
          }
        }, INTERVAL_MS);
      });

    } catch (err) {
      const detail = err?.response?.data?.detail;
      toast.error(detail || err.message || 'Failed to process resume. Please try again.');
      setUploadedFile(null);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }, []);

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const onInputChange = (e) => {
    const file = e.target.files[0];
    if (file) handleFile(file);
    e.target.value = '';
  };

  const handleApply = (data) => {
    onExtracted(data);
    setExtracted(null);
    toast.success('Profile updated with resume data!');
  };

  return (
    <div className="card animate-fade-in" style={{ marginBottom: 16, background: 'linear-gradient(135deg, #7c3aed08, #3b82f608)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <div style={{
          width: 34, height: 34, borderRadius: 'var(--radius-md)',
          background: 'linear-gradient(135deg, #7c3aed22, #3b82f622)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <FileText size={17} color="#7c3aed" />
        </div>
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>Update Profile from Resume</h2>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
            Upload your resume to auto-extract skills, certifications & courses
          </p>
        </div>
      </div>

      {/* Drop zone */}
      <div
        id="resume-dropzone"
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => !uploading && inputRef.current?.click()}
        style={{
          border: `2px dashed ${dragging ? '#7c3aed' : 'var(--border)'}`,
          borderRadius: 'var(--radius-lg)',
          padding: '28px 20px',
          textAlign: 'center',
          cursor: uploading ? 'default' : 'pointer',
          background: dragging ? '#7c3aed08' : 'transparent',
          transition: 'all 0.2s ease',
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.doc,.docx,.txt"
          style={{ display: 'none' }}
          onChange={onInputChange}
          id="resume-file-input"
        />

        {uploading ? (
          <div>
            <Loader2 size={32} color="#7c3aed" style={{ animation: 'spin 0.8s linear infinite', marginBottom: 10 }} />
            <p style={{ fontWeight: 600, fontSize: 14, margin: '0 0 8px', color: '#7c3aed' }}>
              AI is analyzing your resume…
            </p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 12px' }}>
              Extracting skills, certifications & courses
            </p>
            {/* Progress bar */}
            <div style={{
              height: 4, borderRadius: 2, background: 'var(--border)',
              maxWidth: 240, margin: '0 auto', overflow: 'hidden',
            }}>
              <div style={{
                height: '100%', borderRadius: 2,
                background: 'linear-gradient(90deg, #7c3aed, var(--blue-500))',
                width: `${uploadProgress || 30}%`,
                transition: 'width 0.3s ease',
              }} />
            </div>
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              <Upload size={28} color="#7c3aed" />
            </div>
            {uploadedFile ? (
              <div>
                <p style={{ fontWeight: 600, fontSize: 14, margin: '0 0 4px' }}>
                  ✅ {uploadedFile}
                </p>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
                  style={{ marginTop: 8, fontSize: 12, color: '#7c3aed' }}
                >
                  <RefreshCw size={12} /> Upload a different resume
                </button>
              </div>
            ) : (
              <div>
                <p style={{ fontWeight: 600, fontSize: 14, margin: '0 0 6px' }}>
                  Drop your resume here
                </p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 12px' }}>
                  PDF, DOCX, DOC, TXT · Max 10 MB
                </p>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    inputRef.current?.click();
                  }}
                >
                  Browse Files
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Review panel appears below drop zone */}
      {extracted && (
        <ResumeReviewPanel
          extracted={extracted}
          onApply={handleApply}
          onDismiss={() => setExtracted(null)}
        />
      )}
    </div>
  );
}

/* ─── Main Page ────────────────────────────────────────────────── */
export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userName, setUserName] = useState(user?.full_name || '');
  const [urlErrors, setUrlErrors] = useState({});

  useEffect(() => {
    usersAPI.getProfile()
      .then((r) => {
        setProfile(r.data);
        setForm(r.data);
      })
      .catch(() => toast.error('Failed to load profile'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setUserName(user?.full_name || '');
  }, [user]);

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const [autofilling, setAutofilling] = useState(false);

  /* Merge resume extracted data into form — unions with existing values without duplicates */
  const handleResumeExtracted = useCallback((data) => {
    setForm((f) => {
      const merge = (existing, incoming) => {
        const existingArr = existing ? (typeof existing === 'string' ? existing.split(',') : existing) : [];
        const incomingArr = incoming ? (typeof incoming === 'string' ? incoming.split(',') : incoming) : [];
        return deduplicateTags([...existingArr, ...incomingArr]).join(', ');
      };
      return {
        ...f,
        bio: data.bio || f.bio || '',
        current_title: data.current_title || f.current_title || '',
        target_title: data.target_title || f.target_title || '',
        location: data.location || f.location || '',
        phone: data.phone || f.phone || '',
        linkedin_url: data.linkedin_url || f.linkedin_url || '',
        github_url: data.github_url || f.github_url || '',
        portfolio_url: data.portfolio_url || f.portfolio_url || '',
        education: data.education || f.education || '',
        achievements: data.achievements || f.achievements || '',
        skills: merge(f.skills, data.skills),
        certifications: merge(f.certifications, data.certifications),
        courses: merge(f.courses, data.courses),
      };
    });
    if (data.full_name && data.full_name.trim()) {
      handleNameSave(data.full_name.trim());
    }
  }, []);

  const handleAutofillAI = async () => {
    setAutofilling(true);
    try {
      const res = await usersAPI.autofillProfile(null, true);
      setForm(res.data);
      setProfile(res.data);
      toast.success('✨ Profile autofilled with AI resume data!');
    } catch (err) {
      const detail = err?.response?.data?.detail;
      toast.error(detail || 'Upload a resume first to autofill your profile.');
    } finally {
      setAutofilling(false);
    }
  };

  const handleSave = async () => {
    const errors = validateUrls(form);
    setUrlErrors(errors);
    if (Object.keys(errors).length > 0) {
      toast.error('Please fix the invalid URLs before saving.');
      document.getElementById('social-links-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    const cleanedForm = {
      ...form,
      skills: deduplicateCommaStr(form.skills),
      certifications: deduplicateCommaStr(form.certifications),
      courses: deduplicateCommaStr(form.courses),
      languages: deduplicateCommaStr(form.languages),
    };

    setSaving(true);
    try {
      const res = await usersAPI.updateProfile(cleanedForm);
      setProfile(res.data);
      setForm(res.data);
      toast.success('Profile saved successfully!');
    } catch (err) {
      const detail = err?.response?.data?.detail;
      console.error('Profile save error:', err?.response?.data || err.message);
      toast.error(detail ? `Error: ${detail}` : 'Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleNameSave = async (name) => {
    await usersAPI.updateMe({ full_name: name });
    setUserName(name);
    await refreshUser();
  };

  const completeness = calcCompleteness({ ...user, full_name: userName }, form);

  if (loading) {
    return (
      <div className="page-wrapper">
        <div className="container page-content">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton" style={{ height: 180, marginBottom: 16, borderRadius: 'var(--radius-lg)' }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <div className="container page-content" style={{ maxWidth: 760 }}>

        {/* ── Header Card ─────────────────────────── */}
        <div className="card animate-fade-in" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap' }}>
            <Avatar name={userName} size={76} />
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <EditableName value={userName} onSave={handleNameSave} />
                  <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: '4px 0 12px' }}>
                    {user?.email}
                  </p>
                </div>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={handleAutofillAI}
                  disabled={autofilling}
                  style={{
                    background: 'linear-gradient(135deg, #7c3aed, var(--blue-500))',
                    border: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 14px',
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                  title="Autofill profile fields from your latest AI analyzed resume"
                >
                  {autofilling ? (
                    <Loader2 size={14} style={{ animation: 'spin 0.6s linear infinite' }} />
                  ) : (
                    <Sparkles size={14} />
                  )}
                  ✨ AI Autofill Profile
                </button>
              </div>

              {/* Completeness bar */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)' }}>
                    Profile completeness
                  </span>
                  <span style={{
                    fontSize: 12, fontWeight: 600,
                    color: completeness >= 80 ? 'var(--green-600)' : completeness >= 50 ? 'var(--amber-600)' : 'var(--accent)',
                  }}>
                    {completeness}%
                  </span>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${completeness}%`,
                      background: completeness >= 80
                        ? 'var(--green-500)'
                        : completeness >= 50
                          ? 'var(--amber-500)'
                          : 'var(--accent)',
                    }}
                  />
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
                  {completeness < 100
                    ? 'Complete your profile to get better job & course recommendations'
                    : '🎉 Your profile is 100% complete!'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Resume Upload ────────────────────────── */}
        <ResumeUploadSection onExtracted={handleResumeExtracted} />

        {/* ── About ───────────────────────────────── */}
        <Section icon={User} title="About" color="var(--blue-500)">
          <Field label="Bio / Professional Summary">
            <textarea
              className="input"
              rows={4}
              placeholder="Tell us about yourself, your background, and what you're passionate about…"
              value={form.bio || ''}
              onChange={(e) => set('bio', e.target.value)}
              style={{ resize: 'vertical', lineHeight: 1.6 }}
            />
          </Field>
        </Section>

        {/* ── Personal Info ────────────────────────── */}
        <Section icon={MapPin} title="Personal Info" color="#7c3aed">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            <Field label="Location">
              <input
                className="input" placeholder="e.g. Bengaluru, India"
                value={form.location || ''}
                onChange={(e) => set('location', e.target.value)}
              />
            </Field>
            <Field label="Phone">
              <input
                className="input" placeholder="+91 98765 43210"
                value={form.phone || ''}
                onChange={(e) => set('phone', e.target.value)}
              />
            </Field>
            <Field label="Availability">
              <select
                className="input"
                value={form.availability || ''}
                onChange={(e) => set('availability', e.target.value)}
                style={{ cursor: 'pointer' }}
              >
                <option value="">— Select —</option>
                {AVAILABILITY_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </Field>
            <Field label="Work Preference">
              <select
                className="input"
                value={form.work_preference || ''}
                onChange={(e) => set('work_preference', e.target.value)}
                style={{ cursor: 'pointer' }}
              >
                <option value="">— Select —</option>
                {WORK_PREF_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </Field>
            <Field label="Salary Expectation">
              <input
                className="input" placeholder="e.g. ₹12–18 LPA or $80k–100k"
                value={form.salary_expectation || ''}
                onChange={(e) => set('salary_expectation', e.target.value)}
              />
            </Field>
          </div>
        </Section>

        {/* ── Social & Links ───────────────────────── */}
        <div id="social-links-section">
          <Section icon={Link2} title="Social Links" color="#059669">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                { key: 'linkedin_url', label: 'LinkedIn', icon: ExternalLink, placeholder: 'https://linkedin.com/in/yourname' },
                { key: 'github_url', label: 'GitHub', icon: Code2, placeholder: 'https://github.com/yourname' },
                { key: 'twitter_url', label: 'Twitter / X', icon: AtSign, placeholder: 'https://twitter.com/yourname or https://x.com/yourname' },
                { key: 'website_url', label: 'Personal Website', icon: Globe, placeholder: 'https://yourwebsite.com' },
                { key: 'portfolio_url', label: 'Portfolio', icon: Star, placeholder: 'https://yourportfolio.com' },
              ].map(({ key, label, icon: Icon, placeholder }) => {
                const hasError = !!urlErrors[key];
                return (
                  <Field key={key} label={label}>
                    <div style={{ position: 'relative' }}>
                      <Icon
                        size={15}
                        color={hasError ? 'var(--red-500)' : 'var(--text-muted)'}
                        style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
                      />
                      <input
                        className="input"
                        placeholder={placeholder}
                        value={form[key] || ''}
                        onChange={(e) => {
                          set(key, e.target.value);
                          if (urlErrors[key]) setUrlErrors((prev) => { const n = { ...prev }; delete n[key]; return n; });
                        }}
                        onBlur={(e) => {
                          const val = e.target.value.trim();
                          const rule = URL_VALIDATORS[key];
                          if (val && rule && !rule.pattern.test(val)) {
                            setUrlErrors((prev) => ({ ...prev, [key]: rule.hint }));
                          }
                        }}
                        style={{
                          paddingLeft: 36,
                          borderColor: hasError ? 'var(--red-500)' : undefined,
                          boxShadow: hasError ? '0 0 0 3px rgba(240, 68, 56, 0.15)' : undefined,
                        }}
                      />
                    </div>
                    {hasError && (
                      <div style={{
                        display: 'flex', alignItems: 'flex-start', gap: 6,
                        marginTop: 6, padding: '7px 10px',
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--red-50)',
                        border: '1px solid rgba(240, 68, 56, 0.25)',
                      }}>
                        <X size={13} color="var(--red-500)" style={{ marginTop: 1, flexShrink: 0 }} />
                        <span style={{ fontSize: 12, color: 'var(--red-600)', lineHeight: 1.5 }}>
                          {urlErrors[key]}
                        </span>
                      </div>
                    )}
                  </Field>
                );
              })}
            </div>
          </Section>
        </div>

        {/* ── Experience ───────────────────────────── */}
        <Section icon={Briefcase} title="Experience" color="var(--amber-500)">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            <Field label="Current Title">
              <input
                className="input" placeholder="e.g. Software Engineer"
                value={form.current_title || ''}
                onChange={(e) => set('current_title', e.target.value)}
              />
            </Field>
            <Field label="Target / Dream Title">
              <input
                className="input" placeholder="e.g. Senior ML Engineer"
                value={form.target_title || ''}
                onChange={(e) => set('target_title', e.target.value)}
              />
            </Field>
            <Field label="Years of Experience">
              <input
                className="input" type="number" min={0} max={50} placeholder="0"
                value={form.experience_years ?? ''}
                onChange={(e) => set('experience_years', e.target.value === '' ? null : parseInt(e.target.value, 10))}
              />
            </Field>
            <Field label="Languages Spoken">
              <input
                className="input" placeholder="e.g. English, Hindi, Tamil"
                value={form.languages || ''}
                onChange={(e) => set('languages', e.target.value)}
              />
            </Field>
          </div>
        </Section>

        {/* ── Skills ───────────────────────────────── */}
        <Section icon={Zap} title="Skills" color="#dc2626">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <Field label="Technical & Soft Skills">
              <TagInput
                value={form.skills || ''}
                onChange={(val) => set('skills', val)}
                placeholder="e.g. React, Python, Machine Learning…"
                accentColor="var(--accent)"
              />
            </Field>
            <Field label="Interests / Hobbies">
              <textarea
                className="input"
                rows={3}
                placeholder="e.g. Open source, competitive programming, photography, hiking…"
                value={form.interests || ''}
                onChange={(e) => set('interests', e.target.value)}
                style={{ resize: 'vertical' }}
              />
            </Field>
          </div>
        </Section>

        {/* ── Certifications ───────────────────────── */}
        <Section icon={Award} title="Certifications" color="#7c3aed">
          <Field label="Professional Certifications">
            <TagInput
              value={form.certifications || ''}
              onChange={(val) => set('certifications', val)}
              placeholder="e.g. AWS Solutions Architect, PMP, Google Cloud…"
              accentColor="#7c3aed"
            />
          </Field>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
            Add certifications from your resume or manually type them in
          </p>
        </Section>

        {/* ── Courses ──────────────────────────────── */}
        <Section icon={BookOpen} title="Courses & Training" color="#059669">
          <Field label="Online Courses, Bootcamps & Training">
            <TagInput
              value={form.courses || ''}
              onChange={(val) => set('courses', val)}
              placeholder="e.g. Deep Learning Specialization – Coursera…"
              accentColor="#059669"
            />
          </Field>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
            Add courses from your resume or manually type them in
          </p>
        </Section>

        {/* ── Education & Achievements ─────────────── */}
        <Section icon={GraduationCap} title="Education & Achievements" color="#7c3aed">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Field label="Education Background">
              <textarea
                className="input"
                rows={3}
                placeholder={`e.g. B.Tech Computer Science, IIT Delhi (2020–2024)\nRelevant coursework: Algorithms, ML, Distributed Systems`}
                value={form.education || ''}
                onChange={(e) => set('education', e.target.value)}
                style={{ resize: 'vertical' }}
              />
            </Field>
            <Field label="Notable Achievements">
              <textarea
                className="input"
                rows={3}
                placeholder={`e.g. Winner of XYZ Hackathon 2023\nContributed to Apache Kafka (500+ GitHub stars)\nPublished research in IEEE Journal`}
                value={form.achievements || ''}
                onChange={(e) => set('achievements', e.target.value)}
                style={{ resize: 'vertical' }}
              />
            </Field>
          </div>
        </Section>

        {/* ── Save Button ──────────────────────────── */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, paddingBottom: 32 }}>
          <button
            className="btn btn-primary btn-lg"
            onClick={handleSave}
            disabled={saving}
            id="save-profile-btn"
          >
            {saving
              ? <><Loader2 size={16} style={{ animation: 'spin 0.6s linear infinite' }} /> Saving…</>
              : <><Save size={16} /> Save Profile</>
            }
          </button>
        </div>

      </div>
    </div>
  );
}
