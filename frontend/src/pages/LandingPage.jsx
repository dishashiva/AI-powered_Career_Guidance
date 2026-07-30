import { Link } from 'react-router-dom';
import { Brain, Target, TrendingUp, Zap, Shield, MessageSquare, ArrowRight, Check } from 'lucide-react';

const features = [
  { icon: Brain, title: 'AI Resume Parser', desc: 'NLP-powered extraction of skills, roles, and experience from your resume.' },
  { icon: Target, title: 'ATS Score Analysis', desc: 'See exactly how applicant tracking systems evaluate your resume.' },
  { icon: TrendingUp, title: 'Career Path Prediction', desc: 'AI-generated career trajectory recommendations based on your profile.' },
  { icon: Zap, title: 'Skill Gap Detection', desc: 'Identify missing skills with prioritized learning resources.' },
  { icon: Shield, title: 'Salary Intelligence', desc: 'Salary predictions tailored to your skills, experience, and location.' },
  { icon: MessageSquare, title: 'AI Career Coach', desc: 'Chat with an AI that knows your profile and gives actionable guidance.' },
];

const stats = [
  { value: '95%', label: 'Parse Accuracy' },
  { value: '10x', label: 'Faster Planning' },
  { value: '50+', label: 'Career Paths' },
  { value: '24/7', label: 'AI Availability' },
];

export default function LandingPage() {
  return (
    <div>
      {/* Hero */}
      <section style={{ padding: '80px 0 64px', textAlign: 'center' }}>
        <div className="container">
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '4px 12px', borderRadius: 'var(--radius-full)',
            border: '1px solid var(--border)',
            background: 'var(--bg-surface)',
            marginBottom: 24,
            fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)',
          }}>
            <span style={{ width: 6, height: 6, borderRadius: 'var(--radius-full)', background: 'var(--green-500)' }} />
            AI-Powered Career Intelligence
          </div>

          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 700, lineHeight: 1.15, marginBottom: 20, maxWidth: 700, margin: '0 auto 20px' }}>
            Your career, guided by AI
          </h1>

          <p style={{ fontSize: 16, maxWidth: 520, margin: '0 auto 36px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            Upload your resume and get instant analysis — ATS scores, skill gaps, career paths, and personalized job matches.
          </p>

          <div className="flex justify-center gap-3" style={{ flexWrap: 'wrap' }}>
            <Link to="/register" className="btn btn-primary btn-lg">
              Start free analysis <ArrowRight size={16} />
            </Link>
            <Link to="/login" className="btn btn-secondary btn-lg">
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section style={{ borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 0, textAlign: 'center' }}>
            {stats.map(({ value, label }, i) => (
              <div key={label} style={{ padding: '28px 16px', borderRight: i < stats.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>{value}</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '72px 0' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', marginBottom: 12 }}>
              Everything you need to advance your career
            </h2>
            <p style={{ maxWidth: 480, margin: '0 auto', color: 'var(--text-secondary)' }}>
              Six AI capabilities working together to give you an edge in the job market.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="card" style={{ padding: 24 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 'var(--radius-md)',
                  background: 'var(--gray-100)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 16,
                }}>
                  <Icon size={20} color="var(--text-secondary)" />
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>{title}</h3>
                <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--text-secondary)' }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '0 0 72px' }}>
        <div className="container">
          <div style={{
            padding: '48px 32px', borderRadius: 'var(--radius-xl)',
            background: 'var(--gray-900)',
            textAlign: 'center',
          }}>
            <h2 style={{ fontSize: 'clamp(1.3rem, 3vw, 1.75rem)', color: 'var(--white)', marginBottom: 12 }}>
              Ready to get started?
            </h2>
            <p style={{ maxWidth: 400, margin: '0 auto 28px', color: 'var(--gray-400)', fontSize: 15 }}>
              Join professionals using CareerAI to land better jobs, faster.
            </p>
            <Link to="/register" className="btn btn-primary btn-lg" style={{ background: 'var(--white)', color: 'var(--gray-900)', border: 'none' }}>
              Get started free <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
