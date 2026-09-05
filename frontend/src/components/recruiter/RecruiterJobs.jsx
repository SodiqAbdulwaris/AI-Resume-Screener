import { useOutletContext } from "react-router-dom";
import { ListBulletIcon, ClockIcon, ReaderIcon, RocketIcon } from "@radix-ui/react-icons";
import { COLORS } from "../../constants/colors";
import { s } from "../../styles/designSystem";
import StatCard from "../ui/StatCard";
import Btn from "../ui/Btn";
import Badge from "../ui/Badge";

export default function RecruiterJobs() {
  const { jobs, onViewMatch, onPost, onToggleJobStatus, hasMore, loadingMore, onLoadMore } = useOutletContext();
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
          <ListBulletIcon width={40} height={40} style={{ opacity: 0.3, marginBottom: "1rem" }} />
          <p style={{ marginBottom: "1.25rem" }}>No jobs posted yet.</p>
          <Btn variant="primary" onClick={onPost}>Post your first job</Btn>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem" }}>
          {jobs.map((j, i) => (
            <div key={j._id} className="fade-up" style={{ animationDelay: `${i * 0.04}s` }}>
              <div style={{ ...s.cardHoverable }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                  <h3 style={{ fontFamily: "'Geist Variable', sans-serif", fontSize: "1.05rem", fontWeight: 700 }}>{j.title}</h3>
                  {j.isOpen ? <Badge variant="green">Open</Badge> : <Badge variant="gray">Closed</Badge>}
                </div>
                <p style={{ fontSize: 13, color: COLORS.text2, marginBottom: "0.9rem", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                  {j.description}
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: "0.75rem" }}>
                  {(j.requiredSkills || []).slice(0, 4).map((sk) => <span key={sk} style={s.tag}>{sk}</span>)}
                </div>
                <div style={{ fontSize: 12, color: COLORS.text3, marginBottom: "1rem", display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
                  <ClockIcon /> {j.requiredExperienceYears}+ yrs · <ReaderIcon /> {j.requiredEducationLevel}
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <Btn variant="secondary" size="sm" onClick={() => onViewMatch(j, false)}>View Matches</Btn>
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
        <div style={{ display: "flex", justifyContent: "center", marginTop: "2rem" }}>
          <Btn variant="secondary" onClick={onLoadMore} disabled={loadingMore}>
            {loadingMore ? "Loading..." : "Load More Jobs"}
          </Btn>
        </div>
      )}
    </div>
  );
}
