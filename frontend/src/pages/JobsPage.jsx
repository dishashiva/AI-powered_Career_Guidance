import { useState, useEffect } from 'react';
import { jobsAPI } from '../api/client';
import JobCard from '../components/JobCard';
import { Briefcase, RefreshCw, Search } from 'lucide-react';
import toast from 'react-hot-toast';

export default function JobsPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await jobsAPI.getRecommendations();
      setJobs(res.data.jobs || []);
    } catch (err) {
      toast.error('Could not load job recommendations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = jobs.filter((j) =>
    !filter || j.title?.toLowerCase().includes(filter.toLowerCase()) ||
    j.company?.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="page-wrapper">
      <div className="container page-content">
        <div className="flex items-center justify-between" style={{ marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: '1.375rem', marginBottom: 4 }}>Jobs</h1>
            <p style={{ fontSize: 14 }}>Personalized opportunities based on your skills</p>
          </div>
          <button onClick={load} className="btn btn-secondary btn-sm" disabled={loading}>
            <RefreshCw size={14} className={loading ? 'spinner' : ''} />
            Refresh
          </button>
        </div>

        <div style={{ position: 'relative', marginBottom: 24, maxWidth: 360 }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input className="input" placeholder="Filter by title or company..." value={filter}
            onChange={(e) => setFilter(e.target.value)} style={{ paddingLeft: 36 }} />
        </div>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="skeleton" style={{ height: 260 }} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <Briefcase size={20} />
            </div>
            <h3 style={{ marginBottom: 6, fontSize: 16 }}>No jobs found</h3>
            <p style={{ marginBottom: 20, fontSize: 14, maxWidth: 360 }}>
              {jobs.length === 0
                ? 'Upload and analyze a resume first to get job matches'
                : 'No jobs match your filter'}
            </p>
            {jobs.length === 0 && (
              <a href="/dashboard" className="btn btn-primary btn-sm">Upload resume</a>
            )}
          </div>
        ) : (
          <>
            <p style={{ fontSize: 13, marginBottom: 16, color: 'var(--text-secondary)' }}>
              Showing <strong>{filtered.length}</strong> opportunities
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
              {filtered.map((job, i) => <JobCard key={i} job={job} />)}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
