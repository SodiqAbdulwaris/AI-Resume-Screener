import { useState } from "react";
import { ListBulletIcon } from "@radix-ui/react-icons";
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
      <div className="py-16 text-center text-muted-foreground">
        <ListBulletIcon width={40} height={40} className="mx-auto mb-4 opacity-30" />
        <p>No applications yet. Browse open jobs and apply!</p>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-3">
      <Alert message={error} variant="error" />
      {applications.map((a, i) => (
        <div
          key={a._id}
          className="fade-up flex items-center justify-between gap-4 rounded-[14px] border border-border bg-card p-6"
          style={{ animationDelay: `${i * 0.04}s` }}
        >
          <div className="flex items-center gap-4">
            <div className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[9px] bg-accent">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="2" y="1" width="12" height="14" rx="2" stroke="var(--primary)" strokeWidth="1.25" />
                <path d="M5 5h6M5 8h6M5 11h4" stroke="var(--primary)" strokeWidth="1.25" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <div className="text-sm font-medium">{a.job?.title || "Job"}</div>
              <div className="mt-0.5 text-xs text-muted-foreground">Applied {fmtDate(a.appliedAt)}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
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
