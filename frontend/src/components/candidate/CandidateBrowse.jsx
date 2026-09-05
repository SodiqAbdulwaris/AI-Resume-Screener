import { useState } from "react";
import { MagnifyingGlassIcon } from "@radix-ui/react-icons";
import { COLORS } from "../../constants/colors";
import { applyToJob } from "../../lib/api";
import JobCard from "./JobCard";
import JobDetailModal from "./JobDetailModal";
import ApplyModal from "./ApplyModal";
import Btn from "../ui/Btn";

import { useOutletContext } from "react-router-dom";

export default function CandidateBrowse() {
  const {
    jobs,
    applications,
    profile,
    token,
    loadAll: onApplied,
    hasMore,
    loadingJobs: loadingMore,
    loadJobsData,
    nextCursor,
  } = useOutletContext();

  const onLoadMore = () => loadJobsData(nextCursor);
  const [modal, setModal] = useState(null); // null | {type, job}
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const appliedIds = new Set((applications || []).map((a) => a.job?._id || a.job));

  async function handleApply(job) {
    if (!profile) { alert("Please upload your resume first."); return; }
    setModal({ type: "apply", job });
    setError(null);
  }

  async function confirmApply() {
    setLoading(true); setError(null);
    const r = await applyToJob(modal.job._id, token);
    setLoading(false);
    if (r.success) { setModal(null); onApplied(); }
    else setError(r.message);
  }

  return (
    <div>
      {!jobs.length ? (
        <div style={{ textAlign: "center", padding: "4rem", color: COLORS.text2 }}>
          <MagnifyingGlassIcon width={40} height={40} style={{ marginBottom: "1rem", opacity: 0.3 }} />
          <p>No open jobs right now. Check back soon.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem" }}>
          {jobs.map((j) => (
            <div key={j._id} className="fade-up">
              <JobCard
                job={j}
                isApplied={appliedIds.has(j._id)}
                onApply={handleApply}
                onView={(job) => setModal({ type: "detail", job })}
              />
            </div>
          ))}
        </div>
      )}
      {hasMore && (
        <div style={{ display: "flex", justifyContent: "center", marginTop: "2rem" }}>
          <Btn variant="secondary" onClick={onLoadMore} disabled={loadingMore}>
            {loadingMore ? "Loading..." : "Load More Roles"}
          </Btn>
        </div>
      )}
      {modal?.type === "detail" && (
        <JobDetailModal
          job={modal.job}
          isApplied={appliedIds.has(modal.job._id)}
          onApply={handleApply}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.type === "apply" && (
        <ApplyModal
          job={modal.job}
          onConfirm={confirmApply}
          onClose={() => setModal(null)}
          loading={loading}
          error={error}
        />
      )}
    </div>
  );
}
