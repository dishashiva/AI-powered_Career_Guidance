import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LayoutDashboard, Brain, Briefcase, BookOpen, MessageSquare, LogOut, Menu, X, User, FileText, Shield } from 'lucide-react';
import { useState } from 'react';

const navLinks = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/career', label: 'Career', icon: Brain },
  { to: '/jobs', label: 'Jobs', icon: Briefcase },
  { to: '/courses', label: 'Courses', icon: BookOpen },
  { to: '/resume-builder', label: 'Resume Builder', icon: FileText },
  { to: '/chat', label: 'Coach', icon: MessageSquare },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  // For Admin dashboard, remove the navbar on top completely
  if (user?.is_admin) return null;

  const handleLogout = () => { logout(); navigate('/login'); };

  const logoTarget = user?.is_admin ? '/admin' : (user ? '/dashboard' : '/');

  return (
    <nav style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      background: 'rgba(255, 255, 255, 0.88)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderBottom: '1px solid #e2e8f0',
      boxShadow: '0 1px 3px rgba(15, 23, 42, 0.03)',
    }}>
      <div className="container flex items-center justify-between" style={{ height: 60 }}>
        <Link to={logoTarget} className="flex items-center gap-2" style={{ fontWeight: 700, fontSize: 17, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
          <div style={{
            width: 32, height: 32, borderRadius: 10,
            background: user?.is_admin ? 'linear-gradient(135deg, #4f46e5, #7c3aed)' : 'linear-gradient(135deg, #4f46e5, #6366f1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(79, 70, 229, 0.25)',
          }}>
            {user?.is_admin ? <Shield size={18} color="#fff" /> : <Brain size={18} color="#fff" />}
          </div>
          <span className="hide-mobile">{user?.is_admin ? 'CareerAI Admin' : 'CareerAI'}</span>
        </Link>

        {user && (
          <div className="flex items-center gap-1 hide-mobile">
            {user.is_admin ? (
              <Link to="/admin" style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 14px', borderRadius: 'var(--radius-md)',
                fontSize: 13, fontWeight: 600,
                color: '#fff',
                background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                boxShadow: '0 2px 6px rgba(79,70,229,0.3)',
                transition: 'all var(--transition)',
              }}>
                <Shield size={15} />
                Admin Portal
              </Link>
            ) : (
              navLinks.map(({ to, label, icon: Icon }) => {
                const active = location.pathname === to;
                return (
                  <Link key={to} to={to} style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '6px 12px', borderRadius: 'var(--radius-md)',
                    fontSize: 13, fontWeight: 500,
                    color: active ? 'var(--accent)' : 'var(--text-secondary)',
                    background: active ? 'var(--accent-subtle)' : 'transparent',
                    transition: 'all var(--transition)',
                  }}>
                    <Icon size={15} />
                    {label}
                  </Link>
                );
              })
            )}
          </div>
        )}

        <div className="flex items-center gap-2">
          {user ? (
            <>
              {user.is_admin ? (
                <div className="hide-mobile flex items-center gap-2" style={{ padding: '4px 10px', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                  <span style={{
                    padding: '2px 8px', borderRadius: 99, background: '#e0e7ff', color: '#4f46e5',
                    fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px'
                  }}>
                    Global Admin
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>
                    {user.full_name || user.email}
                  </span>
                </div>
              ) : (
                /* Clickable avatar → /profile for normal users */
                <Link
                  to="/profile"
                  className="hide-mobile flex items-center gap-2"
                  style={{ textDecoration: 'none' }}
                  title="View Profile"
                >
                  <div style={{
                    width: 30, height: 30, borderRadius: 'var(--radius-full)',
                    background: 'linear-gradient(135deg, var(--blue-500), #7c3aed)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 700, color: '#fff',
                    transition: 'transform var(--transition), box-shadow var(--transition)',
                    boxShadow: location.pathname === '/profile' ? 'var(--shadow-md)' : 'none',
                  }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.08)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                  >
                    {user.full_name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <span style={{
                    fontSize: 13, fontWeight: 500,
                    color: location.pathname === '/profile' ? 'var(--accent)' : 'var(--text-primary)',
                  }}>
                    {user.full_name?.split(' ')[0]}
                  </span>
                </Link>
              )}

              <button onClick={handleLogout} className="btn btn-ghost btn-sm" style={{ color: 'var(--text-muted)' }}>
                <LogOut size={15} />
                <span className="hide-mobile">Sign out</span>
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" className="btn btn-ghost btn-sm">Sign in</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Get started</Link>
            </div>
          )}
          {user && (
            <button className="show-mobile btn btn-ghost btn-sm" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          )}
        </div>
      </div>

      {user && menuOpen && (
        <div style={{ borderTop: '1px solid var(--border)', padding: '8px 16px 12px' }}>
          {user.is_admin ? (
            <Link
              to="/admin"
              onClick={() => setMenuOpen(false)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', borderRadius: 'var(--radius-md)',
                fontSize: 14, fontWeight: 600,
                color: '#fff',
                background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
              }}
            >
              <Shield size={16} /> Admin Portal
            </Link>
          ) : (
            <>
              <Link
                to="/profile"
                onClick={() => setMenuOpen(false)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px', borderRadius: 'var(--radius-md)',
                  fontSize: 14, fontWeight: 500,
                  color: location.pathname === '/profile' ? 'var(--accent)' : 'var(--text-secondary)',
                  background: location.pathname === '/profile' ? 'var(--accent-subtle)' : 'transparent',
                }}
              >
                <User size={16} /> Profile
              </Link>
              {navLinks.map(({ to, label, icon: Icon }) => {
                const active = location.pathname === to;
                return (
                  <Link key={to} to={to} onClick={() => setMenuOpen(false)} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 12px', borderRadius: 'var(--radius-md)',
                    fontSize: 14, fontWeight: 500,
                    color: active ? 'var(--accent)' : 'var(--text-secondary)',
                    background: active ? 'var(--accent-subtle)' : 'transparent',
                  }}>
                    <Icon size={16} />{label}
                  </Link>
                );
              })}
            </>
          )}
          <button
            onClick={() => { handleLogout(); setMenuOpen(false); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px', borderRadius: 'var(--radius-md)',
              fontSize: 14, fontWeight: 500, color: 'var(--red-600)',
              background: 'none', border: 'none', cursor: 'pointer', width: '100%', marginTop: 4
            }}
          >
            <LogOut size={16} /> Sign out
          </button>
        </div>
      )}
    </nav>
  );
}
