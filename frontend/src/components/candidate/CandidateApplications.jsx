import { useState } from "react";
import { ListBulletIcon } from "@radix-ui/react-icons";
import { COLORS } from "../../constants/colors";
import { s } from "../../styles/designSystem";
import { fmtDate } from "../../lib/utils";
import Alert from "../ui/Alert";
import Badge from "../ui/Badge";
import Btn from "../ui/Btn";
import Spinner from "../ui/Spinner";

function statusBadge(status) {
  const map = { pending: "yellow", reviewed: "blue", shortlisted: "green", rejected: "red" };
  return <Badge variant={map[status] || "gray"}>{status}</Badge>;
}

import { useOutletContext } from "react-router-dom";

export default function CandidateApplications() {
  const { applications, handleCancelApplication: onCancel } = useOutletContext();
  const [cancellingId, setCancellingId] = useState(null);
  const [error, setError] = useState(null);

  async function cancel(application) {
    if (!onCancel) return;
    setCancellingId(application._id);
    setError(null);
    const jobId = application.job?._id || application.job;
    const result = await onCancel(jobId);
    setCancellingId(null);

    if (!result.success) {
      setError(result.message);
    }
  }

  if (!applications.length) {
    return (
      <div style={{ textAlign: "center", padding: "4rem", color: COLORS.text2 }}>
        <ListBulletIcon width={40} height={40} style={{ opacity: 0.3, marginBottom: "1rem" }} />
        <p>No applications yet. Browse open jobs and apply!</p>
      </div>
    );
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      <Alert message={error} variant="error" />
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
                <rect x="2" y="1" width="12" height="14" rx="2" stroke="var(--primary)" strokeWidth="1.25"/>
                <path d="M5 5h6M5 8h6M5 11h4" stroke="var(--primary)" strokeWidth="1.25" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <div style={{ fontWeight: 500, fontSize: 14 }}>{a.job?.title || "Job"}</div>
              <div style={{ fontSize: 12, color: COLORS.text3, marginTop: 2 }}>Applied {fmtDate(a.appliedAt)}</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            {statusBadge(a.status)}
            <Btn variant="secondary" size="sm" onClick={() => cancel(a)} disabled={cancellingId === a._id}>
              {cancellingId === a._id ? <Spinner size={14} /> : "Cancel"}
            </Btn>
          </div>
        </div>
      ))}
    </div>
  );
}
