import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User } from 'lucide-react';
import { marked } from 'marked';
import { aiAPI } from '../api/client';
import toast from 'react-hot-toast';

marked.setOptions({
  gfm: true,
  breaks: true,
});

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
    if (!text) return '';
    try {
      return marked.parse(text);
    } catch {
      return text;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#ffffff', borderRadius: 12 }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {messages.map((msg, i) => (
          <div key={i} className="flex" style={{ gap: 12, flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}>
            <div style={{
              width: 32, height: 32, borderRadius: 10, flexShrink: 0,
              background: msg.role === 'assistant' ? 'linear-gradient(135deg, #4f46e5, #6366f1)' : '#f1f5f9',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: msg.role === 'assistant' ? '0 2px 6px rgba(79,70,229,0.25)' : 'none',
            }}>
              {msg.role === 'assistant' ? <Bot size={16} color="#fff" /> : <User size={16} color="#475569" />}
            </div>
            <div
              className="markdown-content"
              style={{
                maxWidth: '82%',
                padding: '14px 18px',
                borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                background: msg.role === 'user' ? '#e0e7ff' : '#f8fafc',
                border: '1px solid',
                borderColor: msg.role === 'user' ? '#c7d2fe' : '#e2e8f0',
                fontSize: 13.5,
                lineHeight: 1.6,
                color: msg.role === 'user' ? '#3730a3' : '#0f172a',
                boxShadow: msg.role === 'assistant' ? '0 2px 6px rgba(15,23,42,0.03)' : 'none',
              }}
              dangerouslySetInnerHTML={{ __html: renderContent(msg.content) }}
            />
          </div>
        ))}

        {loading && (
          <div className="flex" style={{ gap: 12 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 10,
              background: 'linear-gradient(135deg, #4f46e5, #6366f1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Bot size={16} color="#fff" />
            </div>
            <div style={{
              padding: '12px 18px', borderRadius: '16px 16px 16px 4px',
              background: '#f8fafc', border: '1px solid #e2e8f0',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span style={{
                width: 6, height: 6, borderRadius: '50%', background: '#4f46e5',
                animation: 'pulse 1.2s cubic-bezier(0, 0, 0.2, 1) infinite'
              }} />
              <span style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>AI Coach is thinking…</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {messages.length <= 2 && (
        <div style={{ padding: '0 20px 12px' }}>
          <div className="flex" style={{ flexWrap: 'wrap', gap: 8 }}>
            {QUICK_PROMPTS.map((p) => (
              <button
                key={p}
                onClick={() => send(p)}
                style={{
                  background: '#f1f5f9', border: '1px solid #e2e8f0',
                  borderRadius: 99, padding: '6px 14px', fontSize: 12,
                  fontWeight: 500, color: '#334155', cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#e0e7ff'; e.currentTarget.style.color = '#4338ca'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#334155'; }}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}

      <div style={{
        padding: '12px 20px',
        borderTop: '1px solid #e2e8f0',
        display: 'flex', gap: 10, background: '#ffffff',
        borderRadius: '0 0 12px 12px',
      }}>
        <input
          className="input"
          placeholder="Ask your career coach anything..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
          disabled={loading}
          style={{ flex: 1, borderRadius: 10 }}
        />
        <button
          className="btn btn-primary"
          onClick={() => send()}
          disabled={loading || !input.trim()}
          style={{ flexShrink: 0, borderRadius: 10, padding: '0 18px' }}
        >
          <Send size={15} />
        </button>
      </div>
    </div>
  );
}
