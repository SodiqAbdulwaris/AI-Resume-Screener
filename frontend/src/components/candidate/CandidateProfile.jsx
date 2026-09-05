import { useState } from "react";
import { PersonIcon, SewingPinIcon } from "@radix-ui/react-icons";
import Avatar from "../ui/Avatar";
import Alert from "../ui/Alert";
import Btn from "../ui/Btn";
import Spinner from "../ui/Spinner";
import StatCard from "../ui/StatCard";

import { useOutletContext } from "react-router-dom";

export default function CandidateProfile() {
  const { profile, handleAcceptParsedName: onAcceptParsedName } = useOutletContext();
  const [acceptingName, setAcceptingName] = useState(false);
  const [nameMessage, setNameMessage] = useState(null);
  const [nameError, setNameError] = useState(null);

  if (!profile) {
    return (
      <div className="py-16 text-center text-muted-foreground">
        <PersonIcon width={40} height={40} className="mx-auto mb-4 opacity-30" />
        <p>Upload your resume to auto-generate your profile.</p>
      </div>
    );
  }

  const accountName = profile.fullName || "Candidate";
  const parsedName = profile.parsedFullName;
  const showParsedName =
    parsedName && parsedName.trim().toLowerCase() !== accountName.trim().toLowerCase();

  async function handleAcceptParsedName() {
    if (!onAcceptParsedName) return;
    setAcceptingName(true);
    setNameMessage(null);
    setNameError(null);
    const result = await onAcceptParsedName();
    setAcceptingName(false);

    if (result.success) {
      setNameMessage("Account name updated from your resume.");
    } else {
      setNameError(result.message);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {/* Left */}
      <div className="flex flex-col gap-4">
        <div className="fade-up rounded-[14px] border border-border bg-card p-6">
          <Alert message={nameError} variant="error" />
          <Alert message={nameMessage} variant="success" />
          <div className="mb-5 flex flex-wrap items-center gap-4">
            <Avatar name={accountName} size={52} />
            <div>
              <div className="text-base font-medium">{accountName}</div>
              {showParsedName && <div className="text-xs text-muted-foreground">Resume name: {parsedName}</div>}
              <div className="text-[13px] text-muted-foreground">{profile.email}</div>
              {profile.phone && <div className="text-xs text-muted-foreground">{profile.phone}</div>}
              {profile.location && <div className="flex items-center gap-1 text-xs text-muted-foreground"><SewingPinIcon /> {profile.location}</div>}
            </div>
          </div>
          {showParsedName && (
            <div className="mb-4 rounded-[9px] bg-secondary p-4">
              <div className="mb-3 text-[13px] text-muted-foreground">
                Your resume uses a different name. Accept it to update your account name.
              </div>
              <Btn variant="secondary" size="sm" onClick={handleAcceptParsedName} disabled={acceptingName}>
                {acceptingName ? <Spinner size={14} /> : "Accept resume name"}
              </Btn>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Experience" value={`${profile.yearsExperience || 0} yrs`} />
            <StatCard label="Education" value={profile.educationLevel || "—"} />
          </div>
        </div>
        <div className="fade-up-2 rounded-[14px] border border-border bg-card p-6">
          <div className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Skills</div>
          <div className="flex flex-wrap gap-1.5">
            {(profile.skills || []).length
              ? profile.skills.map((sk) => (
                  <span key={sk} className="rounded-full border border-border bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">{sk}</span>
                ))
              : <span className="text-[13px] text-muted-foreground">No skills detected</span>}
          </div>
        </div>
        {profile.certifications?.length > 0 && (
          <div className="fade-up-3 rounded-[14px] border border-border bg-card p-6">
            <div className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Certifications</div>
            {profile.certifications.map((c, i) => <div key={i} className="py-1 text-[13px] text-muted-foreground">{c}</div>)}
          </div>
        )}
      </div>
      {/* Right */}
      <div className="flex flex-col gap-4">
        <div className="fade-up rounded-[14px] border border-border bg-card p-6">
          <div className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Experience</div>
          {(profile.experience || []).length ? profile.experience.map((e, i) => (
            <div key={i} className="mb-2 rounded-[9px] bg-secondary p-3">
              <div className="text-[13px] font-medium">{e.role}</div>
              <div className="text-xs text-muted-foreground">{e.company}</div>
              <div className="mt-0.5 text-[11px] text-muted-foreground">{e.startYear} — {e.endYear || "Present"}</div>
            </div>
          )) : <p className="text-[13px] text-muted-foreground">No experience parsed</p>}
        </div>
        <div className="fade-up-2 rounded-[14px] border border-border bg-card p-6">
          <div className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Education</div>
          {(profile.education || []).length ? profile.education.map((e, i) => (
            <div key={i} className="mb-2 rounded-[9px] bg-secondary p-3">
              <div className="text-[13px] font-medium">{e.degree}</div>
              <div className="text-xs text-muted-foreground">{e.institution}</div>
              <div className="mt-0.5 text-[11px] text-muted-foreground">{e.startYear} — {e.endYear || "Present"}</div>
            </div>
          )) : <p className="text-[13px] text-muted-foreground">No education parsed</p>}
        </div>
        {profile.projects?.length > 0 && (
          <div className="fade-up-3 rounded-[14px] border border-border bg-card p-6">
            <div className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Projects</div>
            {profile.projects.map((p, i) => (
              <div key={i} className="mb-3">
                <div className="mb-1 text-[13px] font-medium">{p.name}</div>
                <div className="flex flex-wrap gap-1">
                  {(p.technologies || []).map((t) => (
                    <span key={t} className="rounded-full border border-border bg-secondary px-2.5 py-0.5 text-[11px] font-medium text-secondary-foreground">{t}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
