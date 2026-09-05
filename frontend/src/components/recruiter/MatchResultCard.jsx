import { useState } from "react";
import { CheckIcon, Cross1Icon, ChevronUpIcon, ChevronDownIcon } from "@radix-ui/react-icons";
import Avatar from "../ui/Avatar";
import Badge from "../ui/Badge";
import ScoreBar, { scoreColor } from "../ui/ScoreBar";
import Divider from "../ui/Divider";

export default function MatchResultCard({ match, rank, onToggleShortlist }) {
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
      className="fade-up relative overflow-hidden rounded-[14px] border bg-card p-6"
      style={{ borderColor: rank === 1 ? "rgba(245,158,11,0.2)" : "var(--border)", animationDelay: `${(rank - 1) * 0.06}s` }}
    >
      {/* Rank watermark */}
      <div
        className="pointer-events-none absolute right-4 top-3 select-none text-5xl font-bold leading-none"
        style={{ color: isTop ? "rgba(245,158,11,0.12)" : "color-mix(in srgb, var(--foreground) 4%, transparent)" }}
      >
        #{match.rankedPosition || rank}
      </div>

      {/* Header */}
      <div className="mb-4 flex flex-wrap items-start gap-4">
        <Avatar name={name} size={42} gradient={isTop ? goldColors[rank - 1] : undefined} />
        <div className="min-w-0 flex-1">
          <div className="mb-0.5 flex items-center gap-2">
            <div className="text-sm font-medium">{name}</div>
            <button
              onClick={() => onToggleShortlist && onToggleShortlist(match._id, !!match.shortlisted)}
              className="inline-flex items-center px-1 py-0.5 transition-transform hover:scale-110"
              style={{ color: match.shortlisted ? "#d97706" : "var(--muted-foreground)" }}
              title={match.shortlisted ? "Remove from Shortlist" : "Shortlist Candidate"}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill={match.shortlisted ? "#d97706" : "none"} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </button>
          </div>
          {typeof cand === "object" && (
            <div className="text-xs text-muted-foreground">
              {cand.educationLevel && `${cand.educationLevel} · `}{cand.yearsExperience != null ? `${cand.yearsExperience} yrs exp` : ""}
            </div>
          )}
          {(email || phone) && (
            <div className="mt-1.5 flex flex-wrap gap-2 text-xs">
              {email && <a href={`mailto:${email}`} className="text-primary no-underline">{email}</a>}
              {phone && <a href={`tel:${phone}`} className="text-muted-foreground no-underline">{phone}</a>}
            </div>
          )}
          <div className="mt-1.5 flex flex-wrap gap-1">
            {(typeof cand === "object" ? cand.skills || [] : []).slice(0, 4).map((sk) => (
              <span key={sk} className="rounded-full border border-border bg-secondary px-2.5 py-0.5 text-[11px] font-medium text-secondary-foreground">{sk}</span>
            ))}
          </div>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-3xl font-bold leading-none" style={{ color }}>{score}</div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">% match</div>
          {match.shortlisted && <Badge variant="green" className="mt-1">Shortlisted</Badge>}
        </div>
      </div>

      {/* Score bar */}
      <ScoreBar value={match.totalScore} color={color} />

      {/* Breakdown */}
      <div className="my-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {Object.entries(breakdown).map(([k, v]) => (
          <div key={k} className="rounded-lg bg-secondary px-2.5 py-2 text-center">
            <div className="text-[13px] font-medium" style={{ color: scoreColor(v) }}>{Math.round(v * 100)}%</div>
            <div className="mt-0.5 text-[10px] capitalize text-muted-foreground">{k}</div>
          </div>
        ))}
      </div>

      {/* Skills */}
      <div className="mb-3">
        <div className="mb-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">Skills</div>
        <div className="flex flex-wrap gap-1.5">
          {(match.matchedSkills || []).map((sk) => (
            <Badge key={sk} variant="green"><CheckIcon width={11} height={11} /> {sk}</Badge>
          ))}
          {(match.missingSkills || []).map((sk) => (
            <Badge key={sk} variant="red"><Cross1Icon width={11} height={11} /> {sk}</Badge>
          ))}
        </div>
      </div>

      {/* Expand */}
      {(match.explanation || match.reasons?.length) && (
        <>
          <Divider />
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 border-none bg-transparent p-0 text-xs text-muted-foreground"
          >
            {expanded ? <ChevronUpIcon /> : <ChevronDownIcon />} {expanded ? "Hide" : "Show"} AI reasoning
          </button>
          {expanded && (
            <div className="mt-3">
              {match.reasons?.length > 0 && (
                <ul className="mb-2 list-disc pl-5 text-[13px] text-muted-foreground">
                  {match.reasons.map((r, i) => <li key={i} className="mb-0.5">{r}</li>)}
                </ul>
              )}
              {match.explanation && (
                <p className="border-l-2 border-border pl-3 text-[13px] leading-relaxed text-muted-foreground">
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
