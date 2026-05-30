import { useState } from "react";
import { COLORS } from "../../constants/colors";
import { applyToJob } from "../../lib/api";
import JobCard from "./JobCard";
import JobDetailModal from "./JobDetailModal";
import ApplyModal from "./ApplyModal";

export default function CandidateBrowse({ jobs, applications, profile, token, onApplied }) {
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
          <div style={{ fontSize: "2.5rem", marginBottom: "1rem", opacity: 0.3 }}>🔍</div>
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
