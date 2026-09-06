import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeftIcon, ListBulletIcon, ViewGridIcon } from "@radix-ui/react-icons";
import { useAuth } from "../../context/AuthContext";
import { getJob, getJobApplications, advanceApplicationStage, bulkAdvanceApplicationStage } from "../../lib/api";
import Alert from "../ui/Alert";
import Btn from "../ui/Btn";
import Badge from "../ui/Badge";
import Avatar from "../ui/Avatar";
import SkeletonBlock from "../ui/SkeletonBlock";
import Nav from "../layout/Nav";

const STAGES = [
  { key: "pending", label: "Pending" },
  { key: "reviewed", label: "Reviewed" },
  { key: "shortlisted", label: "Shortlisted" },
  { key: "rejected", label: "Rejected" },
];

const STAGE_BADGE = { pending: "yellow", reviewed: "blue", shortlisted: "green", rejected: "red" };

export default function Pipeline({ onContactClick }) {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();

  const [job, setJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [view, setView] = useState("board");
  const [selected, setSelected] = useState(new Set());
  const [bulkStatus, setBulkStatus] = useState("reviewed");
  const [busyId, setBusyId] = useState(null);
  const [bulkBusy, setBulkBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [jobRes, appsRes] = await Promise.all([getJob(jobId, token), getJobApplications(jobId, token)]);
    if (jobRes.success) setJob(jobRes.data);
    if (appsRes.success) setApplications(appsRes.data);
    else setError(appsRes.message);
    setLoading(false);
  }, [jobId, token]);

  useEffect(() => { load(); }, [load]);

  async function handleAdvance(applicationId, status) {
    setBusyId(applicationId);
    const r = await advanceApplicationStage(jobId, applicationId, status, token);
    setBusyId(null);
    if (r.success) {
      setApplications((prev) => prev.map((a) => (a._id === applicationId ? { ...a, status } : a)));
    } else {
      setError(r.message);
    }
  }

  function toggleSelected(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleBulkAdvance() {
    if (selected.size === 0) return;
    setBulkBusy(true);
    const ids = Array.from(selected);
    const r = await bulkAdvanceApplicationStage(jobId, ids, bulkStatus, token);
    setBulkBusy(false);
    if (r.success) {
      setApplications((prev) => prev.map((a) => (ids.includes(a._id) ? { ...a, status: bulkStatus } : a)));
      setSelected(new Set());
    } else {
      setError(r.message);
    }
  }

  const candidateName = (a) => a.candidateProfile?.fullName || "Candidate";

  return (
    <div>
      <Nav onContactClick={onContactClick} />
      <div className="px-4 pb-16 pt-6 sm:px-8">
        <div className="fade-up mb-6 flex flex-wrap items-center gap-4">
          <Btn variant="secondary" size="sm" onClick={() => navigate("/recruiter/jobs")}><ArrowLeftIcon /> Back</Btn>
          <div>
            <h3 className="text-lg font-bold text-foreground">{job?.title || "Pipeline"}</h3>
            <div className="text-xs text-muted-foreground">{applications.length} applicant(s)</div>
          </div>
          <div className="ml-auto flex gap-2">
            <Btn variant={view === "board" ? "primary" : "secondary"} size="sm" onClick={() => setView("board")}>
              <ViewGridIcon /> Board
            </Btn>
            <Btn variant={view === "table" ? "primary" : "secondary"} size="sm" onClick={() => setView("table")}>
              <ListBulletIcon /> Table
            </Btn>
          </div>
        </div>
        <Alert message={error} variant="error" />

        {loading ? (
          <SkeletonBlock height={200} />
        ) : view === "board" ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STAGES.map((stage) => (
              <div key={stage.key} className="rounded-[14px] border border-border bg-card p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div className="text-sm font-semibold text-foreground">{stage.label}</div>
                  <Badge variant={STAGE_BADGE[stage.key]}>{applications.filter((a) => a.status === stage.key).length}</Badge>
                </div>
                <div className="flex flex-col gap-2">
                  {applications.filter((a) => a.status === stage.key).map((a) => (
                    <div key={a._id} className="rounded-lg bg-secondary p-3">
                      <div className="flex items-center gap-2">
                        <Avatar name={candidateName(a)} size={28} />
                        <div className="min-w-0 text-[13px] font-medium">{candidateName(a)}</div>
                      </div>
                      <select
                        className="mt-2 text-xs"
                        value={a.status}
                        disabled={busyId === a._id}
                        onChange={(e) => handleAdvance(a._id, e.target.value)}
                      >
                        {STAGES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                      </select>
                    </div>
                  ))}
                  {applications.filter((a) => a.status === stage.key).length === 0 && (
                    <div className="text-xs text-muted-foreground">No applicants</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div>
            {selected.size > 0 && (
              <div className="mb-3 flex flex-wrap items-center gap-2 rounded-lg bg-secondary px-4 py-2.5">
                <span className="text-[13px] text-muted-foreground">{selected.size} selected</span>
                <select className="w-auto" value={bulkStatus} onChange={(e) => setBulkStatus(e.target.value)}>
                  {STAGES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                </select>
                <Btn variant="primary" size="sm" onClick={handleBulkAdvance} disabled={bulkBusy}>
                  {bulkBusy ? "Updating…" : "Move selected"}
                </Btn>
              </div>
            )}
            <div className="overflow-x-auto rounded-[14px] border border-border bg-card">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="w-10 border-b border-border px-3 py-2.5">
                      <input
                        type="checkbox"
                        className="w-auto"
                        checked={selected.size > 0 && selected.size === applications.length}
                        onChange={(e) => setSelected(e.target.checked ? new Set(applications.map((a) => a._id)) : new Set())}
                      />
                    </th>
                    {["Candidate", "Status", "Applied"].map((h) => (
                      <th key={h} className="whitespace-nowrap border-b border-border px-3 py-2.5 text-left text-[13px] font-medium text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {applications.map((a) => (
                    <tr key={a._id}>
                      <td className="border-b border-border px-3 py-2.5">
                        <input type="checkbox" className="w-auto" checked={selected.has(a._id)} onChange={() => toggleSelected(a._id)} />
                      </td>
                      <td className="whitespace-nowrap border-b border-border px-3 py-2.5 text-[13px]">{candidateName(a)}</td>
                      <td className="whitespace-nowrap border-b border-border px-3 py-2.5">
                        <select
                          className="w-auto text-xs"
                          value={a.status}
                          disabled={busyId === a._id}
                          onChange={(e) => handleAdvance(a._id, e.target.value)}
                        >
                          {STAGES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                        </select>
                      </td>
                      <td className="whitespace-nowrap border-b border-border px-3 py-2.5 text-[13px] text-muted-foreground">
                        {a.appliedAt ? new Date(a.appliedAt).toLocaleDateString() : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {applications.length === 0 && <div className="p-6 text-center text-[13px] text-muted-foreground">No applicants yet.</div>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
