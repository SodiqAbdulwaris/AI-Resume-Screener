import { useState, useEffect, useCallback } from "react";
import { COLORS } from "../constants/colors";
import { s } from "../styles/designSystem";
import { useAuth } from "../context/AuthContext";
import { getJobs } from "../lib/api";
import Nav from "../components/layout/Nav";
import PageHeader from "../components/layout/PageHeader";
import Tabs from "../components/ui/Tabs";
import SkeletonBlock from "../components/ui/SkeletonBlock";
import RecruiterJobs from "../components/recruiter/RecruiterJobs";
import PostJobView from "../components/recruiter/PostJobView";
import MatchView from "../components/recruiter/MatchView";

export default function RecruiterDashboard() {
  const { token, user } = useAuth();
  const [tab, setTab] = useState("jobs");
  const [jobs, setJobs] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [matchJob, setMatchJob] = useState(null);
  const [autoRunMatch, setAutoRunMatch] = useState(false);

  const loadJobs = useCallback(async () => {
    setLoadingData(true);
    const r = await getJobs(token);
    if (r.success) setJobs(r.data);
    setLoadingData(false);
  }, [token]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  const handleViewMatch = (job, autoRun) => {
    setMatchJob(job);
    setAutoRunMatch(autoRun);
  };

  const tabDefs = [
    { key: "jobs", label: "My Jobs", count: jobs.length },
    { key: "post", label: "Post a Job" },
  ];

  if (matchJob) {
    return (
      <div>
        <Nav />
        <div style={{ padding: "2rem 2rem 4rem" }}>
          <MatchView job={matchJob} token={token} onBack={() => setMatchJob(null)} autoRun={autoRunMatch} />
        </div>
      </div>
    );
  }

  return (
    <div>
      <Nav />
      <div style={{ padding: "2rem 2rem 4rem" }}>
        <PageHeader title="Recruiter Dashboard" subtitle="Post roles, screen applicants, and run AI-powered matching." />
        <Tabs tabs={tabDefs} active={tab} onChange={setTab} />
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
        ) : tab === "jobs" ? (
          <RecruiterJobs jobs={jobs} onViewMatch={handleViewMatch} onPost={() => setTab("post")} />
        ) : (
          <PostJobView token={token} onPosted={() => { loadJobs(); setTab("jobs"); }} />
        )}
      </div>
    </div>
  );
}
