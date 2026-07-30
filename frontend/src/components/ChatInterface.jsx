import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User } from 'lucide-react';
import { aiAPI } from '../api/client';
import toast from 'react-hot-toast';

const QUICK_PROMPTS = [
  "What skills should I learn next?",
  "How can I improve my ATS score?",
  "Suggest a career path for me",
  "How to negotiate a higher salary?",
];

export default function ChatInterface({ resumeId }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi! I'm your CareerAI coach. I've analyzed your profile and I'm ready to help. What would you like to know?",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async (text) => {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: msg }]);
    setLoading(true);
    try {
      const res = await aiAPI.chat(msg, resumeId);
      setMessages((prev) => [...prev, { role: 'assistant', content: res.data.reply }]);
    } catch {
      toast.error('Failed to get response');
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Sorry, I had trouble connecting. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  const renderContent = (text) => {
    return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {messages.map((msg, i) => (
          <div key={i} className="flex" style={{ gap: 10, flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}>
            <div style={{
              width: 28, height: 28, borderRadius: 'var(--radius-md)', flexShrink: 0,
              background: msg.role === 'assistant' ? 'var(--accent)' : 'var(--gray-100)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {msg.role === 'assistant' ? <Bot size={14} color="#fff" /> : <User size={14} color="var(--text-muted)" />}
            </div>
            <div style={{
              maxWidth: '75%',
              padding: '10px 14px',
              borderRadius: msg.role === 'user' ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
              background: msg.role === 'user' ? 'var(--accent-subtle)' : 'var(--gray-50)',
              border: '1px solid',
              borderColor: msg.role === 'user' ? 'var(--border-accent)' : 'var(--border)',
              fontSize: 13,
              lineHeight: 1.6,
              color: 'var(--text-primary)',
            }}
              dangerouslySetInnerHTML={{ __html: renderContent(msg.content) }}
            />
          </div>
        ))}

        {loading && (
          <div className="flex" style={{ gap: 10 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 'var(--radius-md)',
              background: 'var(--accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Bot size={14} color="#fff" />
            </div>
            <div style={{
              padding: '10px 14px', borderRadius: '12px 12px 12px 4px',
              background: 'var(--gray-50)', border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <div className="spinner" style={{ width: 14, height: 14 }} />
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Thinking...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {messages.length <= 2 && (
        <div style={{ padding: '0 16px 10px' }}>
          <div className="flex" style={{ flexWrap: 'wrap', gap: 6 }}>
            {QUICK_PROMPTS.map((p) => (
              <button key={p} onClick={() => send(p)} className="btn btn-secondary btn-sm" style={{ fontSize: 12 }}>
                {p}
              </button>
            ))}
          </div>
        </div>
      )}

      <div style={{
        padding: '10px 16px',
        borderTop: '1px solid var(--border)',
        display: 'flex', gap: 8,
      }}>
        <input
          className="input"
          placeholder="Ask your career coach..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
          disabled={loading}
          style={{ flex: 1 }}
        />
        <button
          className="btn btn-primary btn-sm"
          onClick={() => send()}
          disabled={loading || !input.trim()}
          style={{ flexShrink: 0 }}
        >
          <Send size={14} />
        </button>
      </div>
    </div>
  );
}
