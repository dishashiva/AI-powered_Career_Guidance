import React, { useState, useEffect, useCallback } from 'react';
import ResumeBuilder from '../components/ResumeBuilder';
import { resumesAPI } from '../api/client';
import { getActiveResumeId, setActiveResumeId } from '../utils/activeResume';

export default function ResumeBuilderPage() {
  const [resumesList, setResumesList] = useState([]);
  const [activeResume, setActiveResume] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchFullResume = useCallback(async (id) => {
    try {
      const res = await resumesAPI.get(id);
      setActiveResume(res.data);
    } catch (err) {
      console.error('Error loading resume details:', err);
    }
  }, []);

  useEffect(() => {
    resumesAPI.list()
      .then((res) => {
        setResumesList(res.data);
        if (res.data && res.data.length > 0) {
          const activeId = getActiveResumeId(res.data);
          const foundId = activeId || res.data[0].id;
          fetchFullResume(foundId);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [fetchFullResume]);

  const handleSelectResume = (id) => {
    setActiveResumeId(id);
    fetchFullResume(id);
  };

  return (
    <div className="page-wrapper">
      <div className="container page-content" style={{ paddingBottom: 40 }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 50 }}>
            <div className="spinner" style={{ width: 32, height: 32 }} />
          </div>
        ) : (
          <ResumeBuilder
            activeResume={activeResume}
            resumesList={resumesList}
            onSelectResume={handleSelectResume}
          />
        )}
      </div>
    </div>
  );
}
