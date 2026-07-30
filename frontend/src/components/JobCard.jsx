import { Briefcase, MapPin, DollarSign, ExternalLink } from 'lucide-react';

export default function JobCard({ job }) {
  const skills = typeof job.required_skills === 'string'
    ? JSON.parse(job.required_skills || '[]')
    : (job.required_skills || []);

  const salary = job.salary_min && job.salary_max
    ? `$${(job.salary_min / 1000).toFixed(0)}k - $${(job.salary_max / 1000).toFixed(0)}k`
    : null;

  return (
    <div className="card" style={{ padding: 20 }}>
      <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
        <div className="flex items-center gap-3">
          <div style={{
            width: 36, height: 36, borderRadius: 'var(--radius-md)',
            background: 'var(--gray-100)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Briefcase size={16} color="var(--text-secondary)" />
          </div>
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 1 }}>{job.title}</h3>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{job.company}</p>
          </div>
        </div>
        {job.match_score != null && (
          <span className="badge badge-green">{job.match_score}%</span>
        )}
      </div>

      <div className="flex" style={{ gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
        {job.location && (
          <span className="flex items-center gap-1" style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            <MapPin size={12} />{job.location}
          </span>
        )}
        {salary && (
          <span className="flex items-center gap-1" style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            <DollarSign size={12} />{salary}
          </span>
        )}
        {job.job_type && <span className="badge badge-gray">{job.job_type}</span>}
        {job.experience_level && <span className="badge badge-blue">{job.experience_level}</span>}
      </div>

      {job.description && (
        <p style={{ fontSize: 13, lineHeight: 1.6, marginBottom: 12, color: 'var(--text-secondary)', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {job.description}
        </p>
      )}

      {skills.length > 0 && (
        <div className="flex" style={{ flexWrap: 'wrap', gap: 4, marginBottom: 14 }}>
          {skills.slice(0, 5).map((s, i) => (
            <span key={i} className="badge badge-blue">{s}</span>
          ))}
        </div>
      )}

      <a href={job.job_url || '#'} target="_blank" rel="noreferrer" className="btn btn-primary btn-sm" style={{ width: '100%' }}>
        <ExternalLink size={13} /> Apply now
      </a>
    </div>
  );
}
