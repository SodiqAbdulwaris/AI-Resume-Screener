import { COLORS } from "../../constants/colors";
import { s } from "../../styles/designSystem";
import StatCard from "../ui/StatCard";
import Btn from "../ui/Btn";
import Badge from "../ui/Badge";

export default function RecruiterJobs({ jobs, onViewMatch, onPost }) {
  const openJobs = jobs.filter((j) => j.isOpen);
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "0.75rem", marginBottom: "1.75rem" }} className="fade-up">
        <StatCard label="Total Jobs" value={jobs.length} />
        <StatCard label="Open Roles" value={openJobs.length} />
        <StatCard label="Closed" value={jobs.length - openJobs.length} />
      </div>
      {!jobs.length ? (
        <div style={{ textAlign: "center", padding: "4rem", color: COLORS.text2 }}>
          <div style={{ fontSize: "2.5rem", opacity: 0.3, marginBottom: "1rem" }}>📋</div>
          <p style={{ marginBottom: "1.25rem" }}>No jobs posted yet.</p>
          <Btn variant="primary" onClick={onPost}>Post your first job</Btn>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem" }}>
          {jobs.map((j, i) => (
            <div key={j._id} className="fade-up" style={{ animationDelay: `${i * 0.04}s` }}>
              <div style={{ ...s.cardHoverable }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                  <h3 style={{ fontFamily: "'Instrument Serif', serif", fontSize: "1.05rem", fontWeight: 400 }}>{j.title}</h3>
                  {j.isOpen ? <Badge variant="green">Open</Badge> : <Badge variant="gray">Closed</Badge>}
                </div>
                <p style={{ fontSize: 13, color: COLORS.text2, marginBottom: "0.9rem", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                  {j.description}
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: "0.75rem" }}>
                  {(j.requiredSkills || []).slice(0, 4).map((sk) => <span key={sk} style={s.tag}>{sk}</span>)}
                </div>
                <div style={{ fontSize: 12, color: COLORS.text3, marginBottom: "1rem" }}>
                  ⏱ {j.requiredExperienceYears}+ yrs · 🎓 {j.requiredEducationLevel}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <Btn variant="secondary" size="sm" onClick={() => onViewMatch(j, false)}>View Matches</Btn>
                  <Btn variant="primary" size="sm" onClick={() => onViewMatch(j, true)}>🤖 Run Match</Btn>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
