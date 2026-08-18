import { useState, useCallback, useRef } from 'react';
import { Upload, CheckCircle, Loader, AlertCircle, Brain, Zap, Target, Sparkles, ArrowRight } from 'lucide-react';
import { resumesAPI } from '../api/client';
import toast from 'react-hot-toast';

// Polling interval in ms
const POLL_INTERVAL = 3000;
const POLL_TIMEOUT  = 5 * 60 * 1000; // 5 minutes max

const PARSING_STAGES = [
  { key: 'extract', label: 'Extracting Text', icon: Zap, pct: 25 },
  { key: 'parse', label: 'AI Skills Analysis', icon: Brain, pct: 55 },
  { key: 'ats', label: 'ATS & Skill Gaps', icon: Target, pct: 85 },
  { key: 'career', label: 'Career Path AI', icon: Sparkles, pct: 100 },
];

function PremiumParsingCard({ activeStep, onCancel }) {
  const currentStageIdx = PARSING_STAGES.findIndex((s) => s.key === activeStep);
  const activeStage = PARSING_STAGES[Math.max(0, currentStageIdx)] || PARSING_STAGES[1];
  const progressPct = activeStage.pct;

  return (
    <div style={{
      background: '#ffffff',
      border: '1px solid #e0e7ff',
      borderRadius: 'var(--radius-lg)',
      padding: '24px 28px',
      boxShadow: '0 10px 25px -5px rgba(79, 70, 229, 0.08), 0 8px 10px -6px rgba(79, 70, 229, 0.04)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background ambient gradient glow */}
      <div style={{
        position: 'absolute', top: -40, right: -40, width: 140, height: 140,
        background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, rgba(255, 255, 255, 0) 70%)',
        pointerEvents: 'none',
      }} />

      {/* Card Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 12,
            background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)',
          }}>
            <Brain size={22} color="#ffffff" style={{ animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: '#0f172a' }}>
                Analyzing Your Resume
              </h3>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '2px 8px', borderRadius: 99, background: '#e0e7ff',
                color: '#4338ca', fontSize: 11, fontWeight: 700,
              }}>
                <span style={{
                  width: 6, height: 6, borderRadius: '50%', background: '#4f46e5',
                  boxShadow: '0 0 6px #4f46e5',
                }} />
                AI ACTIVE
              </span>
            </div>
            <p style={{ fontSize: 13, color: '#64748b', margin: '2px 0 0 0' }}>
              {activeStage.label}...
            </p>
          </div>
        </div>
        <span style={{ fontSize: 18, fontWeight: 800, color: '#4f46e5' }}>
          {progressPct}%
        </span>
      </div>

      {/* Animated Gradient Progress Bar */}
      <div style={{
        height: 8, width: '100%', background: '#f1f5f9', borderRadius: 99,
        overflow: 'hidden', marginBottom: 20, position: 'relative',
      }}>
        <div style={{
          height: '100%', width: `${progressPct}%`,
          background: 'linear-gradient(90deg, #4f46e5, #818cf8, #4f46e5)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 2s linear infinite',
          borderRadius: 99,
          transition: 'width 0.5s ease-in-out',
        }} />
      </div>

      {/* Horizontal Stage Stepper */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8,
        borderTop: '1px solid #f1f5f9', paddingTop: 16,
      }}>
        {PARSING_STAGES.map((stage, idx) => {
          const isDone = idx < currentStageIdx;
          const isCurrent = idx === currentStageIdx || (currentStageIdx === -1 && idx === 0);
          const Icon = stage.icon;

          return (
            <div key={stage.key} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 6,
              opacity: isDone || isCurrent ? 1 : 0.45,
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: isDone ? '#ecfdf5' : isCurrent ? '#e0e7ff' : '#f8fafc',
                border: `1.5px solid ${isDone ? '#10b981' : isCurrent ? '#4f46e5' : '#cbd5e1'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: isDone ? '#10b981' : isCurrent ? '#4f46e5' : '#64748b',
                boxShadow: isCurrent ? '0 0 0 3px rgba(79, 70, 229, 0.15)' : 'none',
                transition: 'all 0.3s ease',
              }}>
                {isDone ? <CheckCircle size={16} /> : <Icon size={15} />}
              </div>
              <span style={{
                fontSize: 11.5, fontWeight: isCurrent ? 700 : 500,
                color: isCurrent ? '#4f46e5' : isDone ? '#065f46' : '#64748b',
                lineHeight: 1.25,
              }}>
                {stage.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Footer hint */}
      <div style={{
        marginTop: 18, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        fontSize: 12, color: '#64748b', borderTop: '1px solid #f8fafc', paddingTop: 12,
      }}>
        <span>💡 AI intelligence extraction in progress. You can browse other pages.</span>
        <button
          onClick={onCancel}
          style={{
            background: 'none', border: 'none', color: '#64748b', fontSize: 12,
            fontWeight: 500, cursor: 'pointer', textDecoration: 'underline',
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export default function ResumeUpload({ onUploadSuccess }) {
  const [dragging, setDragging] = useState(false);
  const [phase, setPhase] = useState('idle'); // idle | uploading | processing | done | error
  const [activeStep, setActiveStep] = useState(null);
  const [result, setResult] = useState(null);
  const [uploadPct, setUploadPct] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const pollRef = useRef(null);
  const fileInputRef = useRef(null);

  const stopPolling = () => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  };

  const startPolling = useCallback((resumeId) => {
    setActiveStep('parse');
    const started = Date.now();

    pollRef.current = setInterval(async () => {
      if (Date.now() - started > POLL_TIMEOUT) {
        stopPolling();
        setPhase('error');
        setErrorMessage('Analysis timed out. Please try again.');
        toast.error('Analysis timed out. Please try again.');
        return;
      }

      try {
        const res = await resumesAPI.getStatus(resumeId);
        const { parse_status } = res.data;

        if (parse_status === 'processing') {
          setActiveStep((prev) => {
            const idx = PARSING_STAGES.findIndex((s) => s.key === prev);
            return PARSING_STAGES[Math.min(idx + 1, PARSING_STAGES.length - 1)].key;
          });
        } else if (parse_status === 'done') {
          stopPolling();
          setPhase('done');
          setActiveStep(null);
          setResult(res.data);
          toast.success('Resume analyzed successfully!');
          if (onUploadSuccess) onUploadSuccess(res.data);
        } else if (parse_status === 'error') {
          stopPolling();
          setPhase('error');
          setErrorMessage('AI analysis encountered an issue. Please try again.');
          toast.error('AI analysis failed. Please try again.');
        }
      } catch {
        // Network blip — keep polling
      }
    }, POLL_INTERVAL);
  }, [onUploadSuccess]);

  const handleFile = useCallback(async (file) => {
    if (!file) return;
    const allowed = ['.pdf', '.docx', '.doc', '.txt'];
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    if (!allowed.includes(ext)) { toast.error('Please upload a PDF, DOCX, or TXT file'); return; }

    stopPolling();
    setPhase('uploading');
    setActiveStep('extract');
    setResult(null);
    setUploadPct(0);
    setErrorMessage('');

    try {
      const res = await resumesAPI.upload(file, (e) => {
        if (e.total) setUploadPct(Math.round((e.loaded / e.total) * 100));
      });

      setPhase('processing');
      startPolling(res.data.id);
    } catch (err) {
      setPhase('error');
      const msg = err.response?.data?.detail || 'Upload failed. Please try again.';
      setErrorMessage(msg);
      toast.error(msg, { duration: 6000 });
    }
  }, [startPolling]);

  const onDrop = (e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); };
  const onInput = (e) => { handleFile(e.target.files[0]); e.target.value = ''; };
  const isActive = phase === 'uploading' || phase === 'processing';

  const reset = () => { stopPolling(); setPhase('idle'); setResult(null); setActiveStep(null); setErrorMessage(''); };

  return (
    <div>
      {/* Drop Zone — hide while processing / done */}
      {phase !== 'processing' && phase !== 'done' && (
        <div
          onClick={() => !isActive && fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: 12, padding: '40px 24px', borderRadius: 16,
            border: `2px dashed ${dragging ? '#4f46e5' : '#e2e8f0'}`,
            background: dragging ? '#e0e7ff' : '#f8fafc',
            cursor: isActive ? 'not-allowed' : 'pointer',
            transition: 'all 0.25s',
            opacity: isActive ? 0.7 : 1,
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.doc,.txt"
            onChange={onInput}
            style={{ display: 'none' }}
            disabled={isActive}
          />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 8 }}>
            {phase === 'uploading'
              ? <Loader size={32} color="#4f46e5" style={{ animation: 'spin 1s linear infinite' }} />
              : phase === 'error'
                ? <AlertCircle size={32} color="#dc2626" />
                : <Upload size={32} color="#4f46e5" />}
          </div>

          <div style={{ textAlign: 'center' }}>
            <p style={{ color: '#0f172a', fontWeight: 600, fontSize: 15, marginBottom: 4 }}>
              {phase === 'uploading' ? `Uploading… ${uploadPct}%`
                : phase === 'error' ? 'Upload failed — try again'
                : 'Drop your resume here'}
            </p>
            <p style={{ fontSize: 13, color: '#64748b' }}>PDF, DOCX, or TXT • Max 10 MB</p>
          </div>
          {!isActive && (
            <button
              className="btn btn-secondary btn-sm"
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              style={{ marginTop: 4 }}
            >
              Browse Files
            </button>
          )}
        </div>
      )}

      {/* Rejection Alert Box */}
      {phase === 'error' && errorMessage && (
        <div style={{
          padding: '14px 16px', borderRadius: 10,
          background: '#fef2f2', border: '1px solid #fecaca',
          color: '#991b1b', fontSize: 13, lineHeight: 1.5, marginTop: 14,
          display: 'flex', alignItems: 'flex-start', gap: 12,
        }}>
          <AlertCircle size={20} style={{ flexShrink: 0, marginTop: 1, color: '#dc2626' }} />
          <div>
            <strong style={{ fontWeight: 700, display: 'block', marginBottom: 2 }}>Document Rejected:</strong>
            {errorMessage}
          </div>
        </div>
      )}

      {/* Modern Premium Parsing progress card */}
      {phase === 'processing' && (
        <PremiumParsingCard activeStep={activeStep} onCancel={reset} />
      )}

      {/* Result card */}
      {phase === 'done' && result && (
        <div className="card" style={{ background: '#f0fdf4', borderColor: '#bbf7d0', padding: 24 }}>
          <div className="flex items-center gap-3" style={{ marginBottom: 16 }}>
            <CheckCircle size={22} color="#166534" />
            <span style={{ fontWeight: 700, color: '#166534', fontSize: 16 }}>Resume Successfully Analyzed!</span>
            <span className="badge badge-green" style={{ marginLeft: 'auto', fontSize: 13, fontWeight: 700, padding: '4px 10px' }}>
              ATS Score: {result.ats_score?.toFixed(0) ?? 0}/100
            </span>
          </div>

          {result.parsed_skills?.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <p style={{ fontSize: 12, color: '#475467', marginBottom: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Detected Skills ({result.parsed_skills.length})
              </p>
              <div className="flex" style={{ flexWrap: 'wrap', gap: 6, maxHeight: 180, overflowY: 'auto', paddingRight: 4 }}>
                {result.parsed_skills.map((s) => (
                  <span key={s} className="badge badge-violet">{s}</span>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button onClick={reset} className="btn btn-secondary btn-sm">
              Upload another resume
            </button>
            <a href={`/career?resume=${result.id}`} className="btn btn-primary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              View Full AI Analysis <ArrowRight size={14} />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
