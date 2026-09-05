import { ReaderIcon, ClockIcon, CalendarIcon, CheckCircledIcon, Cross2Icon } from "@radix-ui/react-icons";
import { fmtDate } from "../../lib/utils";
import Modal from "../ui/Modal";
import Btn from "../ui/Btn";
import Badge from "../ui/Badge";

export default function JobDetailModal({ job, isApplied, onApply, onClose }) {
  return (
    <Modal onClose={onClose} maxWidth={540}>
      <div className="mb-5 flex items-start justify-between">
        <h3 className="text-2xl font-bold text-foreground">{job.title}</h3>
        <Btn variant="ghost" size="sm" onClick={onClose} className="px-2 py-1.5"><Cross2Icon /></Btn>
      </div>
      <p className="mb-6 text-sm leading-relaxed text-muted-foreground">{job.description}</p>
      <div className="mb-6 flex gap-4 text-[13px] text-muted-foreground">
        <span className="flex items-center gap-1"><ReaderIcon /> {job.requiredEducationLevel}</span>
        <span className="flex items-center gap-1"><ClockIcon /> {job.requiredExperienceYears}+ years experience</span>
        <span className="flex items-center gap-1"><CalendarIcon /> Posted {fmtDate(job.createdAt)}</span>
      </div>
      <div className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Required skills</div>
      <div className="mb-5 flex flex-wrap gap-1.5">
        {(job.requiredSkills || []).map((sk) => (
          <span key={sk} className="rounded-full border border-border bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">{sk}</span>
        ))}
      </div>
      {job.preferredSkills?.length > 0 && (
        <>
          <div className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Nice to have</div>
          <div className="mb-6 flex flex-wrap gap-1.5">
            {job.preferredSkills.map((sk) => (
              <span key={sk} className="rounded-full border border-dashed border-border bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">{sk}</span>
            ))}
          </div>
        </>
      )}
      {isApplied ? (
        <Badge variant="green" className="gap-1.5 px-3.5 py-2 text-sm"><CheckCircledIcon /> Already applied</Badge>
      ) : (
        <Btn variant="primary" fullWidth onClick={() => { onClose(); onApply(job); }}>Apply to this role</Btn>
      )}
    </Modal>
  );
}
