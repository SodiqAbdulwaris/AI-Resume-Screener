import { COLORS } from "../../constants/colors";
import { s } from "../../styles/designSystem";
import { fmtDate } from "../../lib/utils";
import Badge from "../ui/Badge";

function statusBadge(status) {
  const map = { pending: "yellow", reviewed: "blue", shortlisted: "green", rejected: "red" };
  return <Badge variant={map[status] || "gray"}>{status}</Badge>;
}

export default function CandidateApplications({ applications }) {
  if (!applications.length) {
    return (
      <div style={{ textAlign: "center", padding: "4rem", color: COLORS.text2 }}>
        <div style={{ fontSize: "2.5rem", opacity: 0.3, marginBottom: "1rem" }}>📋</div>
        <p>No applications yet. Browse open jobs and apply!</p>
      </div>
    );
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      {applications.map((a, i) => (
        <div
          key={a._id}
          className="fade-up"
          style={{
            ...s.card,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "1rem",
            animationDelay: `${i * 0.04}s`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div style={{ width: 38, height: 38, borderRadius: 9, background: COLORS.accentGlow, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="2" y="1" width="12" height="14" rx="2" stroke="#a5b4fc" strokeWidth="1.25"/>
                <path d="M5 5h6M5 8h6M5 11h4" stroke="#a5b4fc" strokeWidth="1.25" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <div style={{ fontWeight: 500, fontSize: 14 }}>{a.job?.title || "Job"}</div>
              <div style={{ fontSize: 12, color: COLORS.text3, marginTop: 2 }}>Applied {fmtDate(a.appliedAt)}</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            {statusBadge(a.status)}
          </div>
        </div>
      ))}
    </div>
  );
}
