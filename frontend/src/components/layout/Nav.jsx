import { COLORS } from "../../constants/colors";
import Avatar from "../ui/Avatar";
import Btn from "../ui/Btn";
import { useAuth } from "../../context/AuthContext";

export default function Nav() {
  const { user, logout } = useAuth();
  if (!user) return null;
  const isRecruiter = user.role === "recruiter";

  return (
    <nav
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0.9rem 2rem",
        borderBottom: `1px solid ${COLORS.border}`,
        background: "rgba(9,9,11,0.9)",
        backdropFilter: "blur(12px)",
        position: "sticky",
        top: 0,
        zIndex: 200,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div
          style={{
            width: 28,
            height: 28,
            background: COLORS.accent,
            borderRadius: 7,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2 4h10M2 7h7M2 10h5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
        <span
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontSize: "1.25rem",
            color: COLORS.text,
            letterSpacing: "-0.01em",
          }}
        >
          HireSignal
        </span>
        <span
          style={{
            marginLeft: 4,
            fontSize: 11,
            padding: "2px 8px",
            background: isRecruiter ? "rgba(20,184,166,0.12)" : COLORS.accentGlow,
            color: isRecruiter ? COLORS.teal : "#a5b4fc",
            borderRadius: 20,
            fontWeight: 500,
          }}
        >
          {isRecruiter ? "Recruiter" : "Candidate"}
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <Avatar name={user.fullName} size={32} />
        <div style={{ lineHeight: 1.3 }}>
          <div style={{ fontSize: 13, fontWeight: 500 }}>{user.fullName}</div>
          <div style={{ fontSize: 11, color: COLORS.text3 }}>{user.email}</div>
        </div>
        <Btn variant="secondary" size="sm" onClick={logout}>Sign out</Btn>
      </div>
    </nav>
  );
}
