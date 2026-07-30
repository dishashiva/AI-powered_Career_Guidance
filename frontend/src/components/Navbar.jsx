import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LayoutDashboard, Brain, Briefcase, BookOpen, MessageSquare, LogOut, Menu, X, User } from 'lucide-react';
import { useState } from 'react';

const navLinks = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/career', label: 'Career', icon: Brain },
  { to: '/jobs', label: 'Jobs', icon: Briefcase },
  { to: '/courses', label: 'Courses', icon: BookOpen },
  { to: '/chat', label: 'Coach', icon: MessageSquare },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <nav style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      background: 'var(--bg-surface)',
      borderBottom: '1px solid var(--border)',
    }}>
      <div className="container flex items-center justify-between" style={{ height: 56 }}>
        <Link to={user ? '/dashboard' : '/'} className="flex items-center gap-2" style={{ fontWeight: 600, fontSize: 16, color: 'var(--text-primary)' }}>
          <div style={{
            width: 28, height: 28, borderRadius: 'var(--radius-sm)',
            background: 'var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Brain size={16} color="#fff" />
          </div>
          <span className="hide-mobile">CareerAI</span>
        </Link>

        {user && (
          <div className="flex items-center gap-1 hide-mobile">
            {navLinks.map(({ to, label, icon: Icon }) => {
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
            })}
          </div>
        )}

        <div className="flex items-center gap-2">
          {user ? (
            <>
              {/* Clickable avatar → /profile */}
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
            <button className="btn btn-ghost btn-sm" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          )}
        </div>
      </div>

      {user && menuOpen && (
        <div style={{ borderTop: '1px solid var(--border)', padding: '8px 16px 12px' }}>
          {/* Profile link in mobile menu */}
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
          <button
            onClick={() => { handleLogout(); setMenuOpen(false); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px', borderRadius: 'var(--radius-md)',
              fontSize: 14, fontWeight: 500, color: 'var(--red-600)',
              background: 'none', border: 'none', cursor: 'pointer', width: '100%',
            }}
          >
            <LogOut size={16} /> Sign out
          </button>
        </div>
      )}
    </nav>
  );
}
