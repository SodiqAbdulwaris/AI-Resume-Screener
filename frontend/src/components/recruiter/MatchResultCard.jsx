import { useState } from "react";
import { COLORS } from "../../constants/colors";
import { s } from "../../styles/designSystem";
import Avatar from "../ui/Avatar";
import Badge from "../ui/Badge";
import ScoreBar, { scoreColor } from "../ui/ScoreBar";
import Divider from "../ui/Divider";

export default function MatchResultCard({ match, rank }) {
  const [expanded, setExpanded] = useState(false);
  const cand = match.candidate || {};
  const name = typeof cand === "object" ? cand.fullName || "Candidate" : "Candidate";
  const email = typeof cand === "object" ? cand.email : null;
  const phone = typeof cand === "object" ? cand.phone : null;
  const score = Math.round((match.totalScore || 0) * 100);
  const breakdown = match.scoreBreakdown || {};
  const color = scoreColor(match.totalScore);

  const isTop = rank <= 3;
  const goldColors = [
    "linear-gradient(135deg,#f59e0b,#ef4444)",
    "linear-gradient(135deg,#9ca3af,#6b7280)",
    "linear-gradient(135deg,#b45309,#92400e)"
  ];

  return (
    <div
      className="fade-up"
      style={{
        ...s.card,
        position: "relative",
        overflow: "hidden",
        borderColor: rank === 1 ? "rgba(245,158,11,0.2)" : COLORS.border,
        animationDelay: `${(rank - 1) * 0.06}s`,
      }}
    >
      {/* Rank watermark */}
      <div style={{ position: "absolute", top: "0.75rem", right: "1rem", fontFamily: "'Instrument Serif', serif", fontSize: "3rem", fontWeight: 400, color: isTop ? `rgba(245,158,11,0.08)` : "rgba(255,255,255,0.03)", userSelect: "none", lineHeight: 1 }}>
        #{match.rankedPosition || rank}
      </div>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem", marginBottom: "1rem" }}>
        <Avatar name={name} size={42} gradient={isTop ? goldColors[rank - 1] : undefined} />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 2 }}>{name}</div>
          {typeof cand === "object" && (
            <div style={{ fontSize: 12, color: COLORS.text2 }}>
              {cand.educationLevel && `${cand.educationLevel} · `}{cand.yearsExperience != null ? `${cand.yearsExperience} yrs exp` : ""}
            </div>
          )}
          {(email || phone) && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 6, fontSize: 12 }}>
              {email && <a href={`mailto:${email}`} style={{ color: "#a5b4fc", textDecoration: "none" }}>{email}</a>}
              {phone && <a href={`tel:${phone}`} style={{ color: COLORS.text2, textDecoration: "none" }}>{phone}</a>}
            </div>
          )}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
            {(typeof cand === "object" ? cand.skills || [] : []).slice(0, 4).map((sk) => (
              <span key={sk} style={{ ...s.tag, fontSize: 11 }}>{sk}</span>
            ))}
          </div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: "2rem", color, lineHeight: 1 }}>{score}</div>
          <div style={{ fontSize: 10, color: COLORS.text3, textTransform: "uppercase", letterSpacing: "0.06em" }}>% match</div>
          {match.shortlisted && <Badge variant="green" style={{ marginTop: 4 }}>Shortlisted</Badge>}
        </div>
      </div>

      {/* Score bar */}
      <ScoreBar value={match.totalScore} color={color} />

      {/* Breakdown */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, margin: "1rem 0" }}>
        {Object.entries(breakdown).map(([k, v]) => (
          <div key={k} style={{ background: COLORS.bg3, borderRadius: 8, padding: "8px 10px", textAlign: "center" }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: scoreColor(v) }}>{Math.round(v * 100)}%</div>
            <div style={{ fontSize: 10, color: COLORS.text3, textTransform: "capitalize", marginTop: 2 }}>{k}</div>
          </div>
        ))}
      </div>

      {/* Skills */}
      <div style={{ marginBottom: "0.75rem" }}>
        <div style={{ fontSize: 11, color: COLORS.text3, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.07em" }}>Skills</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
          {(match.matchedSkills || []).map((sk) => (
            <span key={sk} style={{ ...s.tag, background: "rgba(34,197,94,0.1)", borderColor: "rgba(34,197,94,0.25)", color: "#4ade80", fontSize: 11 }}>✓ {sk}</span>
          ))}
          {(match.missingSkills || []).map((sk) => (
            <span key={sk} style={{ ...s.tag, background: "rgba(239,68,68,0.08)", borderColor: "rgba(239,68,68,0.2)", color: "#f87171", fontSize: 11 }}>✗ {sk}</span>
          ))}
        </div>
      </div>

      {/* Expand */}
      {(match.explanation || match.reasons?.length) && (
        <>
          <Divider />
          <button
            onClick={() => setExpanded(!expanded)}
            style={{ background: "none", border: "none", color: COLORS.text3, fontSize: 12, cursor: "pointer", padding: 0, fontFamily: "'Geist', sans-serif", display: "flex", alignItems: "center", gap: 4 }}
          >
            {expanded ? "▲ Hide" : "▼ Show"} AI reasoning
          </button>
          {expanded && (
            <div style={{ marginTop: "0.75rem" }}>
              {match.reasons?.length > 0 && (
                <ul style={{ paddingLeft: "1.25rem", fontSize: 13, color: COLORS.text2, marginBottom: "0.5rem" }}>
                  {match.reasons.map((r, i) => <li key={i} style={{ marginBottom: 3 }}>{r}</li>)}
                </ul>
              )}
              {match.explanation && (
                <p style={{ fontSize: 13, color: COLORS.text2, borderLeft: `2px solid ${COLORS.border2}`, paddingLeft: "0.75rem", margin: 0, lineHeight: 1.65 }}>
                  {match.explanation}
                </p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
