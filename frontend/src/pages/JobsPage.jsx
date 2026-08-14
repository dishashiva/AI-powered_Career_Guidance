import { useState, useEffect, useCallback } from 'react';
import { jobsAPI, resumesAPI } from '../api/client';
import JobCard from '../components/JobCard';
import { getActiveResumeId, setActiveResumeId } from '../utils/activeResume';
import { Briefcase, RefreshCw, Search, MapPin, Filter, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

export default function JobsPage() {
  const [jobs, setJobs] = useState([]);
  const [resumes, setResumes] = useState([]);
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');

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

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await jobsAPI.getRecommendations(selectedResumeId || null);
      setJobs(res.data.jobs || []);
    } catch {
      toast.error('Could not load job recommendations');
    } finally {
      setLoading(false);
    }
  }, [selectedResumeId]);

  useEffect(() => { load(); }, [load]);

  const filtered = jobs.filter((j) => {
    const matchesText = !filter ||
      j.title?.toLowerCase().includes(filter.toLowerCase()) ||
      j.company?.toLowerCase().includes(filter.toLowerCase()) ||
      (j.required_skills && JSON.stringify(j.required_skills).toLowerCase().includes(filter.toLowerCase()));

    const matchesLoc = locationFilter === 'ALL' ||
      (locationFilter === 'REMOTE' && j.location?.toLowerCase().includes('remote')) ||
      (locationFilter === 'HYBRID' && j.location?.toLowerCase().includes('hybrid')) ||
      (locationFilter === 'ONSITE' && !j.location?.toLowerCase().includes('remote') && !j.location?.toLowerCase().includes('hybrid'));

    const matchesType = typeFilter === 'ALL' ||
      j.experience_level?.toLowerCase().includes(typeFilter.toLowerCase()) ||
      j.job_type?.toLowerCase().includes(typeFilter.toLowerCase());

    return matchesText && matchesLoc && matchesType;
  });

  const activeResume = resumes.find(r => r.id === parseInt(selectedResumeId));

  return (
    <div className="page-wrapper">
      <div className="container page-content">
        {/* Header */}
        <div className="flex items-center justify-between" style={{ marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: '1.375rem', marginBottom: 4 }}>Job Recommendations</h1>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              AI matched opportunities based on your skills & qualifications
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
            <button onClick={load} className="btn btn-secondary btn-sm" disabled={loading}>
              <RefreshCw size={14} className={loading ? 'spinner' : ''} />
              Refresh Matches
            </button>
          </div>
        </div>

        {/* Search and Filters Bar */}
        <div style={{
          display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24,
          background: 'var(--surface)', padding: 16, borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border)'
        }}>
          {/* Keyword Search */}
          <div style={{ position: 'relative', flex: 2, minWidth: 240 }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              className="input"
              placeholder="Search by title, company, or skill..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              style={{ paddingLeft: 36 }}
            />
          </div>

          {/* Location Filter */}
          <div style={{ position: 'relative', flex: 1, minWidth: 160 }}>
            <MapPin size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <select
              className="input"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              style={{ paddingLeft: 36 }}
            >
              <option value="ALL">All Locations</option>
              <option value="REMOTE">Remote Only</option>
              <option value="HYBRID">Hybrid</option>
              <option value="ONSITE">On-site</option>
            </select>
          </div>

          {/* Experience Filter */}
          <div style={{ position: 'relative', flex: 1, minWidth: 160 }}>
            <Filter size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <select
              className="input"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              style={{ paddingLeft: 36 }}
            >
              <option value="ALL">All Experience Levels</option>
              <option value="JUNIOR">Junior</option>
              <option value="MID">Mid Level</option>
              <option value="SENIOR">Senior / Lead</option>
            </select>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
            {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="skeleton" style={{ height: 260 }} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <Briefcase size={20} />
            </div>
            <h3 style={{ marginBottom: 6, fontSize: 16 }}>No matching jobs found</h3>
            <p style={{ marginBottom: 20, fontSize: 14, maxWidth: 380, color: 'var(--text-muted)' }}>
              {jobs.length === 0
                ? 'Upload and analyze a resume first to generate AI job matches'
                : 'No jobs match your selected filter criteria. Try resetting filters.'}
            </p>
            {jobs.length === 0 && (
              <a href="/dashboard" className="btn btn-primary btn-sm">Upload resume</a>
            )}
            {jobs.length > 0 && (
              <button onClick={() => { setFilter(''); setLocationFilter('ALL'); setTypeFilter('ALL'); }} className="btn btn-secondary btn-sm">
                Reset Filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyBetween: 'space-between', marginBottom: 16 }}>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
                Showing <strong>{filtered.length}</strong> tailored opportunities {activeResume ? `for ${activeResume.filename}` : ''}
              </p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
              {filtered.map((job, i) => <JobCard key={i} job={job} />)}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

