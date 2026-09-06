import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { getRecruiterAnalytics } from "../../lib/api";
import StatCard from "../ui/StatCard";
import SkeletonBlock from "../ui/SkeletonBlock";

const FUNNEL_STAGES = [
  { key: "pending", label: "Pending", color: "#f59e0b" },
  { key: "reviewed", label: "Reviewed", color: "#3b82f6" },
  { key: "shortlisted", label: "Shortlisted", color: "#22c55e" },
  { key: "rejected", label: "Rejected", color: "#ef4444" },
];

function Bar({ label, count, max, color }) {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0;
  return (
    <div className="mb-3">
      <div className="mb-1 flex items-center justify-between text-[13px]">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium text-foreground">{count}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-secondary">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

export default function Analytics() {
  const { token } = useOutletContext();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const r = await getRecruiterAnalytics(token);
      if (r.success) setData(r.data);
      setLoading(false);
    })();
  }, [token]);

  if (loading) return <SkeletonBlock height={240} />;
  if (!data) return <p className="text-[13px] text-muted-foreground">Analytics unavailable right now.</p>;

  const funnelMax = Math.max(1, ...FUNNEL_STAGES.map((s) => data.funnel[s.key] || 0));
  const scoreMax = Math.max(1, ...data.scoreDistribution.map((b) => b.count));

  return (
    <div>
      <div className="fade-up mb-6 grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3">
        <StatCard label="Total Jobs" value={data.totalJobs} />
        <StatCard label="Open Roles" value={data.openJobs} />
        <StatCard label="Applications" value={data.totalApplications} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="fade-up rounded-[14px] border border-border bg-card p-6">
          <div className="mb-4 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Applicant funnel</div>
          {FUNNEL_STAGES.map((s) => (
            <Bar key={s.key} label={s.label} count={data.funnel[s.key] || 0} max={funnelMax} color={s.color} />
          ))}
        </div>

        <div className="fade-up-2 rounded-[14px] border border-border bg-card p-6">
          <div className="mb-4 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Match score distribution</div>
          {data.scoreDistribution.map((b) => (
            <Bar key={b.label} label={b.label} count={b.count} max={scoreMax} color="var(--primary)" />
          ))}
        </div>
      </div>
    </div>
  );
}
