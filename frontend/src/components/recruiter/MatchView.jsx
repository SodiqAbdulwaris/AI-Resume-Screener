import { useState, useEffect, useCallback } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { COLORS } from "../../constants/colors";
import { s } from "../../styles/designSystem";
import { downloadMatchResultsCsv, getMatchResults, getJob, triggerMatch, toggleShortlist } from "../../lib/api";
import Alert from "../ui/Alert";
import Spinner from "../ui/Spinner";
import Btn from "../ui/Btn";
import Badge from "../ui/Badge";
import SkeletonBlock from "../ui/SkeletonBlock";
import MatchResultCard from "./MatchResultCard";
import Nav from "../layout/Nav";

export default function MatchView({ onContactClick }) {
  const { jobId } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const { token } = useAuth();
  const autoRun = state?.autoRun ?? false;

  const [job, setJob] = useState(null);
  const [jobLoading, setJobLoading] = useState(true);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState(null);
  const [nextCursor, setNextCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastMatchedAt, setLastMatchedAt] = useState(null);

  // Load the job record first so we can display the title
  useEffect(() => {
    async function fetchJob() {
      setJobLoading(true);
      const r = await getJob(jobId, token);
      if (r.success) setJob(r.data);
      setJobLoading(false);
    }
    fetchJob();
  }, [jobId, token]);

  const loadMatches = useCallback(async (cursor = null) => {
    if (cursor) setLoadingMore(true);
    else setFetching(true);
    setError(null);
    const r = await getMatchResults(jobId, token, cursor);
    if (r.success) {
      setResults(prev => cursor ? [...prev, ...r.data.items] : r.data.items);
      setNextCursor(r.data.nextCursor);
      setHasMore(r.data.hasMore);
      setLastMatchedAt(r.data.lastMatchedAt);
    } else {
      setError(r.message);
    }
    setLoadingMore(false);
    setFetching(false);
  }, [jobId, token]);

  useEffect(() => {
    async function loadAndRun() {
      await loadMatches();
      if (autoRun) {
        setLoading(true); setError(null);
        const matchRes = await triggerMatch(jobId, token);
        setLoading(false);
        if (matchRes.success) await loadMatches();
        else setError(matchRes.message);
      }
    }
    loadAndRun();
  }, [jobId, token, autoRun]);

  const runMatch = async () => {
    setLoading(true); setError(null);
    const r = await triggerMatch(jobId, token);
    setLoading(false);
    if (r.success) await loadMatches();
    else setError(r.message);
  };

  const exportCsv = async () => {
    setExporting(true); setError(null);
    const result = await downloadMatchResultsCsv(jobId, token);
    setExporting(false);
    if (!result.success) { setError(result.message); return; }
    const url = URL.createObjectURL(result.data.blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = result.data.filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const handleToggleShortlist = async (matchId, currentlyShortlisted) => {
    const nextVal = !currentlyShortlisted;
    setError(null);
    const r = await toggleShortlist(jobId, matchId, nextVal, token);
    if (r.success) setResults(prev => prev.map(m => m._id === matchId ? { ...m, shortlisted: nextVal } : m));
    else setError(r.message);
  };

  const title = jobLoading ? "Loading…" : (job?.title ?? "Job");

  return (
    <div>
      <Nav onContactClick={onContactClick} />
      <div style={{ padding: "2rem 2rem 4rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }} className="fade-up">
          <Btn variant="secondary" size="sm" onClick={() => navigate("/recruiter/jobs")}>← Back</Btn>
          <div>
            <h3 style={{ fontFamily: "'Instrument Serif', serif", fontSize: "1.2rem", fontWeight: 400 }}>{title}</h3>
            <div style={{ fontSize: 12, color: COLORS.text3 }}>AI Match Results</div>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "0.75rem" }}>
            {results.length > 0 && <Badge variant="blue">{results.length} candidates</Badge>}
            {results.length > 0 && (
              <Btn variant="secondary" size="sm" onClick={exportCsv} disabled={exporting}>
                {exporting ? <Spinner size={14} /> : "Export CSV"}
              </Btn>
            )}
            <Btn variant="primary" size="sm" onClick={runMatch} disabled={loading}>
              {loading ? <><Spinner size={14} />Running…</> : "🤖 Run AI Match"}
            </Btn>
          </div>
        </div>
        <Alert message={error} variant="error" />
        {fetching ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {[1, 2].map(i => (
              <div key={i} style={{ ...s.card }}>
                <SkeletonBlock height={16} width="40%" />
                <div style={{ marginTop: 12 }}><SkeletonBlock height={5} /></div>
              </div>
            ))}
          </div>
        ) : results.length === 0 ? (
          <div style={{ textAlign: "center", padding: "4rem", color: COLORS.text2 }}>
            <div style={{ fontSize: "2.5rem", opacity: 0.3, marginBottom: "1rem" }}>📊</div>
            <p style={{ marginBottom: "1.25rem" }}>
              {lastMatchedAt
                ? "AI matching ran, but no candidates matched — check that anyone has applied to this job yet."
                : "No match results yet. Run AI matching to rank candidates."}
            </p>
            <Btn variant="primary" onClick={runMatch} disabled={loading}>
              {loading ? <><Spinner size={16} />Matching…</> : "🤖 Run AI Matching"}
            </Btn>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {results.map((m, i) => (
              <MatchResultCard key={m._id || i} match={m} rank={i + 1} onToggleShortlist={handleToggleShortlist} />
            ))}
          </div>
        )}
        {hasMore && (
          <div style={{ display: "flex", justifyContent: "center", marginTop: "2rem" }}>
            <Btn variant="secondary" onClick={() => loadMatches(nextCursor)} disabled={loadingMore}>
              {loadingMore ? "Loading..." : "Load More Candidates"}
            </Btn>
          </div>
        )}
      </div>
    </div>
  );
}
