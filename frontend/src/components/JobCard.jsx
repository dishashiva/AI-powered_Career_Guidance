import { Briefcase, MapPin, DollarSign, ExternalLink, Search } from 'lucide-react';

export default function JobCard({ job }) {
  const skills = typeof job.required_skills === 'string'
    ? JSON.parse(job.required_skills || '[]')
    : (job.required_skills || []);

  const salary = job.salary_min && job.salary_max
    ? `$${(job.salary_min / 1000).toFixed(0)}k - $${(job.salary_max / 1000).toFixed(0)}k`
    : null;

  // Construct high-quality fallback links if job_url is missing or '#'
  const rawTitle = job.title || 'Software';
  const rawCompany = job.company || '';
  const searchKeywords = encodeURIComponent(`${rawTitle} ${rawCompany}`.strip ? `${rawTitle} ${rawCompany}`.trim() : `${rawTitle} ${rawCompany}`);

  const mainApplyUrl = (job.job_url && job.job_url !== '#' && job.job_url.startsWith('http'))
    ? job.job_url
    : `https://www.linkedin.com/jobs/search/?keywords=${searchKeywords}`;

  const secondarySearchUrl = `https://www.google.com/search?q=${encodeURIComponent(`apply for ${rawTitle} ${rawCompany} job`)}`;

  return (
    <div className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <div>
        <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
          <div className="flex items-center gap-3">
            <div style={{
              width: 38, height: 38, borderRadius: 'var(--radius-md)',
              background: 'var(--accent-subtle)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Briefcase size={18} color="var(--accent)" />
            </div>
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 2, lineHeight: 1.3 }}>{job.title}</h3>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>{job.company || 'Top Employer'}</p>
            </div>
          </div>
          {job.match_score != null && (
            <span className="badge badge-green" style={{ fontWeight: 700 }}>{job.match_score}% Match</span>
          )}
        </div>

        <div className="flex" style={{ gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          {job.location && (
            <span className="flex items-center gap-1" style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              <MapPin size={12} color="var(--text-muted)" />{job.location}
            </span>
          )}
          {salary && (
            <span className="flex items-center gap-1" style={{ fontSize: 12, color: 'var(--green-600)', fontWeight: 600 }}>
              <DollarSign size={12} />{salary}
            </span>
          )}
          {job.job_type && <span className="badge badge-gray">{job.job_type}</span>}
          {job.experience_level && <span className="badge badge-blue">{job.experience_level}</span>}
        </div>

        {job.description && (
          <p style={{
            fontSize: 13, lineHeight: 1.5, marginBottom: 12, color: 'var(--text-secondary)',
            display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden'
          }}>
            {job.description}
          </p>
        )}

        {skills.length > 0 && (
          <div className="flex" style={{ flexWrap: 'wrap', gap: 4, marginBottom: 16 }}>
            {skills.slice(0, 5).map((s, i) => (
              <span key={i} className="badge badge-gray" style={{ fontSize: 11 }}>{s}</span>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <a
          href={mainApplyUrl}
          target="_blank"
          rel="noreferrer"
          className="btn btn-primary btn-sm"
          style={{ flex: 1, justifyContent: 'center' }}
          id={`apply-btn-${job.title?.replace(/\s+/g, '-').toLowerCase()}`}
        >
          <ExternalLink size={13} /> Apply on LinkedIn / Web
        </a>
        <a
          href={secondarySearchUrl}
          target="_blank"
          rel="noreferrer"
          className="btn btn-secondary btn-sm"
          title="Search all job portals on Google"
          style={{ padding: '0 10px' }}
        >
          <Search size={13} />
        </a>
      </div>
    </div>
  );
}

