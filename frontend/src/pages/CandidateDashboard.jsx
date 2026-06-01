import { useState, useEffect, useCallback } from "react";
import { COLORS } from "../constants/colors";
import { s } from "../styles/designSystem";
import { useAuth } from "../context/AuthContext";
import { acceptParsedName, getJobs, getMyApplications, getCandidateProfile, getResume } from "../lib/api";
import Nav from "../components/layout/Nav";
import PageHeader from "../components/layout/PageHeader";
import Tabs from "../components/ui/Tabs";
import SkeletonBlock from "../components/ui/SkeletonBlock";
import CandidateBrowse from "../components/candidate/CandidateBrowse";
import CandidateApplications from "../components/candidate/CandidateApplications";
import CandidateProfile from "../components/candidate/CandidateProfile";
import ResumeUpload from "../components/candidate/ResumeUpload";

export default function CandidateDashboard() {
  const { token, user, updateUser } = useAuth();
  const [tab, setTab] = useState("jobs");
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [profile, setProfile] = useState(null);
  const [resumeInfo, setResumeInfo] = useState(null);
  const [loadingData, setLoadingData] = useState(true);

  const loadAll = useCallback(async () => {
    setLoadingData(true);
    const [jr, ar, pr] = await Promise.all([
      getJobs(token),
      getMyApplications(token),
      getCandidateProfile(token),
    ]);
    setJobs(jr.success ? jr.data : []);
    setApplications(ar.success ? ar.data : []);
    setProfile(pr.success ? pr.data : null);

    if (pr.success && pr.data?.resumeId) {
      const rr = await getResume(pr.data.resumeId, token);
      if (rr.success) setResumeInfo(rr.data);
    }
    setLoadingData(false);
  }, [token]);

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

  const appliedCount = applications.length;
  const openJobs = jobs.length;

  const tabDefs = [
    { key: "jobs", label: "Browse Jobs", count: openJobs },
    { key: "applications", label: "My Applications", count: appliedCount },
    { key: "profile", label: "Profile" },
    { key: "resume", label: "Resume" },
  ];

  return (
    <div>
      <Nav />
      <div style={{ padding: "2rem 2rem 4rem" }}>
        <PageHeader
          title={`Good to see you, ${user.fullName.split(" ")[0]}.`}
          subtitle="Browse open roles and track your applications."
        />
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
          <CandidateBrowse jobs={jobs} applications={applications} profile={profile} token={token} onApplied={loadAll} />
        ) : tab === "applications" ? (
          <CandidateApplications applications={applications} />
        ) : tab === "profile" ? (
          <CandidateProfile profile={profile} onAcceptParsedName={handleAcceptParsedName} />
        ) : (
          <ResumeUpload token={token} onUploaded={loadAll} resumeInfo={resumeInfo} />
        )}
      </div>
    </div>
  );
}
