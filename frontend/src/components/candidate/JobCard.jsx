import { ReaderIcon, ClockIcon } from "@radix-ui/react-icons";
import Badge from "../ui/Badge";
import Btn from "../ui/Btn";

export default function JobCard({ job, isApplied, onApply, onView }) {
  return (
    <div className="rounded-[14px] border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:bg-accent">
      <div className="mb-3 flex items-start justify-between gap-2">
        <h3 className="text-base font-bold leading-tight text-foreground">{job.title}</h3>
        {isApplied ? <Badge variant="green">Applied</Badge> : <Badge variant="gray">Open</Badge>}
      </div>
      <p className="mb-3.5 line-clamp-2 text-[13px] text-muted-foreground">{job.description}</p>
      <div className="mb-3 flex flex-wrap gap-1.5">
        {(job.requiredSkills || []).slice(0, 5).map((sk) => (
          <span key={sk} className="rounded-full border border-border bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">{sk}</span>
        ))}
        {job.requiredSkills?.length > 5 && (
          <span className="rounded-full border border-border bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">+{job.requiredSkills.length - 5}</span>
        )}
      </div>
      <div className="mb-4 flex gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><ReaderIcon /> {job.requiredEducationLevel}</span>
        <span className="flex items-center gap-1"><ClockIcon /> {job.requiredExperienceYears}+ yrs</span>
      </div>
      <div className="flex gap-2">
        <Btn variant="secondary" size="sm" onClick={() => onView(job)}>Details</Btn>
        {!isApplied && <Btn variant="primary" size="sm" onClick={() => onApply(job)}>Apply now</Btn>}
      </div>
    </div>
  );
}
