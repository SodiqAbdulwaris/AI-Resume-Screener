import { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate, Outlet } from "react-router-dom";
import { COLORS } from "../constants/colors";
import { s } from "../styles/designSystem";
import { useAuth } from "../context/AuthContext";
import { getJobs, closeJob } from "../lib/api";
import Nav from "../components/layout/Nav";
import PageHeader from "../components/layout/PageHeader";
import Tabs from "../components/ui/Tabs";
import SkeletonBlock from "../components/ui/SkeletonBlock";

export default function RecruiterDashboard({ onContactClick }) {
  const { token, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [jobs, setJobs] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [nextCursor, setNextCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // Determine active tab from URL path
  let activeTab = "jobs";
  if (location.pathname === "/recruiter/post") activeTab = "post";
  else if (location.pathname === "/recruiter/contact") activeTab = "contact";

  const handleTabChange = (key) => {
    navigate(`/recruiter/${key}`);
  };

  const loadJobs = useCallback(async (cursor = null) => {
    if (cursor) setLoadingMore(true);
    else setLoadingData(true);
    const r = await getJobs(token, cursor);
    if (r.success) {
      setJobs(prev => cursor ? [...prev, ...r.data.items] : r.data.items);
      setNextCursor(r.data.nextCursor);
      setHasMore(r.data.hasMore);
    }
    setLoadingMore(false);
    setLoadingData(false);
  }, [token]);

  const handleToggleJobStatus = async (jobId, isOpen) => {
    const nextVal = !isOpen;
    const r = await closeJob(jobId, nextVal, token);
    if (r.success) {
      loadJobs();
    }
  };

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  const handleViewMatch = (job, autoRun) => {
    navigate(`/recruiter/jobs/${job._id}/matches`, { state: { autoRun } });
  };

  const handleJobPosted = () => {
    loadJobs();
    navigate("/recruiter/jobs");
  };

  const tabDefs = [
    { key: "jobs", label: "My Jobs", count: jobs.length },
    { key: "post", label: "Post a Job" },
    { key: "contact", label: "Contact" },
  ];

  return (
    <div>
      <Nav onContactClick={onContactClick} />
      <div style={{ padding: "2rem 2rem 4rem" }}>
        <PageHeader title="Recruiter Dashboard" subtitle="Post roles, screen applicants, and run AI-powered matching." />
        <Tabs tabs={tabDefs} active={activeTab} onChange={handleTabChange} />
        {loadingData ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: "1rem" }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ ...s.card, display: "flex", flexDirection: "column", gap: 12 }}>
                <SkeletonBlock height={18} width="60%" />
                <SkeletonBlock height={12} />
                <SkeletonBlock height={12} width="80%" />
              </div>
            ))}
          </div>
        ) : (
          <Outlet
            context={{
              jobs,
              onViewMatch: handleViewMatch,
              onPost: () => navigate("/recruiter/post"),
              onPosted: handleJobPosted,
              onToggleJobStatus: handleToggleJobStatus,
              hasMore,
              loadingMore,
              onLoadMore: () => loadJobs(nextCursor),
              token,
              loadJobs,
              user,
            }}
          />
        )}
      </div>
    </div>
  );
}
