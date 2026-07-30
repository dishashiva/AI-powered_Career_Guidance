import { useState, useEffect } from 'react';
import { resumesAPI } from '../api/client';
import ChatInterface from '../components/ChatInterface';
import { Bot, FileText, HelpCircle } from 'lucide-react';

export default function ChatPage() {
  const [resumes, setResumes] = useState([]);
  const [selectedResume, setSelectedResume] = useState(null);

  useEffect(() => {
    resumesAPI.list().then((r) => {
      setResumes(r.data);
      if (r.data.length > 0) setSelectedResume(r.data[0].id);
    }).catch(() => {});
  }, []);

  return (
    <div style={{ position: 'relative', minHeight: 'calc(100vh - 57px)' }}>
      <div className="container chat-container">
        {/* Sidebar */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="card" style={{ padding: 20, textAlign: 'center' }}>
            <div style={{
              width: 40, height: 40, borderRadius: 'var(--radius-md)',
              background: 'var(--accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 10px',
            }}>
              <Bot size={20} color="#fff" />
            </div>
            <h2 style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>CareerAI Coach</h2>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Your personal AI career advisor</p>
          </div>

          {resumes.length > 0 && (
            <div className="card" style={{ padding: 14 }}>
              <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: 10 }}>
                Context resume
              </p>
              {resumes.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setSelectedResume(r.id)}
                  style={{
                    width: '100%', textAlign: 'left', padding: '8px 10px', borderRadius: 'var(--radius-md)',
                    background: selectedResume === r.id ? 'var(--accent-subtle)' : 'transparent',
                    border: `1px solid ${selectedResume === r.id ? 'var(--border-accent)' : 'transparent'}`,
                    cursor: 'pointer', marginBottom: 4, transition: 'all var(--transition)',
                    display: 'flex', alignItems: 'center', gap: 8,
                    fontSize: 13, color: selectedResume === r.id ? 'var(--accent)' : 'var(--text-secondary)',
                  }}
                >
                  <FileText size={13} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {r.filename}
                  </span>
                </button>
              ))}
            </div>
          )}

          <div className="card" style={{ padding: 14 }}>
            <div className="flex items-center gap-2" style={{ marginBottom: 10 }}>
              <HelpCircle size={13} color="var(--text-muted)" />
              <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Try asking</p>
            </div>
            {[
              'Suggest skills to learn next',
              'Review my career path options',
              'Help me prepare for interviews',
              'How to improve my LinkedIn?',
            ].map((tip) => (
              <p key={tip} style={{ fontSize: 12, color: 'var(--text-muted)', padding: '4px 0', borderBottom: '1px solid var(--border)' }}>
                {tip}
              </p>
            ))}
          </div>
        </aside>

        {/* Chat */}
        <div className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div style={{
            padding: '12px 16px', borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: 'var(--radius-md)',
              background: 'var(--accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Bot size={14} color="#fff" />
            </div>
            <div>
              <p style={{ fontWeight: 600, fontSize: 13 }}>CareerAI Coach</p>
              <div className="flex items-center gap-1">
                <div style={{ width: 6, height: 6, borderRadius: 'var(--radius-full)', background: 'var(--green-500)' }} />
                <span style={{ fontSize: 11, color: 'var(--green-600)' }}>Online</span>
              </div>
            </div>
          </div>

          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <ChatInterface resumeId={selectedResume} />
          </div>
        </div>
      </div>
    </div>
  );
}
