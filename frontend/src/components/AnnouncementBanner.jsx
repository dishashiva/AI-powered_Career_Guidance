import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { announcementsAPI } from '../api/client';
import { AlertCircle, Info, CheckCircle, Bell, X } from 'lucide-react';

const typeIcons = {
  info: Info,
  warning: AlertCircle,
  success: CheckCircle,
  alert: Bell,
};

const typeStyles = {
  info: { background: '#eff6ff', border: '#bfdbfe', color: '#1e40af' },
  warning: { background: '#fefce8', border: '#fef08a', color: '#854d0e' },
  success: { background: '#f0fdf4', border: '#bbf7d0', color: '#166534' },
  alert: { background: '#fef2f2', border: '#fecaca', color: '#991b1b' },
};

export default function AnnouncementBanner() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [dismissed, setDismissed] = useState([]);

  useEffect(() => {
    if (!user || user.is_admin) return;
    announcementsAPI.getActive()
      .then((res) => setAnnouncements(res.data))
      .catch(() => {});
  }, [user]);

  // Display banner ONLY for logged-in regular users
  if (!user || user.is_admin) return null;

  const activeItems = announcements.filter((item) => !dismissed.includes(item.id));
  if (activeItems.length === 0) return null;

  const current = activeItems[0];
  const Icon = typeIcons[current.type] || Info;
  const style = typeStyles[current.type] || typeStyles.info;

  return (
    <div style={{
      background: style.background,
      borderBottom: `1px solid ${style.border}`,
      color: style.color,
      padding: '10px 20px',
      fontSize: 13,
      fontWeight: 500,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      zIndex: 999,
      position: 'relative',
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
        <Icon size={18} style={{ flexShrink: 0 }} />
        <span>
          <strong style={{ fontWeight: 700 }}>{current.title}{!/[!.:?]$/.test(current.title) ? ':' : ''}</strong> {current.message}
        </span>
      </div>
      <button
        onClick={() => setDismissed((prev) => [...prev, current.id])}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'inherit',
          opacity: 0.8,
          padding: 4,
          borderRadius: 4,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.15s',
        }}
        onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
        onMouseLeave={(e) => e.currentTarget.style.opacity = '0.8'}
        title="Dismiss announcement"
      >
        <X size={16} />
      </button>
    </div>
  );
}
