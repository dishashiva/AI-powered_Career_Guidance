import { useState, useEffect } from 'react';
import { coursesAPI } from '../api/client';
import CourseCard from '../components/CourseCard';
import { BookOpen, RefreshCw, Search } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CoursesPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await coursesAPI.getRecommendations();
      setCourses(res.data.courses || []);
    } catch {
      toast.error('Could not load course recommendations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = courses.filter((c) =>
    !filter || c.title?.toLowerCase().includes(filter.toLowerCase()) ||
    c.provider?.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="page-wrapper">
      <div className="container page-content">
        <div className="flex items-center justify-between" style={{ marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: '1.375rem', marginBottom: 4 }}>Courses</h1>
            <p style={{ fontSize: 14 }}>Learning resources to close your skill gaps</p>
          </div>
          <button onClick={load} className="btn btn-secondary btn-sm" disabled={loading}>
            <RefreshCw size={14} className={loading ? 'spinner' : ''} />
            Refresh
          </button>
        </div>

        <div style={{ position: 'relative', marginBottom: 24, maxWidth: 360 }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input className="input" placeholder="Filter by title or provider..." value={filter}
            onChange={(e) => setFilter(e.target.value)} style={{ paddingLeft: 36 }} />
        </div>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="skeleton" style={{ height: 240 }} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <BookOpen size={20} />
            </div>
            <h3 style={{ marginBottom: 6, fontSize: 16 }}>No courses found</h3>
            <p style={{ marginBottom: 20, fontSize: 14 }}>Upload a resume to get tailored course recommendations</p>
            <a href="/dashboard" className="btn btn-primary btn-sm">Upload resume</a>
          </div>
        ) : (
          <>
            <p style={{ fontSize: 13, marginBottom: 16, color: 'var(--text-secondary)' }}>
              Showing <strong>{filtered.length}</strong> courses
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
              {filtered.map((course, i) => <CourseCard key={i} course={course} />)}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
