import React, { useState, useEffect, useCallback } from 'react';
import { aiAPI, resumesAPI } from '../api/client';
import { getActiveResumeId, setActiveResumeId } from '../utils/activeResume';
import {
  HelpCircle, Sparkles, Code, UserCheck, Layers,
  ChevronDown, ChevronUp, RefreshCw, CheckCircle2, Lightbulb,
  FileText, Brain, Bookmark, BookOpen
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AIInterviewPrep({ resumeId: propResumeId }) {
  const [resumes, setResumes] = useState([]);
  const [selectedResumeId, setSelectedResumeId] = useState(propResumeId || '');
  const [jobRole, setJobRole] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [prepData, setPrepData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all'); // 'all' | 'technical' | 'behavioral' | 'general'
  const [openDetails, setOpenDetails] = useState({});
  const [practiceStatus, setPracticeStatus] = useState({}); // { [qId]: 'mastered' }

  // Load user resumes and set active resume
  useEffect(() => {
    resumesAPI.list()
      .then((res) => {
        setResumes(res.data);
        const activeId = propResumeId || getActiveResumeId(res.data);
        if (activeId) {
          setSelectedResumeId(String(activeId));
        }
      })
      .catch(() => {});
  }, [propResumeId]);

  // Fetch interview questions & answers from API
  const handleGenerate = useCallback(async () => {
    setLoading(true);
    try {
      const res = await aiAPI.interviewPrep({
        resume_id: selectedResumeId ? parseInt(selectedResumeId) : null,
        job_role: jobRole.trim() || null,
        job_description: jobDescription.trim() || null,
      });
      setPrepData(res.data);
      if (res.data.job_role && !jobRole) {
        setJobRole(res.data.job_role);
      }
      toast.success('Loaded AI interview questions with answers!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate interview questions. Using standard prep set.');
    } finally {
      setLoading(false);
    }
  }, [selectedResumeId, jobRole, jobDescription]);

  // Auto-generate on first load if not loaded yet
  useEffect(() => {
    if (!prepData && !loading) {
      handleGenerate();
    }
  }, [selectedResumeId]);

  const toggleDetails = (qId) => {
    setOpenDetails(prev => ({ ...prev, [qId]: !prev[qId] }));
  };

  const handlePracticeStatus = (qId, status) => {
    setPracticeStatus(prev => ({ ...prev, [qId]: prev[qId] === status ? null : status }));
  };

  const questions = prepData?.questions || [];
  const filteredQuestions = questions.filter(q => {
    if (activeCategory === 'all') return true;
    return q.category?.toLowerCase() === activeCategory.toLowerCase();
  });

  const technicalCount = questions.filter(q => q.category?.toLowerCase() === 'technical').length;
  const behavioralCount = questions.filter(q => q.category?.toLowerCase() === 'behavioral').length;
  const generalCount = questions.filter(q => q.category?.toLowerCase() === 'general').length;

  return (
    <div className="interview-prep-container">
      {/* Top Banner Card */}
      <div className="card animate-fade-in" style={{ padding: 24, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, alignItems: 'flex-start' }}>
          <div>
            <div className="flex items-center gap-2" style={{ marginBottom: 6 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 'var(--radius-md)',
                background: 'var(--accent-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Sparkles size={18} color="var(--accent)" />
              </div>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>AI Interview Preparation & Ready Answers</h2>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
              Read tailored Technical, Behavioral, and General interview questions complete with ready-to-use sample answers and key talking points.
            </p>
          </div>

          {/* Active Resume Selector */}
          {resumes.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--gray-50)', padding: '6px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
              <FileText size={14} color="var(--accent)" />
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Resume Context:</span>
              <select
                value={selectedResumeId}
                onChange={(e) => {
                  const id = e.target.value;
                  setSelectedResumeId(id);
                  setActiveResumeId(id);
                }}
                style={{ background: 'none', border: 'none', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', cursor: 'pointer', outline: 'none' }}
              >
                {resumes.map(r => (
                  <option key={r.id} value={r.id}>{r.filename}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Form Controls to customize generation */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14, marginTop: 18, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 4 }}>
              Target Job Role
            </label>
            <input
              type="text" className="input"
              value={jobRole}
              onChange={e => setJobRole(e.target.value)}
              placeholder="e.g. Senior Full Stack Engineer, AI Specialist"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 4 }}>
              Job Description Context (Optional)
            </label>
            <input
              type="text" className="input"
              value={jobDescription}
              onChange={e => setJobDescription(e.target.value)}
              placeholder="Paste JD text or key requirements for custom questions..."
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="btn btn-primary"
              style={{ width: '100%', height: 38, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              <RefreshCw size={14} className={loading ? 'spinner' : ''} />
              {loading ? 'Generating Questions & Answers...' : 'Refresh Questions & Answers'}
            </button>
          </div>
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid var(--border)', marginBottom: 20, overflowX: 'auto' }}>
        <button
          onClick={() => setActiveCategory('all')}
          style={{
            padding: '10px 14px', background: 'none', border: 'none',
            borderBottom: activeCategory === 'all' ? '2px solid var(--accent)' : '2px solid transparent',
            fontWeight: activeCategory === 'all' ? 600 : 500,
            color: activeCategory === 'all' ? 'var(--accent)' : 'var(--text-secondary)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, whiteSpace: 'nowrap'
          }}
        >
          <Layers size={15} /> All Questions ({questions.length})
        </button>

        <button
          onClick={() => setActiveCategory('technical')}
          style={{
            padding: '10px 14px', background: 'none', border: 'none',
            borderBottom: activeCategory === 'technical' ? '2px solid var(--accent)' : '2px solid transparent',
            fontWeight: activeCategory === 'technical' ? 600 : 500,
            color: activeCategory === 'technical' ? 'var(--accent)' : 'var(--text-secondary)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, whiteSpace: 'nowrap'
          }}
        >
          <Code size={15} /> Technical ({technicalCount})
        </button>

        <button
          onClick={() => setActiveCategory('behavioral')}
          style={{
            padding: '10px 14px', background: 'none', border: 'none',
            borderBottom: activeCategory === 'behavioral' ? '2px solid var(--accent)' : '2px solid transparent',
            fontWeight: activeCategory === 'behavioral' ? 600 : 500,
            color: activeCategory === 'behavioral' ? 'var(--accent)' : 'var(--text-secondary)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, whiteSpace: 'nowrap'
          }}
        >
          <UserCheck size={15} /> Behavioral (STAR) ({behavioralCount})
        </button>

        <button
          onClick={() => setActiveCategory('general')}
          style={{
            padding: '10px 14px', background: 'none', border: 'none',
            borderBottom: activeCategory === 'general' ? '2px solid var(--accent)' : '2px solid transparent',
            fontWeight: activeCategory === 'general' ? 600 : 500,
            color: activeCategory === 'general' ? 'var(--accent)' : 'var(--text-secondary)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, whiteSpace: 'nowrap'
          }}
        >
          <HelpCircle size={15} /> General & Background ({generalCount})
        </button>
      </div>

      {/* Questions List */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 160 }} />)}
        </div>
      ) : filteredQuestions.length === 0 ? (
        <div className="card empty-state" style={{ padding: 40 }}>
          <Brain size={32} color="var(--text-muted)" style={{ marginBottom: 12 }} />
          <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>No interview questions found for this category.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {filteredQuestions.map((q, idx) => {
            const isCatTech = q.category?.toLowerCase() === 'technical';
            const isCatBeh = q.category?.toLowerCase() === 'behavioral';
            const isCatGen = q.category?.toLowerCase() === 'general';

            const badgeClass = isCatTech ? 'badge-blue' : isCatBeh ? 'badge-violet' : 'badge-gray';
            const diffClass = q.difficulty?.toLowerCase() === 'hard' ? 'badge-red' : q.difficulty?.toLowerCase() === 'medium' ? 'badge-amber' : 'badge-green';

            const isOpen = !!openDetails[q.id || idx];
            const status = practiceStatus[q.id || idx];

            return (
              <div key={q.id || idx} className="card animate-fade-in" style={{ padding: 22 }}>
                {/* Question Header & Badges */}
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', marginBottom: 12 }}>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)' }}>Q{idx + 1}</span>
                    <span className={`badge ${badgeClass}`} style={{ fontSize: 11, textTransform: 'capitalize' }}>
                      {q.category}
                    </span>
                    {q.difficulty && (
                      <span className={`badge ${diffClass}`} style={{ fontSize: 10 }}>
                        {q.difficulty}
                      </span>
                    )}
                  </div>

                  {/* Prepared Readiness Status */}
                  <button
                    onClick={() => handlePracticeStatus(q.id || idx, 'mastered')}
                    style={{
                      padding: '4px 10px', fontSize: 11, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)',
                      background: status === 'mastered' ? '#dcfce7' : 'var(--bg-surface)',
                      color: status === 'mastered' ? '#15803d' : 'var(--text-secondary)',
                      fontWeight: status === 'mastered' ? 600 : 400, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5
                    }}
                  >
                    <CheckCircle2 size={13} /> {status === 'mastered' ? 'Prepared & Reviewed' : 'Mark Reviewed'}
                  </button>
                </div>

                {/* Question Title */}
                <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 14, lineHeight: 1.45 }}>
                  {q.question}
                </h3>

                {/* Prepared Sample Answer Box */}
                <div style={{
                  padding: 16,
                  background: 'var(--accent-subtle)',
                  borderRadius: 'var(--radius-md)',
                  borderLeft: '4px solid var(--accent)',
                  marginBottom: 12
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <BookOpen size={14} color="var(--accent)" />
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Prepared Sample Answer
                    </span>
                  </div>
                  <p style={{ fontSize: 13.5, color: 'var(--text-primary)', margin: 0, lineHeight: 1.6, fontWeight: 450 }}>
                    {q.sample_answer || q.answer_hint}
                  </p>
                </div>

                {/* Key Talking Points & STAR Breakdown */}
                <div>
                  <button
                    onClick={() => toggleDetails(q.id || idx)}
                    style={{
                      background: 'none', border: 'none', padding: '4px 0', color: 'var(--accent)',
                      fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4
                    }}
                  >
                    <Lightbulb size={14} />
                    {isOpen ? 'Hide Strategy & Talking Points' : 'View Key Talking Points & Framework Strategy'}
                    {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>

                  {isOpen && (
                    <div style={{ marginTop: 10, padding: 14, background: 'var(--gray-50)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                      
                      {/* Key Talking Points */}
                      {q.key_points && q.key_points.length > 0 && (
                        <div style={{ marginBottom: 10 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                            Key Concepts to Mention
                          </span>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {q.key_points.map((kp, i) => (
                              <span key={i} className="badge badge-gray" style={{ fontSize: 11, background: '#ffffff', border: '1px solid var(--border)' }}>
                                ✓ {kp}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* STAR Approach Guide for Behavioral */}
                      {q.star_approach && (
                        <div style={{ marginBottom: 8, padding: 10, background: '#f5f3ff', borderRadius: 'var(--radius-md)', borderLeft: '3px solid var(--violet-light)' }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: '#6d28d9', display: 'block', marginBottom: 2 }}>
                            STAR Framework Breakdown
                          </span>
                          <p style={{ fontSize: 12, color: '#4c1d95', margin: 0, lineHeight: 1.45 }}>
                            {q.star_approach}
                          </p>
                        </div>
                      )}

                      {/* Answer Strategy Hint */}
                      {q.answer_hint && q.sample_answer && (
                        <div>
                          <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                            Hiring Manager Expectation
                          </span>
                          <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                            {q.answer_hint}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
