// Utility for maintaining unified active resume state across all pages

export function getActiveResumeId(resumesList = []) {
  const stored = localStorage.getItem('active_resume_id');
  if (stored && Array.isArray(resumesList) && resumesList.length > 0) {
    const found = resumesList.find(r => String(r.id) === String(stored));
    if (found) return found.id;
  }
  return resumesList[0]?.id || (stored ? parseInt(stored) : null);
}

export function setActiveResumeId(id) {
  if (id) {
    localStorage.setItem('active_resume_id', String(id));
    window.dispatchEvent(new CustomEvent('activeResumeChanged', { detail: { id: parseInt(id) } }));
  }
}
