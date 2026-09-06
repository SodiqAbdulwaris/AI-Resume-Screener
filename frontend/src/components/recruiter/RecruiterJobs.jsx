import { useOutletContext, useNavigate } from "react-router-dom";
import { ListBulletIcon, ClockIcon, ReaderIcon, RocketIcon, ViewGridIcon } from "@radix-ui/react-icons";
import StatCard from "../ui/StatCard";
import Btn from "../ui/Btn";
import Badge from "../ui/Badge";

export default function RecruiterJobs() {
  const { jobs, onViewMatch, onPost, onToggleJobStatus, hasMore, loadingMore, onLoadMore } = useOutletContext();
  const navigate = useNavigate();
  const openJobs = jobs.filter((j) => j.isOpen);
  return (
    <div>
      <div className="fade-up mb-7 grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-3">
        <StatCard label="Total Jobs" value={jobs.length} />
        <StatCard label="Open Roles" value={openJobs.length} />
        <StatCard label="Closed" value={jobs.length - openJobs.length} />
      </div>
      {!jobs.length ? (
        <div className="py-16 text-center text-muted-foreground">
          <ListBulletIcon width={40} height={40} className="mx-auto mb-4 opacity-30" />
          <p className="mb-5">No jobs posted yet.</p>
          <Btn variant="primary" onClick={onPost}>Post your first job</Btn>
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
          {jobs.map((j, i) => (
            <div key={j._id} className="fade-up" style={{ animationDelay: `${i * 0.04}s` }}>
              <div className="rounded-[14px] border border-border bg-card p-5 transition-all hover:bg-accent">
                <div className="mb-3 flex items-start justify-between gap-2">
                  <h3 className="text-base font-bold text-foreground">{j.title}</h3>
                  {j.isOpen ? <Badge variant="green">Open</Badge> : <Badge variant="gray">Closed</Badge>}
                </div>
                <p className="mb-3.5 line-clamp-2 text-[13px] text-muted-foreground">{j.description}</p>
                <div className="mb-3 flex flex-wrap gap-1.5">
                  {(j.requiredSkills || []).slice(0, 4).map((sk) => (
                    <span key={sk} className="rounded-full border border-border bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">{sk}</span>
                  ))}
                </div>
                <div className="mb-4 flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
                  <ClockIcon /> {j.requiredExperienceYears}+ yrs · <ReaderIcon /> {j.requiredEducationLevel}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Btn variant="secondary" size="sm" onClick={() => onViewMatch(j, false)}>View Matches</Btn>
                  <Btn variant="secondary" size="sm" onClick={() => navigate(`/recruiter/jobs/${j._id}/pipeline`)}><ViewGridIcon /> Pipeline</Btn>
                  <Btn variant="primary" size="sm" onClick={() => onViewMatch(j, true)}><RocketIcon /> Run Match</Btn>
                  <Btn
                    variant={j.isOpen ? "danger" : "secondary"}
                    size="sm"
                    onClick={() => onToggleJobStatus && onToggleJobStatus(j._id, j.isOpen)}
                  >
                    {j.isOpen ? "Close Role" : "Reopen Role"}
                  </Btn>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {hasMore && (
        <div className="mt-8 flex justify-center">
          <Btn variant="secondary" onClick={onLoadMore} disabled={loadingMore}>
            {loadingMore ? "Loading..." : "Load More Jobs"}
          </Btn>
        </div>
      )}
    </div>
  );
}
