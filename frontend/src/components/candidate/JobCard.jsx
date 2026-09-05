import { useState } from "react";
import { ReaderIcon, ClockIcon } from "@radix-ui/react-icons";
import { COLORS } from "../../constants/colors";
import { s } from "../../styles/designSystem";
import Badge from "../ui/Badge";
import Btn from "../ui/Btn";

export default function JobCard({ job, isApplied, onApply, onView }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      style={{
        ...s.cardHoverable,
        background: hover ? COLORS.cardHover : COLORS.card,
        borderColor: hover ? COLORS.border2 : COLORS.border,
        transform: hover ? "translateY(-2px)" : "translateY(0)",
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: "0.75rem" }}>
        <h3 style={{ fontFamily: "'Geist Variable', sans-serif", fontSize: "1.05rem", fontWeight: 700, color: COLORS.text, lineHeight: 1.3 }}>{job.title}</h3>
        {isApplied ? <Badge variant="green">Applied</Badge> : <Badge variant="gray">Open</Badge>}
      </div>
      <p style={{ fontSize: 13, color: COLORS.text2, marginBottom: "0.9rem", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
        {job.description}
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: "0.75rem" }}>
        {(job.requiredSkills || []).slice(0, 5).map((sk) => (
          <span key={sk} style={s.tag}>{sk}</span>
        ))}
        {job.requiredSkills?.length > 5 && <span style={s.tag}>+{job.requiredSkills.length - 5}</span>}
      </div>
      <div style={{ fontSize: 12, color: COLORS.text3, marginBottom: "1rem", display: "flex", gap: 12 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}><ReaderIcon /> {job.requiredEducationLevel}</span>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}><ClockIcon /> {job.requiredExperienceYears}+ yrs</span>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <Btn variant="secondary" size="sm" onClick={() => onView(job)}>Details</Btn>
        {!isApplied && <Btn variant="primary" size="sm" onClick={() => onApply(job)}>Apply now</Btn>}
      </div>
    </div>
  );
}
