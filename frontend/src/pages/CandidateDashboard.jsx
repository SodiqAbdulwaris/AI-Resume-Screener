import { useEffect, useCallback, useState } from "react";
import { useLocation, useNavigate, Outlet } from "react-router-dom";
import { COLORS } from "../constants/colors";
import { s } from "../styles/designSystem";
import { useAuth } from "../context/AuthContext";
import { acceptParsedName, cancelApplication, getJobs, getMyApplications, getCandidateProfile, getResume } from "../lib/api";
import Nav from "../components/layout/Nav";
import PageHeader from "../components/layout/PageHeader";
import Tabs from "../components/ui/Tabs";
import SkeletonBlock from "../components/ui/SkeletonBlock";

export default function CandidateDashboard({ onContactClick }) {
  const { token, user, updateUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [profile, setProfile] = useState(null);
  const [resumeInfo, setResumeInfo] = useState(null);
  const [loadingData, setLoadingData] = useState(true);
  const [nextCursor, setNextCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingJobs, setLoadingJobs] = useState(false);

  // Determine active tab from URL path
  let activeTab = "jobs";
  if (location.pathname === "/applications") activeTab = "applications";
  else if (location.pathname === "/profile") activeTab = "profile";
  else if (location.pathname === "/resume") activeTab = "resume";
  else if (location.pathname === "/contact") activeTab = "contact";

  const handleTabChange = (key) => {
    if (key === "jobs") navigate("/jobs");
    else navigate(`/${key}`);
  };

  const loadJobsData = useCallback(async (cursor = null) => {
    if (cursor) setLoadingJobs(true);
    const r = await getJobs(token, cursor);
    if (r.success) {
      setJobs(prev => cursor ? [...prev, ...r.data.items] : r.data.items);
      setNextCursor(r.data.nextCursor);
      setHasMore(r.data.hasMore);
    }
    setLoadingJobs(false);
  }, [token]);

  const loadAll = useCallback(async () => {
    setLoadingData(true);
    const [ar, pr] = await Promise.all([
      getMyApplications(token),
      getCandidateProfile(token),
    ]);
    setApplications(ar.success ? ar.data : []);
    setProfile(pr.success ? pr.data : null);

    if (pr.success && pr.data?.resumeId) {
      const rr = await getResume(pr.data.resumeId, token);
      if (rr.success) setResumeInfo(rr.data);
    }
    await loadJobsData();
    setLoadingData(false);
  }, [token, loadJobsData]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  async function handleAcceptParsedName() {
    const result = await acceptParsedName(token);
    if (result.success) {
      setProfile(result.data.profile);
      updateUser(result.data.user);
    }
    return result;
  }

  async function handleCancelApplication(jobId) {
    const result = await cancelApplication(jobId, token);
    if (result.success) {
      await loadAll();
    }
    return result;
  }

  const appliedCount = applications.length;
  const openJobs = jobs.length;

  const tabDefs = [
    { key: "jobs", label: "Browse Jobs", count: openJobs },
    { key: "applications", label: "My Applications", count: appliedCount },
    { key: "profile", label: "Profile" },
    { key: "resume", label: "Resume" },
    { key: "contact", label: "Contact" },
  ];

  return (
    <div>
      <Nav onContactClick={onContactClick} />
      <div style={{ padding: "2rem 2rem 4rem" }}>
        <PageHeader
          title={`Good to see you, ${user.fullName.split(" ")[0]}.`}
          subtitle="Browse open roles and track your applications."
        />
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
              applications,
              profile,
              resumeInfo,
              token,
              loadAll,
              loadingJobs,
              hasMore,
              nextCursor,
              loadJobsData,
              handleCancelApplication,
              handleAcceptParsedName,
              user,
            }}
          />
        )}
      </div>
    </div>
  );
}
