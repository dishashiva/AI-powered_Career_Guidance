import { BookOpen, Clock, Star, ExternalLink, GraduationCap } from 'lucide-react';

function getValidCourseUrl(title, provider, rawUrl) {
  if (rawUrl && rawUrl !== '#' && rawUrl.startsWith('http')) return rawUrl;
  const q = encodeURIComponent(title || 'Course');
  const prov = (provider || '').toLowerCase();
  if (prov.includes('coursera')) return `https://www.coursera.org/search?query=${q}`;
  if (prov.includes('udemy')) return `https://www.udemy.com/courses/search/?q=${q}`;
  if (prov.includes('youtube')) return `https://www.youtube.com/results?search_query=${q}+full+course`;
  if (prov.includes('edx')) return `https://www.edx.org/search?q=${q}`;
  if (prov.includes('freecodecamp')) return `https://www.freecodecamp.org/news/search/?query=${q}`;
  if (prov.includes('linkedin')) return `https://www.linkedin.com/learning/search?keywords=${q}`;
  return `https://www.google.com/search?q=${encodeURIComponent((title || '') + ' online course ' + (provider || ''))}`;
}

export default function CourseCard({ course }) {
  const skills = typeof course.skills_covered === 'string'
    ? JSON.parse(course.skills_covered || '[]')
    : (course.skills_covered || []);

  const courseUrl = getValidCourseUrl(course.title, course.provider, course.url);

  return (
    <div className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <div>
        <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
          <div className="flex items-center gap-3">
            <div style={{
              width: 38, height: 38, borderRadius: 'var(--radius-md)',
              background: 'var(--violet-subtle, #f3e8ff)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <GraduationCap size={18} color="var(--violet-light, #7c3aed)" />
            </div>
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 2, lineHeight: 1.3 }}>{course.title}</h3>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>{course.provider || 'Online Learning'}</p>
            </div>
          </div>
          {course.match_score != null && (
            <span className="badge badge-blue" style={{ fontWeight: 700 }}>{course.match_score}% Match</span>
          )}
        </div>

        <div className="flex" style={{ gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          {course.duration && (
            <span className="flex items-center gap-1" style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              <Clock size={12} color="var(--text-muted)" />{course.duration}
            </span>
          )}
          {course.rating && (
            <span className="flex items-center gap-1" style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>
              <Star size={12} color="var(--amber-500)" fill="var(--amber-500)" />{course.rating}
            </span>
          )}
          {course.level && <span className="badge badge-gray">{course.level}</span>}
          {course.is_free && <span className="badge badge-green">Free</span>}
        </div>

        {course.description && (
          <p style={{
            fontSize: 13, lineHeight: 1.5, marginBottom: 12, color: 'var(--text-secondary)',
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
          }}>
            {course.description}
          </p>
        )}

        {skills.length > 0 && (
          <div className="flex" style={{ flexWrap: 'wrap', gap: 4, marginBottom: 16 }}>
            {skills.slice(0, 4).map((s, i) => (
              <span key={i} className="badge badge-blue" style={{ fontSize: 11 }}>{s}</span>
            ))}
          </div>
        )}
      </div>

      <a
        href={courseUrl}
        target="_blank"
        rel="noreferrer"
        className="btn btn-secondary btn-sm"
        style={{ width: '100%', justifyContent: 'center' }}
        id={`course-btn-${course.title?.replace(/\s+/g, '-').toLowerCase()}`}
      >
        <BookOpen size={13} /> Start learning on {course.provider || 'Platform'} <ExternalLink size={11} />
      </a>
    </div>
  );
}

