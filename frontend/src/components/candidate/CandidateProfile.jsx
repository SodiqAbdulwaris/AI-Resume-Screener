import { useState } from "react";
import { COLORS } from "../../constants/colors";
import { s } from "../../styles/designSystem";
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
      <div style={{ textAlign: "center", padding: "4rem", color: COLORS.text2 }}>
        <div style={{ fontSize: "2.5rem", opacity: 0.3, marginBottom: "1rem" }}>👤</div>
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
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1rem" }}>
      {/* Left */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div style={s.card} className="fade-up">
          <Alert message={nameError} variant="error" />
          <Alert message={nameMessage} variant="success" />
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.25rem" }}>
            <Avatar name={accountName} size={52} />
            <div>
              <div style={{ fontSize: "1rem", fontWeight: 500 }}>{accountName}</div>
              {showParsedName && <div style={{ fontSize: 12, color: COLORS.text3 }}>Resume name: {parsedName}</div>}
              <div style={{ fontSize: 13, color: COLORS.text2 }}>{profile.email}</div>
              {profile.phone && <div style={{ fontSize: 12, color: COLORS.text3 }}>{profile.phone}</div>}
              {profile.location && <div style={{ fontSize: 12, color: COLORS.text3 }}>📍 {profile.location}</div>}
            </div>
          </div>
          {showParsedName && (
            <div style={{ background: COLORS.bg3, borderRadius: 9, padding: "0.85rem 1rem", marginBottom: "1rem" }}>
              <div style={{ fontSize: 13, color: COLORS.text2, marginBottom: "0.75rem" }}>
                Your resume uses a different name. Accept it to update your account name.
              </div>
              <Btn variant="secondary" size="sm" onClick={handleAcceptParsedName} disabled={acceptingName}>
                {acceptingName ? <Spinner size={14} /> : "Accept resume name"}
              </Btn>
            </div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <StatCard label="Experience" value={`${profile.yearsExperience || 0} yrs`} />
            <StatCard label="Education" value={profile.educationLevel || "—"} />
          </div>
        </div>
        <div style={s.card} className="fade-up-2">
          <div style={s.sectionLabel}>Skills</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {(profile.skills || []).length
              ? profile.skills.map((sk) => <span key={sk} style={s.tag}>{sk}</span>)
              : <span style={{ color: COLORS.text3, fontSize: 13 }}>No skills detected</span>}
          </div>
        </div>
        {profile.certifications?.length > 0 && (
          <div style={s.card} className="fade-up-3">
            <div style={s.sectionLabel}>Certifications</div>
            {profile.certifications.map((c, i) => <div key={i} style={{ fontSize: 13, color: COLORS.text2, padding: "4px 0" }}>{c}</div>)}
          </div>
        )}
      </div>
      {/* Right */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div style={s.card} className="fade-up">
          <div style={s.sectionLabel}>Experience</div>
          {(profile.experience || []).length ? profile.experience.map((e, i) => (
            <div key={i} style={{ background: COLORS.bg3, borderRadius: 9, padding: "0.75rem 1rem", marginBottom: "0.5rem" }}>
              <div style={{ fontWeight: 500, fontSize: 13 }}>{e.role}</div>
              <div style={{ fontSize: 12, color: COLORS.text2 }}>{e.company}</div>
              <div style={{ fontSize: 11, color: COLORS.text3, marginTop: 2 }}>{e.startYear} — {e.endYear || "Present"}</div>
            </div>
          )) : <p style={{ color: COLORS.text3, fontSize: 13 }}>No experience parsed</p>}
        </div>
        <div style={s.card} className="fade-up-2">
          <div style={s.sectionLabel}>Education</div>
          {(profile.education || []).length ? profile.education.map((e, i) => (
            <div key={i} style={{ background: COLORS.bg3, borderRadius: 9, padding: "0.75rem 1rem", marginBottom: "0.5rem" }}>
              <div style={{ fontWeight: 500, fontSize: 13 }}>{e.degree}</div>
              <div style={{ fontSize: 12, color: COLORS.text2 }}>{e.institution}</div>
              <div style={{ fontSize: 11, color: COLORS.text3, marginTop: 2 }}>{e.startYear} — {e.endYear || "Present"}</div>
            </div>
          )) : <p style={{ color: COLORS.text3, fontSize: 13 }}>No education parsed</p>}
        </div>
        {profile.projects?.length > 0 && (
          <div style={s.card} className="fade-up-3">
            <div style={s.sectionLabel}>Projects</div>
            {profile.projects.map((p, i) => (
              <div key={i} style={{ marginBottom: "0.75rem" }}>
                <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>{p.name}</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {(p.technologies || []).map((t) => <span key={t} style={{ ...s.tag, fontSize: 11 }}>{t}</span>)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
