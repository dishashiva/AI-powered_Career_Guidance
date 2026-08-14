import { useState, useEffect, useCallback } from 'react';
import { coursesAPI, resumesAPI } from '../api/client';
import CourseCard from '../components/CourseCard';
import { getActiveResumeId, setActiveResumeId } from '../utils/activeResume';
import { BookOpen, RefreshCw, Search, GraduationCap, Map, CheckCircle2, ChevronRight, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CoursesPage() {
  const [courses, setCourses] = useState([]);
  const [resumes, setResumes] = useState([]);
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [learningPath, setLearningPath] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingPath, setLoadingPath] = useState(false);
  const [activeTab, setActiveTab] = useState('courses'); // 'courses' | 'roadmap'
  const [filter, setFilter] = useState('');
  const [providerFilter, setProviderFilter] = useState('ALL');

  useEffect(() => {
    resumesAPI.list()
      .then((res) => {
        setResumes(res.data);
        const activeId = getActiveResumeId(res.data);
        if (activeId) {
          setSelectedResumeId(activeId);
        }
      })
      .catch(() => {});
  }, []);

  const loadCourses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await coursesAPI.getRecommendations(selectedResumeId || null);
      setCourses(res.data.courses || []);
    } catch {
      toast.error('Could not load course recommendations');
    } finally {
      setLoading(false);
    }
  }, [selectedResumeId]);

  const loadLearningPath = useCallback(async () => {
    setLoadingPath(true);
    try {
      const res = await coursesAPI.getLearningPath(selectedResumeId || null);
      setLearningPath(res.data);
    } catch {
      toast.error('Could not load learning path');
    } finally {
      setLoadingPath(false);
    }
  }, [selectedResumeId]);

  useEffect(() => {
    loadCourses();
    loadLearningPath();
  }, [loadCourses, loadLearningPath]);

  const filtered = courses.filter((c) => {
    const matchesText = !filter ||
      c.title?.toLowerCase().includes(filter.toLowerCase()) ||
      c.provider?.toLowerCase().includes(filter.toLowerCase()) ||
      (c.skills_covered && JSON.stringify(c.skills_covered).toLowerCase().includes(filter.toLowerCase()));

    const matchesProv = providerFilter === 'ALL' ||
      c.provider?.toLowerCase().includes(providerFilter.toLowerCase());

    return matchesText && matchesProv;
  });

  return (
    <div className="page-wrapper">
      <div className="container page-content">
        {/* Header */}
        <div className="flex items-center justify-between" style={{ marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: '1.375rem', marginBottom: 4 }}>Course Recommendations & Learning Path</h1>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              AI learning resources to detect missing skills and build your career roadmap
            </p>
          </div>

          <div className="flex items-center gap-3">
            {resumes.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--surface)', padding: '6px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                <FileText size={14} color="var(--accent)" />
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Resume:</span>
                <select
                  value={selectedResumeId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setSelectedResumeId(id);
                    setActiveResumeId(id);
                  }}
                  style={{ background: 'none', border: 'none', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', cursor: 'pointer', outline: 'none' }}
                >
                  <option value="">All Resumes (Latest)</option>
                  {resumes.map(r => (
                    <option key={r.id} value={r.id}>{r.filename}</option>
                  ))}
                </select>
              </div>
            )}
            <button onClick={() => { loadCourses(); loadLearningPath(); }} className="btn btn-secondary btn-sm" disabled={loading}>
              <RefreshCw size={14} className={loading ? 'spinner' : ''} />
              Refresh Recommendations
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: 12, borderBottom: '1px solid var(--border)', marginBottom: 24 }}>
          <button
            onClick={() => setActiveTab('courses')}
            style={{
              padding: '10px 16px', background: 'none', border: 'none', borderBottom: activeTab === 'courses' ? '2px solid var(--accent)' : '2px solid transparent',
              fontWeight: activeTab === 'courses' ? 600 : 500, color: activeTab === 'courses' ? 'var(--accent)' : 'var(--text-secondary)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontSize: 14
            }}
          >
            <GraduationCap size={16} /> Recommended Courses ({courses.length})
          </button>
          <button
            onClick={() => setActiveTab('roadmap')}
            style={{
              padding: '10px 16px', background: 'none', border: 'none', borderBottom: activeTab === 'roadmap' ? '2px solid var(--accent)' : '2px solid transparent',
              fontWeight: activeTab === 'roadmap' ? 600 : 500, color: activeTab === 'roadmap' ? 'var(--accent)' : 'var(--text-secondary)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontSize: 14
            }}
          >
            <Map size={16} /> Step-by-Step Learning Roadmap
          </button>
        </div>

        {activeTab === 'courses' ? (
          <>
            {/* Search & Provider Filter */}
            <div style={{
              display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24,
              background: 'var(--surface)', padding: 16, borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border)'
            }}>
              <div style={{ position: 'relative', flex: 2, minWidth: 240 }}>
                <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  className="input"
                  placeholder="Filter by course title, skill, or platform..."
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  style={{ paddingLeft: 36 }}
                />
              </div>

              <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
                <select
                  className="input"
                  value={providerFilter}
                  onChange={(e) => setProviderFilter(e.target.value)}
                >
                  <option value="ALL">All Platforms</option>
                  <option value="Coursera">Coursera</option>
                  <option value="Udemy">Udemy</option>
                  <option value="YouTube">YouTube (Free)</option>
                  <option value="edX">edX</option>
                  <option value="freeCodeCamp">freeCodeCamp</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="skeleton" style={{ height: 250 }} />)}
              </div>
            ) : filtered.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <BookOpen size={20} />
                </div>
                <h3 style={{ marginBottom: 6, fontSize: 16 }}>No courses match your filter</h3>
                <p style={{ marginBottom: 20, fontSize: 14, color: 'var(--text-muted)' }}>
                  {courses.length === 0
                    ? 'Upload and analyze a resume to get personalized course recommendations'
                    : 'Try clearing your platform or text filters'}
                </p>
                {courses.length === 0 && (
                  <a href="/dashboard" className="btn btn-primary btn-sm">Upload resume</a>
                )}
              </div>
            ) : (
              <>
                <p style={{ fontSize: 13, marginBottom: 16, color: 'var(--text-secondary)' }}>
                  Showing <strong>{filtered.length}</strong> learning resources targeting your skill gaps
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                  {filtered.map((course, i) => <CourseCard key={i} course={course} />)}
                </div>
              </>
            )}
          </>
        ) : (
          /* Roadmap View */
          <div>
            {loadingPath ? (
              <div className="card" style={{ padding: 32, textAlign: 'center' }}>
                <div className="spinner" style={{ margin: '0 auto 16px', width: 28, height: 28 }} />
                <p style={{ color: 'var(--text-muted)' }}>Generating your step-by-step AI learning roadmap...</p>
              </div>
            ) : !learningPath || !learningPath.phases ? (
              <div className="empty-state">
                <Map size={24} style={{ marginBottom: 12, color: 'var(--text-muted)' }} />
                <h3>No roadmap generated yet</h3>
                <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 16 }}>
                  Upload a resume first to extract your skill gaps and generate a step-by-step learning path.
                </p>
                <a href="/dashboard" className="btn btn-primary btn-sm">Upload resume</a>
              </div>
            ) : (
              <div>
                <div className="card" style={{ padding: 24, marginBottom: 24, background: 'linear-gradient(135deg, var(--surface) 0%, var(--gray-50) 100%)' }}>
                  <div className="flex items-center justify-between" style={{ flexWrap: 'wrap', gap: 12 }}>
                    <div>
                      <span className="badge badge-violet" style={{ marginBottom: 8 }}>Estimated Duration: {learningPath.estimated_total_time || '3 Months'}</span>
                      <h2 style={{ fontSize: '1.25rem', margin: '4px 0 6px' }}>{learningPath.roadmap_title}</h2>
                      <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
                        A structured progression designed by AI to systematically bridge your missing technical skills.
                      </p>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  {learningPath.phases.map((phase, idx) => (
                    <div key={idx} className="card" style={{ padding: 24, borderLeft: '4px solid var(--accent)' }}>
                      <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
                        <div className="flex items-center gap-3">
                          <div style={{
                            width: 32, height: 32, borderRadius: 'var(--radius-full)',
                            background: 'var(--accent)', color: '#fff',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14
                          }}>
                            {phase.phase_number || (idx + 1)}
                          </div>
                          <div>
                            <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>{phase.phase_name}</h3>
                            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Duration: {phase.duration}</span>
                          </div>
                        </div>
                      </div>

                      <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--text-secondary)', marginBottom: 14 }}>
                        {phase.objectives}
                      </p>

                      {phase.focus_skills && phase.focus_skills.length > 0 && (
                        <div style={{ marginBottom: 14 }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 6 }}>
                            Focus Skills
                          </span>
                          <div className="flex" style={{ flexWrap: 'wrap', gap: 6 }}>
                            {phase.focus_skills.map((s, sIdx) => (
                              <span key={sIdx} className="badge badge-blue">{s}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {phase.action_items && phase.action_items.length > 0 && (
                        <div style={{ marginBottom: 14 }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 6 }}>
                            Key Milestones
                          </span>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {phase.action_items.map((item, iIdx) => (
                              <div key={iIdx} className="flex items-center gap-2" style={{ fontSize: 13, color: 'var(--text-primary)' }}>
                                <CheckCircle2 size={15} color="var(--green-500)" style={{ flexShrink: 0 }} />
                                <span>{item}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {phase.recommended_resource && (
                        <div style={{ background: 'var(--gray-50)', padding: '10px 14px', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                            <strong>Recommended Resource:</strong> {phase.recommended_resource}
                          </span>
                          <ChevronRight size={14} color="var(--text-muted)" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

