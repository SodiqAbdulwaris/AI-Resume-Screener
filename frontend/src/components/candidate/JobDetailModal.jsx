import { COLORS } from "../../constants/colors";
import { s } from "../../styles/designSystem";
import { fmtDate } from "../../lib/utils";
import Modal from "../ui/Modal";
import Btn from "../ui/Btn";
import Badge from "../ui/Badge";

export default function JobDetailModal({ job, isApplied, onApply, onClose }) {
  return (
    <Modal onClose={onClose} maxWidth={540}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
        <h3 style={{ fontFamily: "'Instrument Serif', serif", fontSize: "1.5rem", fontWeight: 400 }}>{job.title}</h3>
        <Btn variant="ghost" size="sm" onClick={onClose} style={{ padding: "6px 8px" }}>✕</Btn>
      </div>
      <p style={{ color: COLORS.text2, fontSize: 14, marginBottom: "1.5rem", lineHeight: 1.7 }}>{job.description}</p>
      <div style={{ display: "flex", gap: 16, marginBottom: "1.5rem", fontSize: 13, color: COLORS.text2 }}>
        <span>🎓 {job.requiredEducationLevel}</span>
        <span>⏱ {job.requiredExperienceYears}+ years experience</span>
        <span>📅 Posted {fmtDate(job.createdAt)}</span>
      </div>
      <div style={s.sectionLabel}>Required skills</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: "1.25rem" }}>
        {(job.requiredSkills || []).map((sk) => <span key={sk} style={s.tag}>{sk}</span>)}
      </div>
      {job.preferredSkills?.length > 0 && (
        <>
          <div style={s.sectionLabel}>Nice to have</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: "1.5rem" }}>
            {job.preferredSkills.map((sk) => <span key={sk} style={{ ...s.tag, borderStyle: "dashed" }}>{sk}</span>)}
          </div>
        </>
      )}
      {isApplied ? (
        <Badge variant="green" style={{ fontSize: 14, padding: "8px 14px" }}>✓ Already applied</Badge>
      ) : (
        <Btn variant="primary" fullWidth onClick={() => { onClose(); onApply(job); }}>Apply to this role</Btn>
      )}
    </Modal>
  );
}
