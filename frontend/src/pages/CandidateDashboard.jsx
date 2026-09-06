import { useEffect, useCallback, useState } from "react";
import { useLocation, useNavigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { acceptParsedName, cancelApplication, getJobs, getMyApplications, getCandidateProfile } from "../lib/api";
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
      <div className="px-4 pb-16 pt-6 sm:px-8">
        <PageHeader
          title={`Good to see you, ${user.fullName.split(" ")[0]}.`}
          subtitle="Browse open roles and track your applications."
        />
        <div className="overflow-x-auto">
          <Tabs tabs={tabDefs} active={activeTab} onChange={handleTabChange} />
        </div>
        {loadingData ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex flex-col gap-3 rounded-[14px] border border-border bg-card p-6">
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
