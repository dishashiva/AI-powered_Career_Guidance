import { useState } from 'react';
import { feedbackAPI } from '../api/client';
import { MessageSquarePlus, Star, X, Send, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function FeedbackModal() {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState('general');
  const [rating, setRating] = useState(5);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) {
      toast.error('Please enter your feedback message');
      return;
    }
    setSubmitting(true);
    try {
      await feedbackAPI.submit({ category, rating, message });
      toast.success('Thank you! Your feedback has been submitted to the admin team.');
      setMessage('');
      setOpen(false);
    } catch {
      toast.error('Failed to submit feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Floating feedback trigger button */}
      <button
        onClick={() => setOpen(true)}
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 990,
          background: 'var(--accent)',
          color: '#fff',
          border: 'none',
          borderRadius: 99,
          padding: '10px 18px',
          fontSize: 13,
          fontWeight: 600,
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          cursor: 'pointer',
          transition: 'transform 0.2s, box-shadow 0.2s',
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        id="feedback-floating-btn"
      >
        <MessageSquarePlus size={16} />
        Feedback
      </button>

      {/* Modal */}
      {open && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        }}>
          <div className="card animate-fade-in" style={{ maxWidth: 460, width: '100%', padding: 24, position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', justify: 'between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 'var(--radius-md)',
                  background: 'var(--accent-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <MessageSquarePlus size={18} color="var(--accent)" />
                </div>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Platform Feedback & Support</h3>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>Help us improve your CareerAI experience</p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', position: 'absolute', top: 20, right: 20 }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Category */}
              <div>
                <label className="form-label" style={{ fontSize: 12 }}>Feedback Category</label>
                <select
                  className="input"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  style={{ width: '100%', fontSize: 13 }}
                >
                  <option value="general">💬 General Feedback</option>
                  <option value="feature">✨ Feature Request</option>
                  <option value="bug">🐛 Bug Report</option>
                  <option value="ui">🎨 UI & Visual Experience</option>
                </select>
              </div>

              {/* Rating */}
              <div>
                <label className="form-label" style={{ fontSize: 12 }}>Overall Platform Rating</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 4,
                      }}
                    >
                      <Star
                        size={22}
                        fill={star <= rating ? '#f59e0b' : 'none'}
                        color={star <= rating ? '#f59e0b' : 'var(--text-muted)'}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="form-label" style={{ fontSize: 12 }}>Your Comments / Feedback</label>
                <textarea
                  className="input"
                  rows={4}
                  placeholder="Share details, ideas, or issues you experienced..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  style={{ width: '100%', fontSize: 13, resize: 'vertical' }}
                  required
                />
              </div>

              {/* Submit button */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 6 }}>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setOpen(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={submitting}
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  {submitting ? <Loader2 size={14} className="spin" /> : <Send size={14} />}
                  Submit Feedback
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
