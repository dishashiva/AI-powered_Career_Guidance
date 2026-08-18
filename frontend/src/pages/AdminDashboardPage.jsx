import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import {
  Shield, Users, FileText, Briefcase, BookOpen, MessageSquare,
  Activity, Server, Download, Search, Plus, Trash2, Edit, CheckCircle,
  XCircle, AlertCircle, RefreshCw, Key, ExternalLink, Eye, ChevronRight, ChevronLeft,
  TrendingUp, BarChart2, Bell, Check, X, Filter, Sparkles, UserCheck, UserX, UserPlus, LogOut, Menu,
  Cpu, Zap, Clock, DollarSign, Globe
} from 'lucide-react';
function TablePagination({ currentPage, totalItems, pageSize, onPageChange }) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  if (totalItems === 0) return null;
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(totalItems, currentPage * pageSize);

  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '12px 16px', borderTop: '1px solid var(--border)', fontSize: 13,
      color: 'var(--text-muted)'
    }}>
      <div>
        Showing <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{startItem}–{endItem}</span> of <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{totalItems}</span> items
      </div>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <button
          className="btn btn-ghost btn-sm"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          style={{ gap: 4, padding: '4px 10px', fontSize: 12 }}
          aria-label="Previous Page"
        >
          <ChevronLeft size={15} /> Prev
        </button>
        <span style={{ padding: '0 8px', fontWeight: 600, color: 'var(--text-primary)', fontSize: 12 }}>
          Page {currentPage} of {totalPages}
        </span>
        <button
          className="btn btn-ghost btn-sm"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          style={{ gap: 4, padding: '4px 10px', fontSize: 12 }}
          aria-label="Next Page"
        >
          Next <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon = Search, title = "No records found", description = "No items match your current filters or query.", onReset }) {
  return (
    <div style={{ padding: '48px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={22} color="#64748b" />
      </div>
      <h4 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: '#0f172a' }}>{title}</h4>
      <p style={{ fontSize: 13, color: '#64748b', margin: 0, maxWidth: 360 }}>{description}</p>
      {onReset && (
        <button className="btn btn-secondary btn-sm" onClick={onReset} style={{ marginTop: 6, fontSize: 12 }}>
          Reset Filters
        </button>
      )}
    </div>
  );
}

export default function AdminDashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Dashboard Stats
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // User Management state
  const [users, setUsers] = useState([]);
  const [userQuery, setUserQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedUserProfile, setSelectedUserProfile] = useState(null);

  // Table Pagination State
  const [userPage, setUserPage] = useState(1);
  const [resumePage, setResumePage] = useState(1);
  const [jobPage, setJobPage] = useState(1);
  const [coursePage, setCoursePage] = useState(1);
  const [logPage, setLogPage] = useState(1);
  const [aiLogPage, setAiLogPage] = useState(1);

  // Resume Management state
  const [resumes, setResumes] = useState([]);
  const [parseStats, setParseStats] = useState(null);
  const [loadingResumes, setLoadingResumes] = useState(false);
  const [resumeViewerUrl, setResumeViewerUrl] = useState(null);
  const [resumeViewerTitle, setResumeViewerTitle] = useState('');

  // Jobs state
  const [jobs, setJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [jobModal, setJobModal] = useState(null); // null | { isEdit: bool, data: obj }

  // Courses state
  const [courses, setCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [courseModal, setCourseModal] = useState(null); // null | { isEdit: bool, data: obj }
  const [courseScrapeModal, setCourseScrapeModal] = useState(null); // null | { keyword: str, count: num }
  const [scrapingCourses, setScrapingCourses] = useState(false);

  // Analytics state
  const [atsAnalytics, setAtsAnalytics] = useState(null);
  const [skillAnalytics, setSkillAnalytics] = useState(null);
  const [careerAnalytics, setCareerAnalytics] = useState([]);

  // Feedback state
  const [feedbacks, setFeedbacks] = useState([]);
  const [feedbackStatusFilter, setFeedbackStatusFilter] = useState('');
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  const [feedbackNoteModal, setFeedbackNoteModal] = useState(null);

  // Activity logs state
  const [activityLogs, setActivityLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // System Health & AI API Usage state
  const [systemHealth, setSystemHealth] = useState(null);
  const [aiUsage, setAiUsage] = useState(null);
  const [loadingHealth, setLoadingHealth] = useState(false);
  const [testingPing, setTestingPing] = useState(false);

  // Announcements state
  const [announcements, setAnnouncements] = useState([]);
  const [annModal, setAnnModal] = useState(null);
  const [savingAnn, setSavingAnn] = useState(false);

  // ─── Fetch Stats ──────────────────────────────────────────────
  const fetchStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const res = await adminAPI.getStats();
      setStats(res.data);
    } catch {
      toast.error('Failed to load admin stats');
    } finally {
      setLoadingStats(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // ─── Tab Switch Handler ───────────────────────────────────────
  useEffect(() => {
    if (activeTab === 'users') loadUsers();
    if (activeTab === 'resumes') loadResumes();
    if (activeTab === 'jobs') loadJobs();
    if (activeTab === 'courses') loadCourses();
    if (activeTab === 'analytics') loadAnalytics();
    if (activeTab === 'feedback') loadFeedback();
    if (activeTab === 'logs') loadLogs();
    if (activeTab === 'health') loadHealth();
    if (activeTab === 'announcements') loadAnnouncements();
  }, [activeTab, roleFilter, statusFilter, feedbackStatusFilter]);

  // ─── Loaders ──────────────────────────────────────────────────
  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await adminAPI.listUsers({ query: userQuery, role: roleFilter, status_filter: statusFilter });
      setUsers(res.data);
    } catch {
      toast.error('Failed to fetch users');
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadResumes = async () => {
    setLoadingResumes(true);
    try {
      const [resList, pStats] = await Promise.all([adminAPI.listResumes(), adminAPI.getParseStats()]);
      setResumes(resList.data);
      setParseStats(pStats.data);
    } catch {
      toast.error('Failed to fetch resumes');
    } finally {
      setLoadingResumes(false);
    }
  };

  const loadJobs = async () => {
    setLoadingJobs(true);
    try {
      const res = await adminAPI.listJobs();
      setJobs(res.data);
    } catch {
      toast.error('Failed to fetch job postings');
    } finally {
      setLoadingJobs(false);
    }
  };

  const loadCourses = async () => {
    setLoadingCourses(true);
    try {
      const res = await adminAPI.listCourses();
      setCourses(res.data);
    } catch {
      toast.error('Failed to fetch courses');
    } finally {
      setLoadingCourses(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      const [ats, skills, careers] = await Promise.all([
        adminAPI.getAtsAnalytics(),
        adminAPI.getSkillAnalytics(),
        adminAPI.getCareerAnalytics(),
      ]);
      setAtsAnalytics(ats.data);
      setSkillAnalytics(skills.data);
      setCareerAnalytics(careers.data);
    } catch {
      toast.error('Failed to load analytics data');
    }
  };

  const loadFeedback = async () => {
    setLoadingFeedback(true);
    try {
      const res = await adminAPI.listFeedback({ status: feedbackStatusFilter });
      setFeedbacks(res.data);
    } catch {
      toast.error('Failed to load feedback');
    } finally {
      setLoadingFeedback(false);
    }
  };

  const loadLogs = async () => {
    setLoadingLogs(true);
    try {
      const res = await adminAPI.getActivityLogs();
      setActivityLogs(res.data);
    } catch {
      toast.error('Failed to load activity logs');
    } finally {
      setLoadingLogs(false);
    }
  };

  const loadHealth = async () => {
    setLoadingHealth(true);
    try {
      const [healthRes, usageRes] = await Promise.all([
        adminAPI.getSystemHealth(),
        adminAPI.getAiUsage(),
      ]);
      setSystemHealth(healthRes.data);
      setAiUsage(usageRes.data);
    } catch {
      toast.error('Failed to check system health and AI API usage');
    } finally {
      setLoadingHealth(false);
    }
  };

  const handleTestPing = async () => {
    setTestingPing(true);
    try {
      const res = await adminAPI.testAiPing();
      if (res.data.status === 'success') {
        toast.success(`AI API Ping Successful! Responded in ${res.data.latency_ms} ms`);
      } else {
        toast.error(`AI Ping failed: ${res.data.error}`);
      }
      loadHealth();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Live AI API test failed');
    } finally {
      setTestingPing(false);
    }
  };



  const handleScrapeCourses = async (e) => {
    e.preventDefault();
    if (!courseScrapeModal?.keyword) return;
    setScrapingCourses(true);
    try {
      const res = await adminAPI.scrapeCourses({
        keyword: courseScrapeModal.keyword,
        count: courseScrapeModal.count || 5,
      });
      toast.success(res.data.message || 'Scraped online courses successfully');
      setCourseScrapeModal(null);
      loadCourses();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to scrape online courses');
    } finally {
      setScrapingCourses(false);
    }
  };

  const loadAnnouncements = async () => {
    try {
      const res = await adminAPI.listAnnouncements();
      setAnnouncements(res.data);
    } catch {
      toast.error('Failed to load announcements');
    }
  };

  const handleSaveAnnouncement = async (e) => {
    e.preventDefault();
    if (!annModal || !annModal.title.trim() || !annModal.message.trim()) {
      toast.error('Please enter both title and message for the announcement');
      return;
    }
    setSavingAnn(true);
    try {
      if (annModal.id) {
        await adminAPI.updateAnnouncement(annModal.id, {
          title: annModal.title.trim(),
          message: annModal.message.trim(),
          type: annModal.type || 'info',
          is_active: annModal.is_active ?? true,
        });
        toast.success('Announcement updated successfully!');
      } else {
        await adminAPI.createAnnouncement({
          title: annModal.title.trim(),
          message: annModal.message.trim(),
          type: annModal.type || 'info',
          is_active: annModal.is_active ?? true,
        });
        toast.success('Announcement broadcasted to all users!');
      }
      setAnnModal(null);
      loadAnnouncements();
      fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to save announcement');
    } finally {
      setSavingAnn(false);
    }
  };

  const handleDeleteAnnouncement = async (annId, annTitle) => {
    if (!window.confirm(`Are you sure you want to delete the announcement "${annTitle || 'this announcement'}"?`)) return;
    try {
      await adminAPI.deleteAnnouncement(annId);
      toast.success('Announcement deleted successfully!');
      if (annModal && annModal.id === annId) setAnnModal(null);
      loadAnnouncements();
      fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to delete announcement');
    }
  };

  // ─── Actions ──────────────────────────────────────────────────
  const handleToggleUserStatus = async (userId, currentActive, email) => {
    const actionLabel = !currentActive ? 'activate' : 'deactivate';
    if (!window.confirm(`Are you sure you want to ${actionLabel} the account for ${email || 'this user'}?`)) return;
    try {
      await adminAPI.updateUserStatus(userId, !currentActive);
      toast.success(`User (${email}) ${!currentActive ? 'activated' : 'deactivated'}`);
      loadUsers();
      fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update user status');
    }
  };

  const handleToggleUserRole = async (userId, currentAdmin, email) => {
    const actionLabel = !currentAdmin ? 'promote to Global Admin' : 'demote to Regular User';
    if (!window.confirm(`SECURITY CONFIRMATION:\nAre you sure you want to ${actionLabel} for (${email || 'this user'})?`)) return;
    try {
      await adminAPI.updateUserRole(userId, !currentAdmin);
      toast.success(`User (${email}) role updated to ${!currentAdmin ? 'Admin' : 'User'}`);
      loadUsers();
      fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update user role');
    }
  };

  const handleDeleteUser = async (userId, email) => {
    if (!window.confirm(`DANGER ZONE:\nAre you sure you want to permanently delete the account for (${email || 'this user'})? This action cannot be undone.`)) return;
    try {
      await adminAPI.deleteUser(userId);
      toast.success(`User (${email}) account deleted`);
      loadUsers();
      fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to delete user');
    }
  };

  const handleResetPassword = async (userId, email) => {
    if (!window.confirm(`Are you sure you want to trigger a password reset for (${email || 'this user'})?`)) return;
    try {
      const res = await adminAPI.resetUserPassword(userId);
      toast.success(res.data.message, { duration: 5000 });
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to reset password');
    }
  };

  const handleViewResume = async (resumeId, filename) => {
    try {
      const res = await adminAPI.getResumeFile(resumeId);
      const mimeType = filename.toLowerCase().endswith('.pdf') ? 'application/pdf' : 'text/plain';
      const url = URL.createObjectURL(new Blob([res.data], { type: mimeType }));
      setResumeViewerUrl(url);
      setResumeViewerTitle(filename);
    } catch {
      toast.error('Failed to preview resume file');
    }
  };

  const handleExport = async (reportType, format = 'csv') => {
    try {
      const res = await adminAPI.exportReport(reportType, format);
      if (format === 'json') {
        const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
        triggerBlobDownload(blob, `${reportType}_report.json`);
      } else {
        triggerBlobDownload(res.data, `${reportType}_report.csv`);
      }
      toast.success(`Exported ${reportType} report as ${format.toUpperCase()}`);
    } catch {
      toast.error('Failed to export report');
    }
  };

  const triggerBlobDownload = (blobData, filename) => {
    const url = URL.createObjectURL(blobData);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const navCategories = [
    {
      title: 'OPERATIONS & CONTENT',
      tabs: [
        { id: 'overview', label: 'Overview', icon: TrendingUp },
        { id: 'jobs', label: 'Job Postings', icon: Briefcase, badge: stats?.content?.jobs },
        { id: 'courses', label: 'Courses', icon: BookOpen, badge: stats?.content?.courses },
        { id: 'announcements', label: 'Announcements', icon: Bell, badge: stats?.activity?.announcements_total },
      ]
    },
    {
      title: 'USERS & SUPPORT',
      tabs: [
        { id: 'users', label: 'User Directory', icon: Users, badge: stats?.users?.total },
        { id: 'resumes', label: 'Resumes & Parsing', icon: FileText, badge: stats?.resumes?.total },
        { id: 'feedback', label: 'Feedback & Bugs', icon: MessageSquare, badge: stats?.feedback?.pending },
      ]
    },
    {
      title: 'SYSTEM & DATA',
      tabs: [
        { id: 'analytics', label: 'Skill & ATS Analytics', icon: BarChart2 },
        { id: 'logs', label: 'Activity Logs', icon: Activity, badge: stats?.activity?.logs_total },
        { id: 'health', label: 'System & API', icon: Server },
      ]
    }
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc', position: 'relative' }}>
      {/* Mobile Top Header Bar (< 768px) */}
      <div
        className="show-mobile"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: 56,
          background: '#ffffff',
          color: '#0f172a',
          zIndex: 90,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          borderBottom: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => setIsMobileOpen(true)}
            style={{
              background: 'none',
              border: 'none',
              color: '#0f172a',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              padding: 4,
            }}
            aria-label="Open Navigation Menu"
          >
            <Menu size={22} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 16 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 6,
              background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Shield size={16} color="#fff" />
            </div>
            <span style={{ color: '#0f172a' }}>CareerAI Admin</span>
          </div>
        </div>

        <button
          onClick={handleLogout}
          style={{
            background: '#fee2e2',
            border: 'none',
            color: '#dc2626',
            cursor: 'pointer',
            padding: '6px 12px',
            borderRadius: 6,
            fontSize: 12,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
          title="Sign out"
        >
          <LogOut size={14} /> Sign Out
        </button>
      </div>

      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.4)',
            backdropFilter: 'blur(3px)',
            zIndex: 998,
          }}
        />
      )}

      {/* Left Vertical Sidebar */}
      <aside
        style={{
          width: isCollapsed ? 72 : 260,
          background: '#ffffff',
          color: '#0f172a',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          position: 'sticky',
          top: 0,
          height: '100vh',
          zIndex: 999,
          flexShrink: 0,
          borderRight: '1px solid #e2e8f0',
          boxShadow: '2px 0 10px rgba(0,0,0,0.03)',
        }}
        className={isMobileOpen ? 'mobile-sidebar-open' : 'admin-sidebar'}
      >
        <div>
          {/* Sidebar Header */}
          <div style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: isCollapsed ? 'center' : 'space-between',
            padding: isCollapsed ? '0 12px' : '0 20px',
            borderBottom: '1px solid #e2e8f0',
          }}>
            {!isCollapsed && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(79,70,229,0.3)',
                }}>
                  <Shield size={18} color="#fff" />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a', lineHeight: 1.2 }}>CareerAI</div>
                  <div style={{ fontSize: 11, color: '#4f46e5', fontWeight: 700, letterSpacing: '0.5px' }}>ADMIN PORTAL</div>
                </div>
              </div>
            )}

            {isCollapsed && (
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Shield size={18} color="#fff" />
              </div>
            )}

            {/* Desktop Collapse Toggle */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hide-mobile"
              style={{
                background: '#f1f5f9',
                border: '1px solid #e2e8f0',
                color: '#475569',
                borderRadius: 6,
                padding: 6,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s',
              }}
              title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>

            {/* Mobile Close Button */}
            <button
              onClick={() => setIsMobileOpen(false)}
              className="show-mobile"
              style={{
                background: 'none',
                border: 'none',
                color: '#475569',
                cursor: 'pointer',
                padding: 4,
              }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation Items List */}
          <nav role="navigation" aria-label="Admin Navigation Sidebar" style={{ padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            {navCategories.map((cat, catIdx) => (
              <div key={cat.title} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {!isCollapsed ? (
                  <div style={{
                    fontSize: 10.5, fontWeight: 700, letterSpacing: '0.06em',
                    color: '#94a3b8', padding: '4px 10px', textTransform: 'uppercase'
                  }}>
                    {cat.title}
                  </div>
                ) : (
                  catIdx > 0 && <div style={{ borderTop: '1px solid #e2e8f0', margin: '4px 8px' }} />
                )}

                {cat.tabs.map(({ id, label, icon: Icon, badge }) => {
                  const active = activeTab === id;
                  return (
                    <button
                      key={id}
                      role="tab"
                      aria-selected={active}
                      aria-label={label}
                      onClick={() => {
                        setActiveTab(id);
                        setIsMobileOpen(false);
                      }}
                      title={isCollapsed ? label : undefined}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justify: isCollapsed ? 'center' : 'space-between',
                        width: '100%',
                        padding: isCollapsed ? '10px 0' : '9px 12px',
                        borderRadius: 8,
                        border: 'none',
                        background: active ? 'linear-gradient(135deg, #4f46e5, #4338ca)' : 'transparent',
                        color: active ? '#ffffff' : '#475569',
                        fontWeight: active ? 600 : 500,
                        fontSize: 13,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        position: 'relative',
                      }}
                      onMouseEnter={(e) => {
                        if (!active) {
                          e.currentTarget.style.background = '#f1f5f9';
                          e.currentTarget.style.color = '#0f172a';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!active) {
                          e.currentTarget.style.background = 'transparent';
                          e.currentTarget.style.color = '#475569';
                        }
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Icon size={17} color={active ? '#fff' : (isCollapsed ? '#475569' : '#64748b')} />
                        {!isCollapsed && <span>{label}</span>}
                      </div>

                      {!isCollapsed && badge != null && (
                        <span style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: '2px 7px',
                          borderRadius: 99,
                          background: active ? 'rgba(255,255,255,0.25)' : '#e0e7ff',
                          color: active ? '#fff' : '#4338ca',
                        }}>
                          {badge}
                        </span>
                      )}

                      {isCollapsed && badge != null && (
                        <span style={{
                          position: 'absolute',
                          top: 6,
                          right: 10,
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: '#4f46e5',
                        }} />
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </nav>
        </div>

        {/* Sidebar Footer — Admin User Profile & Sign Out */}
        <div style={{
          borderTop: '1px solid #e2e8f0',
          padding: isCollapsed ? '12px 8px' : '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          background: '#fafafa',
        }}>
          {!isCollapsed ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' }}>
                <div style={{
                  width: 34, height: 34, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: 13, color: '#fff', flexShrink: 0
                }}>
                  {user?.full_name?.[0]?.toUpperCase() || 'A'}
                </div>
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {user?.full_name || 'Admin User'}
                  </div>
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 4,
                    background: '#e0e7ff', color: '#4338ca', textTransform: 'uppercase'
                  }}>
                    Global Admin
                  </span>
                </div>
              </div>

              <button
                onClick={handleLogout}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#64748b',
                  cursor: 'pointer',
                  padding: 6,
                  borderRadius: 6,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#fee2e2'; e.currentTarget.style.color = '#dc2626'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#64748b'; }}
                title="Sign Out of Admin Control Center"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogout}
              style={{
                width: '100%',
                padding: '10px 0',
                borderRadius: 8,
                border: 'none',
                background: '#1e293b',
                color: '#ef4444',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title="Sign out"
            >
              <LogOut size={18} />
            </button>
          )}
        </div>
      </aside>

      {/* Main Administrative Content Panel */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
        overflowX: 'hidden',
      }}>
        {/* Main Content Header Bar */}
        <header style={{
          background: '#0f172a',
          color: '#fff',
          padding: '20px 32px',
          borderBottom: '1px solid #1e293b',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
        }} className="admin-main-header">
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0, color: '#fff' }}>
              Admin Intelligence Control Center
            </h1>
            <p style={{ fontSize: 13, color: '#94a3b8', margin: 0, marginTop: 2 }}>
              Full system oversight, skill analytics, content management, and user operations
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="btn btn-ghost btn-sm" onClick={fetchStats} style={{ color: '#cbd5e1', border: '1px solid #334155' }}>
              <RefreshCw size={14} /> Refresh Stats
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => handleExport('users', 'csv')} style={{ gap: 6 }}>
              <Download size={14} /> Export Users CSV
            </button>
          </div>
        </header>

        {/* Tab View Content */}
        <main className="admin-main-content" style={{ padding: '24px 32px 60px', flex: 1 }}>
        {/* ─── TAB 1: OVERVIEW ────────────────────────────────────────── */}
        {activeTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Stat Cards Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
              {[
                {
                  title: 'Total Registered Users',
                  val: loadingStats ? '...' : (stats?.users?.total ?? 0),
                  sub: loadingStats ? 'Fetching data...' : `${stats?.users?.active ?? 0} active | ${stats?.users?.admins ?? 0} admins`,
                  icon: Users,
                  color: '#3b82f6',
                  bg: '#eff6ff'
                },
                {
                  title: 'Resumes Uploaded',
                  val: loadingStats ? '...' : (stats?.resumes?.total ?? 0),
                  sub: loadingStats ? 'Fetching data...' : `${stats?.resumes?.parsed ?? 0} parsed successfully`,
                  icon: FileText,
                  color: '#8b5cf6',
                  bg: '#f5f3ff'
                },
                {
                  title: 'Average ATS Score',
                  val: loadingStats
                    ? '...'
                    : (stats?.resumes?.average_ats != null && (stats?.resumes?.total > 0 || stats?.resumes?.average_ats > 0)
                        ? `${stats.resumes.average_ats}%`
                        : '0%'),
                  sub: 'Across parsed resumes',
                  icon: TrendingUp,
                  color: '#10b981',
                  bg: '#ecfdf5'
                },
                {
                  title: 'Job Postings in DB',
                  val: loadingStats ? '...' : (stats?.content?.jobs ?? 0),
                  sub: 'Active target roles',
                  icon: Briefcase,
                  color: '#f59e0b',
                  bg: '#fffbeb'
                },
                {
                  title: 'Courses & Certs',
                  val: loadingStats ? '...' : (stats?.content?.courses ?? 0),
                  sub: 'Learning resources',
                  icon: BookOpen,
                  color: '#ec4899',
                  bg: '#fdf2f8'
                },
                {
                  title: 'Pending Feedback',
                  val: loadingStats ? '...' : (stats?.feedback?.pending ?? 0),
                  sub: loadingStats ? 'Fetching data...' : `${stats?.feedback?.total ?? 0} total submissions`,
                  icon: MessageSquare,
                  color: '#06b6d4',
                  bg: '#ecfeff'
                },
              ].map(({ title, val, sub, icon: Icon, color, bg }) => (
                <div key={title} className="card" style={{ padding: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justify: 'between', marginBottom: 12 }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>{title}</span>
                    <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={18} color={color} />
                    </div>
                  </div>
                  <h2 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>{val}</h2>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0, marginTop: 4 }}>{sub}</p>
                </div>
              ))}
            </div>

            {/* Quick Actions & System Info */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
              <div className="card" style={{ padding: 24 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Sparkles size={16} color="var(--accent)" /> Admin Operations Quick Actions
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <button className="btn btn-ghost" onClick={() => setActiveTab('users')} style={{ justifyContent: 'flex-start', gap: 10, padding: 12, border: '1px solid var(--border)' }}>
                    <Users size={16} color="#3b82f6" /> Manage Users & Roles
                  </button>
                  <button className="btn btn-ghost" onClick={() => setActiveTab('jobs')} style={{ justifyContent: 'flex-start', gap: 10, padding: 12, border: '1px solid var(--border)' }}>
                    <Briefcase size={16} color="#10b981" /> View Scraped Job Repository
                  </button>
                  <button className="btn btn-ghost" onClick={() => { setActiveTab('courses'); setCourseScrapeModal({ keyword: 'React', count: 5 }); }} style={{ justifyContent: 'flex-start', gap: 10, padding: 12, border: '1px solid var(--border)' }}>
                    <Globe size={16} color="#ec4899" /> Scrape Online Courses
                  </button>
                  <button className="btn btn-ghost" onClick={() => { setActiveTab('announcements'); setAnnModal({ title: '', message: '', type: 'info', is_active: true }); }} style={{ justifyContent: 'flex-start', gap: 10, padding: 12, border: '1px solid var(--border)' }}>
                    <Bell size={16} color="#f59e0b" /> Broadcast Announcement
                  </button>
                </div>
              </div>

              {/* Reports Export Widget */}
              <div className="card" style={{ padding: 24, background: 'linear-gradient(135deg, #0f172a, #1e293b)', color: '#fff' }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, color: '#fff' }}>
                  Export Data Reports
                </h3>
                <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 16, lineHeight: 1.5 }}>
                  Download structured platform datasets in CSV or JSON format for administrative reporting.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <button className="btn btn-sm" onClick={() => handleExport('users', 'csv')} style={{ background: '#334155', color: '#fff', border: 'none', justifyContent: 'center', gap: 6 }}>
                    <Download size={13} /> Export Users CSV
                  </button>
                  <button className="btn btn-sm" onClick={() => handleExport('resumes', 'csv')} style={{ background: '#334155', color: '#fff', border: 'none', justifyContent: 'center', gap: 6 }}>
                    <Download size={13} /> Export Resumes CSV
                  </button>
                  <button className="btn btn-sm" onClick={() => handleExport('activity', 'csv')} style={{ background: '#334155', color: '#fff', border: 'none', justifyContent: 'center', gap: 6 }}>
                    <Download size={13} /> Export Activity Audit CSV
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 2: USER DIRECTORY ────────────────────────────────────── */}
        {activeTab === 'users' && (
          <div className="card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justify: 'between', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
              <div>
                <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>User Management</h2>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>View, update status, change roles, or reset credentials</p>
              </div>

              {/* Filters */}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <div style={{ position: 'relative' }}>
                  <Search size={15} style={{ position: 'absolute', left: 10, top: 10, color: 'var(--text-muted)' }} />
                  <input
                    className="input"
                    placeholder="Search name or email..."
                    value={userQuery}
                    onChange={(e) => setUserQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && loadUsers()}
                    style={{ paddingLeft: 32, fontSize: 13, width: 220 }}
                  />
                </div>

                <select className="input" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} style={{ fontSize: 13 }}>
                  <option value="">All Roles</option>
                  <option value="admin">Admin</option>
                  <option value="user">User</option>
                </select>

                <select className="input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ fontSize: 13 }}>
                  <option value="">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="inactive">Deactivated</option>
                </select>

                <button className="btn btn-primary btn-sm" onClick={loadUsers}>
                  Filter
                </button>
              </div>
            </div>

            {/* Users Table */}
            {loadingUsers ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading users list...</div>
            ) : users.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No Users Found"
                description="No user accounts match your search query or role/status filters."
                onReset={() => { setUserQuery(''); setRoleFilter(''); setStatusFilter(''); setUserPage(1); loadUsers(); }}
              />
            ) : (
              <>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--border)', color: 'var(--text-muted)', fontSize: 12 }}>
                        <th style={{ padding: '10px 12px' }}>User</th>
                        <th style={{ padding: '10px 12px' }}>Role</th>
                        <th style={{ padding: '10px 12px' }}>Status</th>
                        <th style={{ padding: '10px 12px' }}>Target Title</th>
                        <th style={{ padding: '10px 12px' }}>Resumes</th>
                        <th style={{ padding: '10px 12px' }}>Joined Date</th>
                        <th style={{ padding: '10px 12px', textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.slice((userPage - 1) * 10, userPage * 10).map((u) => (
                        <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '12px' }}>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{u.full_name}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{u.email}</div>
                          </td>
                          <td style={{ padding: '12px' }}>
                            {u.is_admin ? (
                              <span className="badge badge-indigo" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                <Shield size={11} /> Admin
                              </span>
                            ) : (
                              <span className="badge badge-gray">User</span>
                            )}
                          </td>
                          <td style={{ padding: '12px' }}>
                            {u.is_active ? (
                              <span className="badge badge-green">Active</span>
                            ) : (
                              <span className="badge badge-red">Deactivated</span>
                            )}
                          </td>
                          <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>
                            {u.target_title || u.current_title || '—'}
                          </td>
                          <td style={{ padding: '12px' }}>
                            <span className="badge badge-gray">{u.resumes_count}</span>
                          </td>
                          <td style={{ padding: '12px', color: 'var(--text-muted)', fontSize: 12 }}>
                            {new Date(u.created_at).toLocaleDateString()}
                          </td>
                          <td style={{ padding: '12px', textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                              {/* Toggle active status */}
                              <button
                                className="btn btn-ghost btn-sm"
                                title={u.is_active ? 'Deactivate Account' : 'Activate Account'}
                                aria-label={u.is_active ? 'Deactivate Account' : 'Activate Account'}
                                onClick={() => handleToggleUserStatus(u.id, u.is_active, u.email)}
                                disabled={u.id === user?.id}
                              >
                                {u.is_active ? <UserX size={15} color="var(--red-500)" /> : <UserCheck size={15} color="var(--green-600)" />}
                              </button>

                              {/* Toggle role */}
                              <button
                                className="btn btn-ghost btn-sm"
                                title={u.is_admin ? 'Demote to User' : 'Promote to Admin'}
                                aria-label={u.is_admin ? 'Demote to User' : 'Promote to Admin'}
                                onClick={() => handleToggleUserRole(u.id, u.is_admin, u.email)}
                                disabled={u.id === user?.id}
                              >
                                <Shield size={15} color={u.is_admin ? 'var(--amber-500)' : 'var(--indigo-500)'} />
                              </button>

                              {/* Reset password */}
                              <button
                                className="btn btn-ghost btn-sm"
                                title="Reset Password"
                                aria-label="Reset Password"
                                onClick={() => handleResetPassword(u.id, u.email)}
                              >
                                <Key size={15} color="var(--blue-500)" />
                              </button>

                              {/* Delete */}
                              <button
                                className="btn btn-ghost btn-sm"
                                title="Delete User"
                                aria-label="Delete User"
                                onClick={() => handleDeleteUser(u.id, u.email)}
                                disabled={u.id === user?.id}
                              >
                                <Trash2 size={15} color="var(--red-500)" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <TablePagination
                  currentPage={userPage}
                  totalItems={users.length}
                  pageSize={10}
                  onPageChange={setUserPage}
                />
              </>
            )}
          </div>
        )}

        {/* ─── TAB 3: RESUMES & PARSING MONITORING ─────────────────────── */}
        {activeTab === 'resumes' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Parsing Stats Bar */}
            {parseStats && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
                <div className="card" style={{ padding: 16 }}>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Total Uploads</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>{parseStats.total}</div>
                </div>
                <div className="card" style={{ padding: 16 }}>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Success Rate</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--green-600)' }}>{parseStats.success_rate}%</div>
                </div>
                <div className="card" style={{ padding: 16 }}>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Completed Parses</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--blue-600)' }}>{parseStats.completed}</div>
                </div>
                <div className="card" style={{ padding: 16 }}>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Parse Failures</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 700, color: parseStats.failed > 0 ? 'var(--red-500)' : 'var(--text-muted)' }}>{parseStats.failed}</div>
                </div>
              </div>
            )}

            {/* Resumes Table */}
            <div className="card" style={{ padding: 24 }}>
              <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 16 }}>All Uploaded Resumes</h2>
              {loadingResumes ? (
                <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading resumes...</div>
              ) : resumes.length === 0 ? (
                <EmptyState
                  icon={FileText}
                  title="No Resumes Uploaded"
                  description="No candidate resumes have been uploaded to the system yet."
                />
              ) : (
                <>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid var(--border)', color: 'var(--text-muted)', fontSize: 12, textAlign: 'left' }}>
                          <th style={{ padding: '10px' }}>Filename</th>
                          <th style={{ padding: '10px' }}>User Email</th>
                          <th style={{ padding: '10px' }}>Parse Status</th>
                          <th style={{ padding: '10px' }}>ATS Score</th>
                          <th style={{ padding: '10px' }}>Uploaded At</th>
                        </tr>
                      </thead>
                      <tbody>
                        {resumes.slice((resumePage - 1) * 10, resumePage * 10).map((r) => (
                          <tr key={r.id} style={{ borderBottom: '1px solid var(--border)' }}>
                            <td style={{ padding: '12px', fontWeight: 500 }}>{r.filename}</td>
                            <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>{r.user_email}</td>
                            <td style={{ padding: '12px' }}>
                              <span className={`badge ${r.parse_status === 'done' ? 'badge-green' : r.parse_status === 'error' ? 'badge-red' : 'badge-amber'}`}>
                                {r.parse_status === 'done' ? 'Completed' : r.parse_status === 'error' ? 'Failed' : 'Processing'}
                              </span>
                            </td>
                            <td style={{ padding: '12px', fontWeight: 700 }}>
                              {r.ats_score != null ? `${r.ats_score.toFixed(0)}%` : '—'}
                            </td>
                            <td style={{ padding: '12px', color: 'var(--text-muted)', fontSize: 12 }}>
                              {new Date(r.created_at).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <TablePagination
                    currentPage={resumePage}
                    totalItems={resumes.length}
                    pageSize={10}
                    onPageChange={setResumePage}
                  />
                </>
              )}
            </div>
          </div>
        )}

        {/* ─── TAB 4: JOB POSTINGS MANAGEMENT ─────────────────────────── */}
        {activeTab === 'jobs' && (
          <div className="card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>Scraped Job Repository</h2>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
                  Automated job listings dynamically scraped & AI-parsed based on user target roles & resumes
                </p>
              </div>
              <span className="badge badge-green" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', fontSize: 12 }}>
                <Sparkles size={14} /> Auto-Scraped via User Resumes
              </span>
            </div>

            {loadingJobs ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading jobs...</div>
            ) : jobs.length === 0 ? (
              <EmptyState
                icon={Briefcase}
                title="No Job Postings Found"
                description="No target role jobs have been auto-scraped for candidates yet."
              />
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
                  {jobs.slice((jobPage - 1) * 6, jobPage * 6).map((j) => (
                    <div key={j.id} className="card" style={{ padding: 18, border: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                        <div>
                          <h4 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>{j.title}</h4>
                          <span style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600 }}>{j.company} • {j.location}</span>
                        </div>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button
                            className="btn btn-ghost btn-sm"
                            title="Delete Job Posting"
                            aria-label="Delete Job Posting"
                            onClick={async () => {
                              if (window.confirm(`Delete job posting for "${j.title}"?`)) {
                                await adminAPI.deleteJob(j.id);
                                toast.success('Job deleted');
                                loadJobs();
                              }
                            }}
                          >
                            <Trash2 size={14} color="var(--red-500)" />
                          </button>
                        </div>
                      </div>

                      <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {j.description}
                      </p>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 12 }}>
                        {j.required_skills?.map((sk) => (
                          <span key={sk} className="badge badge-indigo" style={{ fontSize: 11 }}>{sk}</span>
                        ))}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)' }}>
                        <span>💼 {j.job_type || 'Full-time'}</span>
                        <span>₹{j.salary_min ? (j.salary_min/100000).toFixed(1) : 0}L - ₹{j.salary_max ? (j.salary_max/100000).toFixed(1) : 0}L PA</span>
                      </div>
                    </div>
                  ))}
                </div>

                <TablePagination
                  currentPage={jobPage}
                  totalItems={jobs.length}
                  pageSize={6}
                  onPageChange={setJobPage}
                />
              </>
            )}
          </div>
        )}

        {/* ─── TAB 5: COURSES MANAGEMENT ───────────────────────────────── */}
        {activeTab === 'courses' && (
          <div className="card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>Scraped Course Repository</h2>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
                  Automated course & certification listings dynamically scraped & AI-parsed based on user target roles & resumes
                </p>
              </div>
              <span className="badge badge-green" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', fontSize: 12 }}>
                <Sparkles size={14} /> Auto-Scraped via User Resumes
              </span>
            </div>

            {loadingCourses ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading courses...</div>
            ) : courses.length === 0 ? (
              <EmptyState
                icon={BookOpen}
                title="No Courses Found"
                description="No course certifications have been auto-scraped for candidates yet."
              />
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
                  {courses.slice((coursePage - 1) * 6, coursePage * 6).map((c) => (
                    <div key={c.id} className="card" style={{ padding: 18, border: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                        <div>
                          <h4 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>{c.title}</h4>
                          <span style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600 }}>{c.provider}</span>
                        </div>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button
                            className="btn btn-ghost btn-sm"
                            title="Delete Course"
                            aria-label="Delete Course"
                            onClick={async () => {
                              if (window.confirm(`Delete course "${c.title}"?`)) {
                                await adminAPI.deleteCourse(c.id);
                                toast.success('Course deleted');
                                loadCourses();
                              }
                            }}
                          >
                            <Trash2 size={14} color="var(--red-500)" />
                          </button>
                        </div>
                      </div>

                      <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {c.description}
                      </p>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 12 }}>
                        {c.skills_covered?.map((sk) => (
                          <span key={sk} className="badge badge-indigo" style={{ fontSize: 11 }}>{sk}</span>
                        ))}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)' }}>
                        <span>⭐ {c.rating} • {c.duration}</span>
                        <span>{c.is_free ? 'Free' : 'Paid'}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <TablePagination
                  currentPage={coursePage}
                  totalItems={courses.length}
                  pageSize={6}
                  onPageChange={setCoursePage}
                />
              </>
            )}
          </div>
        )}

        {/* ─── TAB 6: SKILL & ATS ANALYTICS ───────────────────────────── */}
        {activeTab === 'analytics' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* ATS Score Distribution */}
            {atsAnalytics && (
              <div className="card" style={{ padding: 24 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Platform ATS Score Distribution</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 16 }}>
                  <div style={{ padding: 16, borderRadius: 'var(--radius-md)', background: '#fef2f2', border: '1px solid #fecaca' }}>
                    <div style={{ fontSize: 12, color: 'var(--red-600)', fontWeight: 600 }}>Needs Work (&lt; 50%)</div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--red-600)' }}>{atsAnalytics.distribution.low}</div>
                  </div>
                  <div style={{ padding: 16, borderRadius: 'var(--radius-md)', background: '#fefce8', border: '1px solid #fef08a' }}>
                    <div style={{ fontSize: 12, color: 'var(--amber-600)', fontWeight: 600 }}>Moderate (50% - 75%)</div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--amber-600)' }}>{atsAnalytics.distribution.medium}</div>
                  </div>
                  <div style={{ padding: 16, borderRadius: 'var(--radius-md)', background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                    <div style={{ fontSize: 12, color: 'var(--green-600)', fontWeight: 600 }}>Strong (75%+)</div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--green-600)' }}>{atsAnalytics.distribution.high}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Missing vs Matched Skills */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div className="card" style={{ padding: 20 }}>
                <h4 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, color: 'var(--red-600)' }}>
                  ⚠️ Top Missing Skills in Resumes
                </h4>
                {skillAnalytics?.top_missing_skills?.length === 0 ? (
                  <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No skill gap data logged yet.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {skillAnalytics?.top_missing_skills?.map(({ skill, count }) => (
                      <div key={skill} style={{ display: 'flex', justify: 'between', alignItems: 'center', fontSize: 13 }}>
                        <span style={{ fontWeight: 500 }}>{skill}</span>
                        <span className="badge badge-red">{count} candidates missing</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="card" style={{ padding: 20 }}>
                <h4 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, color: 'var(--green-600)' }}>
                  ✅ Top Matched Skills Across Candidates
                </h4>
                {skillAnalytics?.top_matched_skills?.length === 0 ? (
                  <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No matched skill data logged yet.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {skillAnalytics?.top_matched_skills?.map(({ skill, count }) => (
                      <div key={skill} style={{ display: 'flex', justify: 'between', alignItems: 'center', fontSize: 13 }}>
                        <span style={{ fontWeight: 500 }}>{skill}</span>
                        <span className="badge badge-green">{count} candidates matched</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 7: FEEDBACK & BUG REPORTS ──────────────────────────── */}
        {activeTab === 'feedback' && (
          <div className="card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', justify: 'between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>User Feedback & Bug Reports</h2>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>Review user submissions and update status</p>
              </div>
              <select
                className="input"
                value={feedbackStatusFilter}
                onChange={(e) => setFeedbackStatusFilter(e.target.value)}
                style={{ fontSize: 13 }}
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="dismissed">Dismissed</option>
              </select>
            </div>

            {loadingFeedback ? (
              <div style={{ padding: 40, textAlign: 'center' }}>Loading feedback...</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {feedbacks.map((fb) => (
                  <div key={fb.id} className="card" style={{ padding: 16, border: '1px solid var(--border)', background: '#fff' }}>
                    <div style={{ display: 'flex', justify: 'between', marginBottom: 8 }}>
                      <div>
                        <span className="badge badge-indigo" style={{ marginRight: 8 }}>{fb.category}</span>
                        <span style={{ fontWeight: 600, fontSize: 14 }}>{fb.user_name || fb.user_email || 'Anonymous'}</span>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 8 }}>
                          ({new Date(fb.created_at).toLocaleDateString()})
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <span className={`badge ${fb.status === 'resolved' ? 'badge-green' : fb.status === 'pending' ? 'badge-amber' : 'badge-gray'}`}>
                          {fb.status}
                        </span>
                        <select
                          className="input"
                          value={fb.status}
                          onChange={async (e) => {
                            await adminAPI.updateFeedback(fb.id, { status: e.target.value });
                            toast.success('Feedback status updated');
                            loadFeedback();
                          }}
                          style={{ fontSize: 11, padding: '2px 6px' }}
                        >
                          <option value="pending">Pending</option>
                          <option value="in_progress">In Progress</option>
                          <option value="resolved">Resolved</option>
                          <option value="dismissed">Dismissed</option>
                        </select>
                      </div>
                    </div>

                    <p style={{ fontSize: 13, color: 'var(--text-primary)', margin: 0, marginBottom: 8 }}>
                      {fb.message}
                    </p>

                    {fb.admin_notes && (
                      <div style={{ fontSize: 12, color: 'var(--accent)', background: 'var(--accent-subtle)', padding: 8, borderRadius: 'var(--radius-sm)' }}>
                        <strong>Admin Notes:</strong> {fb.admin_notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── TAB 8: ACTIVITY LOGS ────────────────────────────────────── */}
        {activeTab === 'logs' && (
          <div className="card" style={{ padding: 24 }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 16 }}>Platform Activity Audit Trail</h2>
            {loadingLogs ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading activity logs...</div>
            ) : activityLogs.length === 0 ? (
              <EmptyState
                icon={Activity}
                title="No Activity Logs Found"
                description="No user platform actions or system audit logs recorded yet."
              />
            ) : (
              <>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--border)', color: 'var(--text-muted)', fontSize: 12, textAlign: 'left' }}>
                        <th style={{ padding: '10px' }}>Timestamp</th>
                        <th style={{ padding: '10px' }}>Action</th>
                        <th style={{ padding: '10px' }}>User Email</th>
                        <th style={{ padding: '10px' }}>Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activityLogs.slice((logPage - 1) * 10, logPage * 10).map((log) => (
                        <tr key={log.id} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '10px', color: 'var(--text-muted)', fontSize: 12 }}>
                            {new Date(log.created_at).toLocaleString()}
                          </td>
                          <td style={{ padding: '10px' }}>
                            <span className="badge badge-gray" style={{ fontWeight: 600 }}>{log.action}</span>
                          </td>
                          <td style={{ padding: '10px', color: 'var(--text-secondary)' }}>
                            {log.user_email || 'System'}
                          </td>
                          <td style={{ padding: '10px', color: 'var(--text-primary)' }}>
                            {log.details || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <TablePagination
                  currentPage={logPage}
                  totalItems={activityLogs.length}
                  pageSize={10}
                  onPageChange={setLogPage}
                />
              </>
            )}
          </div>
        )}

        {/* ─── TAB 9: SYSTEM & API HEALTH + LIVE AI USAGE ────────────── */}
        {activeTab === 'health' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Header & Connectivity Action */}
            <div className="card" style={{ padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
                <div>
                  <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Cpu size={20} color="var(--accent)" /> System & AI API Provider Diagnostics
                  </h2>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0, marginTop: 4 }}>
                    Real-time monitoring of backend database, AI provider keys, token consumption, latency, and live API logs
                  </p>
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={loadHealth}
                    disabled={loadingHealth}
                  >
                    <RefreshCw size={14} className={loadingHealth ? 'animate-spin' : ''} /> Refresh Status
                  </button>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={handleTestPing}
                    disabled={testingPing}
                    style={{ gap: 6 }}
                  >
                    {testingPing ? <RefreshCw size={14} className="animate-spin" /> : <Zap size={14} />}
                    Test Live AI API Call
                  </button>
                </div>
              </div>
            </div>

            {/* System Status Summary Row */}
            {systemHealth && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                <div className="card" style={{ padding: 20 }}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 6 }}>Backend Core API</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#10b981', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <CheckCircle size={18} /> {systemHealth.api_status}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>FastAPI Server Running</div>
                </div>

                <div className="card" style={{ padding: 20 }}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 6 }}>Database Connection</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: systemHealth.database_connected ? '#10b981' : '#ef4444', display: 'flex', alignItems: 'center', gap: 8 }}>
                    {systemHealth.database_connected ? <CheckCircle size={18} /> : <XCircle size={18} />}
                    {systemHealth.database_connected ? 'Connected' : 'Disconnected'}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>MySQL Database Engine</div>
                </div>

                <div className="card" style={{ padding: 20 }}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 6 }}>Active AI Engine</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#4f46e5', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Zap size={18} color="#4f46e5" /> {systemHealth.ai_provider?.toUpperCase()}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Model: {aiUsage?.summary?.model || 'llama-3.3-70b-versatile'}</div>
                </div>

                <div className="card" style={{ padding: 20 }}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 6 }}>AI Success Rate</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#10b981' }}>
                    {aiUsage?.summary?.success_rate != null ? `${aiUsage.summary.success_rate}%` : '100%'}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                    {aiUsage?.summary?.successful_calls ?? 0} success / {aiUsage?.summary?.total_calls ?? 0} requests
                  </div>
                </div>
              </div>
            )}

            {/* AI API Usage Metrics Row */}
            {aiUsage?.summary && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                <div className="card" style={{ padding: 20, background: '#eff6ff', border: '1px solid #bfdbfe' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#1e40af' }}>Total AI API Calls</span>
                    <Cpu size={18} color="#2563eb" />
                  </div>
                  <h3 style={{ fontSize: '1.7rem', fontWeight: 800, margin: 0, color: '#1e3a8a' }}>
                    {aiUsage.summary.total_calls?.toLocaleString() || 0}
                  </h3>
                  <div style={{ fontSize: 12, color: '#3b82f6', marginTop: 4 }}>
                    {aiUsage.summary.successful_calls || 0} successful | {aiUsage.summary.failed_calls || 0} failed
                  </div>
                </div>

                <div className="card" style={{ padding: 20, background: '#f5f3ff', border: '1px solid #ddd6fe' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#5b21b6' }}>Total Tokens Consumed</span>
                    <Zap size={18} color="#7c3aed" />
                  </div>
                  <h3 style={{ fontSize: '1.7rem', fontWeight: 800, margin: 0, color: '#4c1d95' }}>
                    {aiUsage.summary.total_tokens?.toLocaleString() || 0}
                  </h3>
                  <div style={{ fontSize: 12, color: '#7c3aed', marginTop: 4 }}>
                    {aiUsage.summary.prompt_tokens?.toLocaleString() || 0} prompt | {aiUsage.summary.completion_tokens?.toLocaleString() || 0} completion
                  </div>
                </div>

                <div className="card" style={{ padding: 20, background: '#ecfdf5', border: '1px solid #a7f3d0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#065f46' }}>Avg Latency (ms)</span>
                    <Clock size={18} color="#10b981" />
                  </div>
                  <h3 style={{ fontSize: '1.7rem', fontWeight: 800, margin: 0, color: '#064e3b' }}>
                    {aiUsage.summary.avg_latency_ms || 0} ms
                  </h3>
                  <div style={{ fontSize: 12, color: '#059669', marginTop: 4 }}>
                    Response speed across calls
                  </div>
                </div>

                <div className="card" style={{ padding: 20, background: '#fffbeb', border: '1px solid #fde68a' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#92400e' }}>Est. API Cost (USD)</span>
                    <DollarSign size={18} color="#f59e0b" />
                  </div>
                  <h3 style={{ fontSize: '1.7rem', fontWeight: 800, margin: 0, color: '#78350f' }}>
                    ${aiUsage.summary.estimated_cost_usd || '0.0000'}
                  </h3>
                  <div style={{ fontSize: 12, color: '#d97706', marginTop: 4 }}>
                    Based on Groq Llama 3.3 pricing
                  </div>
                </div>
              </div>
            )}

            {/* AI Usage Breakdown by Feature & Provider Keys */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
              {/* Feature Usage Breakdown */}
              <div className="card" style={{ padding: 24 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>AI Usage Breakdown by Platform Feature</h3>
                {aiUsage?.by_feature?.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {aiUsage.by_feature.map((f) => {
                      const pct = Math.min(100, Math.round((f.tokens / (aiUsage.summary?.total_tokens || 1)) * 100));
                      return (
                        <div key={f.feature}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{f.feature}</span>
                            <span style={{ color: 'var(--text-muted)' }}>
                              {f.requests} requests | {f.tokens?.toLocaleString()} tokens ({f.avg_latency_ms} ms avg)
                            </span>
                          </div>
                          <div style={{ height: 8, borderRadius: 99, background: 'var(--gray-100)', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg, #4f46e5, #7c3aed)', borderRadius: 99 }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>No feature usage recorded yet</div>
                )}
              </div>

              {/* Configured Keys */}
              <div className="card" style={{ padding: 24 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Configured Provider Keys</h3>
                {systemHealth?.ai_keys_configured && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {Object.entries(systemHealth.ai_keys_configured).map(([key, configured]) => (
                      <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderRadius: 8, background: 'var(--gray-50)', border: '1px solid var(--border)' }}>
                        <span style={{ fontWeight: 600, fontSize: 12, textTransform: 'uppercase' }}>{key.replace('_api_key', '')}</span>
                        {configured ? (
                          <span style={{ padding: '2px 8px', borderRadius: 99, background: '#dcfce7', color: '#15803d', fontSize: 11, fontWeight: 700 }}>Active</span>
                        ) : (
                          <span style={{ padding: '2px 8px', borderRadius: 99, background: '#f3f4f6', color: '#6b7280', fontSize: 11, fontWeight: 600 }}>Unset</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Live AI API Request Audit Log Table */}
            <div className="card" style={{ padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Live AI API Request Audit Logs</h3>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>Real-time execution log of every Groq AI call across parsing, chat, and matching</p>
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, padding: '2px 8px', borderRadius: 99, background: '#e0e7ff', color: '#4f46e5' }}>
                  {aiUsage?.recent_calls?.length || 0} Recent Logs
                </span>
              </div>

              {aiUsage?.recent_calls?.length > 0 ? (
                <>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid var(--border)', color: 'var(--text-muted)', fontSize: 12 }}>
                          <th style={{ padding: '10px 12px' }}>Timestamp</th>
                          <th style={{ padding: '10px 12px' }}>Feature / Endpoint</th>
                          <th style={{ padding: '10px 12px' }}>Model</th>
                          <th style={{ padding: '10px 12px' }}>Prompt Tok</th>
                          <th style={{ padding: '10px 12px' }}>Compl Tok</th>
                          <th style={{ padding: '10px 12px' }}>Total Tok</th>
                          <th style={{ padding: '10px 12px' }}>Latency</th>
                          <th style={{ padding: '10px 12px', textAlign: 'right' }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {aiUsage.recent_calls.slice((aiLogPage - 1) * 10, aiLogPage * 10).map((log) => (
                          <tr key={log.id} style={{ borderBottom: '1px solid var(--border)' }}>
                            <td style={{ padding: '10px 12px', whiteSpace: 'nowrap', color: 'var(--text-muted)', fontSize: 12 }}>
                              {log.created_at ? new Date(log.created_at).toLocaleString() : 'Just now'}
                            </td>
                            <td style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                              {log.feature}
                            </td>
                            <td style={{ padding: '10px 12px', color: 'var(--text-secondary)', fontSize: 12 }}>
                              {log.model}
                            </td>
                            <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>
                              {log.prompt_tokens}
                            </td>
                            <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>
                              {log.completion_tokens}
                            </td>
                            <td style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--accent)' }}>
                              {log.total_tokens}
                            </td>
                            <td style={{ padding: '10px 12px', color: 'var(--text-secondary)', fontSize: 12 }}>
                              {log.latency_ms} ms
                            </td>
                            <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                              {log.is_success ? (
                                <span style={{ padding: '2px 8px', borderRadius: 99, background: '#dcfce7', color: '#15803d', fontSize: 11, fontWeight: 700 }}>
                                  200 OK
                                </span>
                              ) : (
                                <span style={{ padding: '2px 8px', borderRadius: 99, background: '#fee2e2', color: '#b91c1c', fontSize: 11, fontWeight: 700 }}>
                                  {log.status_code || 500} Error
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <TablePagination
                    currentPage={aiLogPage}
                    totalItems={aiUsage.recent_calls.length}
                    pageSize={10}
                    onPageChange={setAiLogPage}
                  />
                </>
              ) : (
                <EmptyState
                  icon={Zap}
                  title="No AI Request Logs"
                  description="No AI API calls have been logged across platform features yet."
                />
              )}
            </div>
          </div>
        )}

        {/* ─── TAB 10: ANNOUNCEMENTS ────────────────────────────────────── */}
        {activeTab === 'announcements' && (
          <div className="card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>System Broadcast Announcements</h2>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>Publish live platform banners visible to all active users</p>
              </div>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => setAnnModal({ title: '', message: '', type: 'info', is_active: true })}
                style={{ gap: 6 }}
              >
                <Plus size={15} /> Create Announcement
              </button>
            </div>

            {announcements.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', background: '#f8fafc', borderRadius: 8, border: '1px dashed var(--border)' }}>
                <Bell size={24} style={{ marginBottom: 8, opacity: 0.5 }} />
                <p style={{ margin: 0, fontWeight: 500 }}>No system announcements found</p>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setAnnModal({ title: '', message: '', type: 'info', is_active: true })}
                  style={{ marginTop: 12, gap: 6 }}
                >
                  <Plus size={14} /> Create First Announcement
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {announcements.map((ann) => (
                  <div key={ann.id} className="card" style={{ padding: 18, border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span className={`badge ${ann.type === 'alert' ? 'badge-red' : ann.type === 'warning' ? 'badge-yellow' : ann.type === 'success' ? 'badge-green' : 'badge-indigo'}`} style={{ textTransform: 'uppercase', fontSize: 10, fontWeight: 700 }}>
                          {ann.type}
                        </span>
                        <h4 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>{ann.title}</h4>
                        {ann.is_active ? (
                          <span className="badge badge-green" style={{ fontSize: 11 }}>🟢 Live Broadcast</span>
                        ) : (
                          <span className="badge badge-gray" style={{ fontSize: 11 }}>⚪ Disabled</span>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => setAnnModal(ann)}
                          title="Edit Announcement"
                          style={{ gap: 4 }}
                        >
                          <FileText size={14} /> Edit
                        </button>
                        <button
                          className={`btn btn-sm ${ann.is_active ? 'btn-ghost' : 'btn-primary'}`}
                          onClick={async () => {
                            await adminAPI.updateAnnouncement(ann.id, { title: ann.title, message: ann.message, type: ann.type, is_active: !ann.is_active });
                            toast.success(`Announcement ${!ann.is_active ? 'activated & live' : 'disabled'}`);
                            loadAnnouncements();
                          }}
                        >
                          {ann.is_active ? 'Disable' : 'Activate'}
                        </button>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => handleDeleteAnnouncement(ann.id, ann.title)}
                          title="Delete Announcement"
                        >
                          <Trash2 size={14} color="var(--red-500)" />
                        </button>
                      </div>
                    </div>
                    <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                      {ann.message}
                    </p>
                    <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-muted)' }}>
                      Created at: {new Date(ann.created_at).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        </main>
      </div>



      {/* Online Job Web Scraper & AI Parser Modal */}


      {/* Online Course Web Scraper & AI Parser Modal */}
      {courseScrapeModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
        }}>
          <div className="card" style={{ maxWidth: 520, width: '100%', padding: 26 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ padding: 8, borderRadius: 8, background: '#f5f3ff', color: '#7c3aed' }}>
                <Globe size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>Scrape Online Courses & Certifications</h3>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0, marginTop: 2 }}>
                  Extract course listings from e-learning platforms (Coursera, Udemy, edX) & AI-parse skills
                </p>
              </div>
            </div>

            <form onSubmit={handleScrapeCourses} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Target Skill or Course Topic *</label>
                <input
                  className="input"
                  placeholder="e.g. React, Machine Learning, Docker, System Design"
                  value={courseScrapeModal.keyword || ''}
                  onChange={(e) => setCourseScrapeModal({ ...courseScrapeModal, keyword: e.target.value })}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Number of Courses to Scrape</label>
                <select
                  className="input"
                  value={courseScrapeModal.count || 5}
                  onChange={(e) => setCourseScrapeModal({ ...courseScrapeModal, count: parseInt(e.target.value, 10) })}
                >
                  <option value={3}>Scrape 3 Courses</option>
                  <option value={5}>Scrape 5 Courses (Recommended)</option>
                  <option value={10}>Scrape 10 Courses</option>
                </select>
              </div>

              <div style={{ padding: 12, borderRadius: 8, background: '#f8fafc', border: '1px solid var(--border)', fontSize: 12, color: 'var(--text-muted)' }}>
                💡 <strong>Note:</strong> Manual course creation is disabled. All course certifications are automatically scraped from e-learning platforms and AI-parsed into the database.
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 6 }}>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setCourseScrapeModal(null)} disabled={scrapingCourses}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-sm" disabled={scrapingCourses} style={{ gap: 6 }}>
                  {scrapingCourses ? <RefreshCw size={14} className="animate-spin" /> : <Globe size={14} />}
                  {scrapingCourses ? 'Scraping E-Learning Platforms...' : 'Scrape & AI Parse Online Courses'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Existing Edit Job Modal */}
      {jobModal && jobModal.isEdit && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
        }}>
          <div className="card" style={{ maxWidth: 540, width: '100%', padding: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>Edit Scraped Job Posting</h3>
            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                await adminAPI.updateJob(jobModal.data.id, jobModal.data);
                toast.success('Job updated');
                setJobModal(null);
                loadJobs();
              } catch {
                toast.error('Failed to save job');
              }
            }} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input className="input" placeholder="Job Title *" value={jobModal.data.title || ''} onChange={(e) => setJobModal({ ...jobModal, data: { ...jobModal.data, title: e.target.value } })} required />
              <input className="input" placeholder="Company *" value={jobModal.data.company || ''} onChange={(e) => setJobModal({ ...jobModal, data: { ...jobModal.data, company: e.target.value } })} required />
              <input className="input" placeholder="Location" value={jobModal.data.location || ''} onChange={(e) => setJobModal({ ...jobModal, data: { ...jobModal.data, location: e.target.value } })} />
              <textarea className="input" rows={3} placeholder="Job Description" value={jobModal.data.description || ''} onChange={(e) => setJobModal({ ...jobModal, data: { ...jobModal.data, description: e.target.value } })} />
              <input className="input" placeholder="Required Skills (comma separated)" value={Array.isArray(jobModal.data.required_skills) ? jobModal.data.required_skills.join(', ') : jobModal.data.required_skills || ''} onChange={(e) => setJobModal({ ...jobModal, data: { ...jobModal.data, required_skills: e.target.value.split(',').map(s => s.trim()).filter(Boolean) } })} />
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setJobModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm">Update Job</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Existing Edit Course Modal */}
      {courseModal && courseModal.isEdit && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
        }}>
          <div className="card" style={{ maxWidth: 540, width: '100%', padding: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>Edit Scraped Course</h3>
            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                await adminAPI.updateCourse(courseModal.data.id, courseModal.data);
                toast.success('Course updated');
                setCourseModal(null);
                loadCourses();
              } catch {
                toast.error('Failed to save course');
              }
            }} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input className="input" placeholder="Course Title *" value={courseModal.data.title || ''} onChange={(e) => setCourseModal({ ...courseModal, data: { ...courseModal.data, title: e.target.value } })} required />
              <input className="input" placeholder="Provider (Coursera, Udemy, etc.) *" value={courseModal.data.provider || ''} onChange={(e) => setCourseModal({ ...courseModal, data: { ...courseModal.data, provider: e.target.value } })} required />
              <textarea className="input" rows={3} placeholder="Course Description" value={courseModal.data.description || ''} onChange={(e) => setCourseModal({ ...courseModal, data: { ...courseModal.data, description: e.target.value } })} />
              <input className="input" placeholder="Skills Covered (comma separated)" value={Array.isArray(courseModal.data.skills_covered) ? courseModal.data.skills_covered.join(', ') : courseModal.data.skills_covered || ''} onChange={(e) => setCourseModal({ ...courseModal, data: { ...courseModal.data, skills_covered: e.target.value.split(',').map(s => s.trim()).filter(Boolean) } })} />
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setCourseModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm">Update Course</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* System Broadcast Announcement Modal */}
      {annModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
        }}>
          <div className="card" style={{ maxWidth: 520, width: '100%', padding: 26, background: '#fff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ padding: 10, borderRadius: 8, background: '#fef3c7', color: '#d97706' }}>
                <Bell size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>
                  {annModal.id ? 'Edit Platform Announcement' : 'Broadcast System Announcement'}
                </h3>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0, marginTop: 2 }}>
                  Publish platform banner notifications visible to all platform users
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveAnnouncement} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
                  Announcement Title *
                </label>
                <input
                  className="input"
                  placeholder="e.g. System Maintenance Notice or New Feature Released!"
                  value={annModal.title || ''}
                  onChange={(e) => setAnnModal({ ...annModal, title: e.target.value })}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
                  Announcement Message Body *
                </label>
                <textarea
                  className="input"
                  rows={3}
                  placeholder="Enter detailed message body for users..."
                  value={annModal.message || ''}
                  onChange={(e) => setAnnModal({ ...annModal, message: e.target.value })}
                  required
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
                    Banner Alert Type
                  </label>
                  <select
                    className="input"
                    value={annModal.type || 'info'}
                    onChange={(e) => setAnnModal({ ...annModal, type: e.target.value })}
                  >
                    <option value="info">ℹ️ Information (Blue Banner)</option>
                    <option value="warning">⚠️ Warning (Yellow Banner)</option>
                    <option value="success">✅ Success (Green Banner)</option>
                    <option value="alert">🚨 Urgent Alert (Red Banner)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
                    Broadcast Status
                  </label>
                  <select
                    className="input"
                    value={annModal.is_active ? 'true' : 'false'}
                    onChange={(e) => setAnnModal({ ...annModal, is_active: e.target.value === 'true' })}
                  >
                    <option value="true">🟢 Active (Broadcast Live)</option>
                    <option value="false">⚪ Disabled (Hidden from Users)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                {annModal.id ? (
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => handleDeleteAnnouncement(annModal.id, annModal.title)}
                    style={{ color: 'var(--red-500)', gap: 4 }}
                  >
                    <Trash2 size={14} /> Delete Announcement
                  </button>
                ) : <div />}
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => setAnnModal(null)}
                    disabled={savingAnn}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm"
                    disabled={savingAnn}
                    style={{ gap: 6 }}
                  >
                    {savingAnn ? <RefreshCw size={14} className="animate-spin" /> : <Bell size={14} />}
                    {savingAnn ? 'Saving Announcement...' : (annModal.id ? 'Update Announcement' : 'Publish Announcement Banner')}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
