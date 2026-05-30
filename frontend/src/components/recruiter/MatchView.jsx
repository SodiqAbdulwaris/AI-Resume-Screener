import { useState, useEffect } from "react";
import { COLORS } from "../../constants/colors";
import { s } from "../../styles/designSystem";
import { getMatchResults, triggerMatch } from "../../lib/api";
import Alert from "../ui/Alert";
import Spinner from "../ui/Spinner";
import Btn from "../ui/Btn";
import Badge from "../ui/Badge";
import SkeletonBlock from "../ui/SkeletonBlock";
import MatchResultCard from "./MatchResultCard";

export default function MatchView({ job, token, onBack, autoRun = false }) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState(null);

  const runMatch = async () => {
    setLoading(true); setError(null);
    const r = await triggerMatch(job._id, token);
    setLoading(false);
    if (r.success) setResults(r.data.results || []);
    else setError(r.message);
  };

  useEffect(() => {
    async function loadAndRun() {
      setFetching(true);
      const r = await getMatchResults(job._id, token);
      if (r.success) {
        setResults(r.data.matches || []);
      }
      setFetching(false);

      if (autoRun) {
        setLoading(true); setError(null);
        const matchRes = await triggerMatch(job._id, token);
        setLoading(false);
        if (matchRes.success) setResults(matchRes.data.results || []);
        else setError(matchRes.message);
      }
    }
    loadAndRun();
  }, [job._id, token, autoRun]);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }} className="fade-up">
        <Btn variant="secondary" size="sm" onClick={onBack}>← Back</Btn>
        <div>
          <h3 style={{ fontFamily: "'Instrument Serif', serif", fontSize: "1.2rem", fontWeight: 400 }}>{job.title}</h3>
          <div style={{ fontSize: 12, color: COLORS.text3 }}>AI Match Results</div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "0.75rem" }}>
          {results.length > 0 && <Badge variant="blue">{results.length} candidates</Badge>}
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
              <div style={{ marginTop: 12 }}>
                <SkeletonBlock height={5} />
              </div>
            </div>
          ))}
        </div>
      ) : results.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem", color: COLORS.text2 }}>
          <div style={{ fontSize: "2.5rem", opacity: 0.3, marginBottom: "1rem" }}>📊</div>
          <p style={{ marginBottom: "1.25rem" }}>No match results yet. Run AI matching to rank candidates.</p>
          <Btn variant="primary" onClick={runMatch} disabled={loading}>
            {loading ? <><Spinner size={16} />Matching…</> : "🤖 Run AI Matching"}
          </Btn>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {results.map((m, i) => (
            <MatchResultCard key={m._id || i} match={m} rank={i + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
