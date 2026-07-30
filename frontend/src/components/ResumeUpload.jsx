import { useState, useCallback, useRef } from 'react';
import { Upload, CheckCircle, Loader, AlertCircle, Brain, Zap, Target, TrendingUp } from 'lucide-react';
import { resumesAPI } from '../api/client';
import toast from 'react-hot-toast';

// Polling interval in ms
const POLL_INTERVAL = 3000;
const POLL_TIMEOUT  = 5 * 60 * 1000; // 5 minutes max

const STEPS = [
  { key: 'upload',  label: 'Uploading file',         icon: Upload   },
  { key: 'extract', label: 'Extracting text',         icon: Zap      },
  { key: 'parse',   label: 'Parsing resume with AI',  icon: Brain    },
  { key: 'ats',     label: 'Scoring ATS & skill gaps', icon: Target   },
  { key: 'career',  label: 'Predicting career paths',  icon: TrendingUp },
];

function StepIndicator({ activeStep }) {
  const activeIdx = STEPS.findIndex((s) => s.key === activeStep);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, margin: '16px 0' }}>
      {STEPS.map((step, idx) => {
        const done    = idx < activeIdx;
        const current = idx === activeIdx;
        const Icon    = step.icon;
        return (
          <div key={step.key} className="flex items-center gap-10"
            style={{ opacity: idx > activeIdx ? 0.35 : 1, transition: 'opacity 0.3s' }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: done
                ? 'rgba(34,197,94,0.2)'
                : current
                  ? 'rgba(124,58,237,0.25)'
                  : 'rgba(255,255,255,0.05)',
              border: `1px solid ${done ? 'rgba(34,197,94,0.5)' : current ? 'rgba(124,58,237,0.5)' : 'rgba(255,255,255,0.1)'}`,
            }}>
              {done
                ? <CheckCircle size={14} color="#86efac" />
                : current
                  ? <Loader size={14} color="var(--violet-light)" style={{ animation: 'spin-slow 1s linear infinite' }} />
                  : <Icon size={14} color="var(--text-muted)" />}
            </div>
            <span style={{
              fontSize: 13,
              fontWeight: current ? 600 : 400,
              color: done ? '#86efac' : current ? 'var(--text-primary)' : 'var(--text-muted)',
            }}>
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function ResumeUpload({ onUploadSuccess }) {
  const [dragging,   setDragging]   = useState(false);
  const [phase,      setPhase]      = useState('idle'); // idle | uploading | processing | done | error
  const [activeStep, setActiveStep] = useState(null);
  const [result,     setResult]     = useState(null);
  const [uploadPct,  setUploadPct]  = useState(0);
  const pollRef = useRef(null);
  const fileInputRef = useRef(null);

  const stopPolling = () => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  };

  const startPolling = useCallback((resumeId) => {
    setActiveStep('parse');
    const started = Date.now();

    pollRef.current = setInterval(async () => {
      // Timeout guard
      if (Date.now() - started > POLL_TIMEOUT) {
        stopPolling();
        setPhase('error');
        toast.error('Analysis timed out. Please try again.');
        return;
      }

      try {
        const res = await resumesAPI.getStatus(resumeId);
        const { parse_status } = res.data;

        if (parse_status === 'processing') {
          // Cycle through visible steps to show activity
          setActiveStep((prev) => {
            const idx = STEPS.findIndex((s) => s.key === prev);
            return STEPS[Math.min(idx + 1, STEPS.length - 1)].key;
          });
        } else if (parse_status === 'done') {
          stopPolling();
          setPhase('done');
          setActiveStep(null);
          setResult(res.data);
          toast.success('Resume analysed successfully!');
          if (onUploadSuccess) onUploadSuccess(res.data);
        } else if (parse_status === 'error') {
          stopPolling();
          setPhase('error');
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
    setActiveStep('upload');
    setResult(null);
    setUploadPct(0);

    try {
      // Upload — backend responds immediately (202)
      setActiveStep('extract');
      const res = await resumesAPI.upload(file, (e) => {
        if (e.total) setUploadPct(Math.round((e.loaded / e.total) * 100));
      });

      // Backend acknowledged — start polling for AI results
      setPhase('processing');
      startPolling(res.data.id);
    } catch (err) {
      setPhase('error');
      toast.error(err.response?.data?.detail || 'Upload failed. Please try again.');
    }
  }, [startPolling]);

  const onDrop   = (e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); };
  const onInput  = (e) => { handleFile(e.target.files[0]); e.target.value = ''; };
  const isActive = phase === 'uploading' || phase === 'processing';

  const reset = () => { stopPolling(); setPhase('idle'); setResult(null); setActiveStep(null); };

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
            border: `2px dashed ${dragging ? 'var(--violet)' : 'rgba(255,255,255,0.12)'}`,
            background: dragging ? 'rgba(124,58,237,0.08)' : 'rgba(255,255,255,0.02)',
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
              ? <Loader size={32} color="var(--violet-light)" style={{ animation: 'spin-slow 1s linear infinite' }} />
              : phase === 'error'
                ? <AlertCircle size={32} color="#f87171" />
                : <Upload size={32} color="var(--violet-light)" style={{ animation: 'float 3s ease-in-out infinite' }} />}
          </div>

          <div style={{ textAlign: 'center' }}>
            <p style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 15, marginBottom: 4 }}>
              {phase === 'uploading' ? `Uploading… ${uploadPct}%`
                : phase === 'error'   ? 'Upload failed — try again'
                : 'Drop your resume here'}
            </p>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>PDF, DOCX, or TXT • Max 10 MB</p>
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

      {/* Processing progress card */}
      {phase === 'processing' && (
        <div className="card" style={{ background: 'rgba(124,58,237,0.07)', borderColor: 'rgba(124,58,237,0.25)' }}>
          <div className="flex items-center gap-2" style={{ marginBottom: 6 }}>
            <Brain size={18} color="var(--violet-light)" />
            <span style={{ fontWeight: 700, color: 'var(--violet-light)', fontSize: 15 }}>AI Analysis Running…</span>
          </div>
          <p style={{ fontSize: 13, marginBottom: 4 }}>
            Your resume has been uploaded. The AI is now analysing it in the background — you can
            navigate away and come back later.
          </p>
          <StepIndicator activeStep={activeStep} />
          <button onClick={reset} className="btn btn-ghost btn-sm" style={{ marginTop: 4 }}>
            Upload a different file
          </button>
        </div>
      )}

      {/* Result card */}
      {phase === 'done' && result && (
        <div className="card" style={{ background: 'rgba(34,197,94,0.06)', borderColor: 'rgba(34,197,94,0.25)' }}>
          <div className="flex items-center gap-3" style={{ marginBottom: 16 }}>
            <CheckCircle size={20} color="#86efac" />
            <span style={{ fontWeight: 600, color: '#86efac' }}>Resume Analysed!</span>
            <span className="badge badge-green" style={{ marginLeft: 'auto' }}>
              ATS: {result.ats_score?.toFixed(0) ?? 0}/100
            </span>
          </div>

          {result.parsed_skills?.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                All Detected Skills ({result.parsed_skills.length})
              </p>
              <div className="flex" style={{ flexWrap: 'wrap', gap: 6, maxHeight: 180, overflowY: 'auto', paddingRight: 4 }}>
                {result.parsed_skills.map((s) => (
                  <span key={s} className="badge badge-violet">{s}</span>
                ))}
              </div>
            </div>
          )}

          {result.skill_gaps?.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Skill Gaps
              </p>
              <div className="flex" style={{ flexWrap: 'wrap', gap: 6 }}>
                {result.skill_gaps.map((g, i) => (
                  <span key={i} className={`badge ${g.priority === 'high' ? 'badge-red' : g.priority === 'medium' ? 'badge-orange' : 'badge-cyan'}`}>
                    {g.skill || g}
                  </span>
                ))}
              </div>
            </div>
          )}

          <button onClick={reset} className="btn btn-secondary btn-sm">
            Upload another resume
          </button>
        </div>
      )}
    </div>
  );
}
