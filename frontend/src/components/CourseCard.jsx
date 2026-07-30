import { BookOpen, Clock, Star, ExternalLink, GraduationCap } from 'lucide-react';

export default function CourseCard({ course }) {
  const skills = typeof course.skills_covered === 'string'
    ? JSON.parse(course.skills_covered || '[]')
    : (course.skills_covered || []);

  return (
    <div className="card" style={{ padding: 20 }}>
      <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
        <div className="flex items-center gap-3">
          <div style={{
            width: 36, height: 36, borderRadius: 'var(--radius-md)',
            background: 'var(--gray-100)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <GraduationCap size={16} color="var(--text-secondary)" />
          </div>
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 1, lineHeight: 1.3 }}>{course.title}</h3>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{course.provider}</p>
          </div>
        </div>
        {course.match_score != null && (
          <span className="badge badge-blue">{course.match_score}%</span>
        )}
      </div>

      <div className="flex" style={{ gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
        {course.duration && (
          <span className="flex items-center gap-1" style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            <Clock size={12} />{course.duration}
          </span>
        )}
        {course.rating && (
          <span className="flex items-center gap-1" style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            <Star size={12} color="var(--amber-500)" fill="var(--amber-500)" />{course.rating}
          </span>
        )}
        {course.level && <span className="badge badge-gray">{course.level}</span>}
        {course.is_free && <span className="badge badge-green">Free</span>}
      </div>

      {course.description && (
        <p style={{ fontSize: 13, lineHeight: 1.6, marginBottom: 12, color: 'var(--text-secondary)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {course.description}
        </p>
      )}

      {skills.length > 0 && (
        <div className="flex" style={{ flexWrap: 'wrap', gap: 4, marginBottom: 14 }}>
          {skills.slice(0, 4).map((s, i) => (
            <span key={i} className="badge badge-blue">{s}</span>
          ))}
        </div>
      )}

      <a href={course.url || '#'} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm" style={{ width: '100%' }}>
        <BookOpen size={13} /> Start learning <ExternalLink size={11} />
      </a>
    </div>
  );
}
