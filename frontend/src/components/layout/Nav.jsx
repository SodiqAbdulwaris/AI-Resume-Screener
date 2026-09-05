import { SunIcon, MoonIcon } from "@radix-ui/react-icons";
import { COLORS } from "../../constants/colors";
import Avatar from "../ui/Avatar";
import Btn from "../ui/Btn";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";

export default function Nav({ onContactClick }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const isRecruiter = user?.role === "recruiter";
  const isAdmin = user?.role === "admin";
  const roleLabel = isAdmin ? "Admin" : isRecruiter ? "Recruiter" : "Candidate";

  return (
    <nav
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0.9rem 2rem",
        borderBottom: `1px solid ${COLORS.border}`,
        background: "color-mix(in srgb, var(--background) 90%, transparent)",
        backdropFilter: "blur(12px)",
        position: "sticky",
        top: 0,
        zIndex: 200,
      }}
    >
      {/* Left: Logo + role badge */}
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
            fontFamily: "'Geist Variable', sans-serif",
            fontSize: "1.25rem",
            fontWeight: 700,
            color: COLORS.text,
            letterSpacing: "-0.02em",
          }}
        >
          HireSignal
        </span>
        {user && (
          <span
            style={{
              marginLeft: 4,
              fontSize: 11,
              padding: "2px 8px",
              background: isRecruiter ? "rgba(20,184,166,0.12)" : COLORS.accentGlow,
              color: isRecruiter ? COLORS.teal : "var(--primary)",
              borderRadius: 20,
              fontWeight: 500,
            }}
          >
            {roleLabel}
          </span>
        )}
      </div>

      {/* Right: Contact Us + user info + sign out */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <Btn
          variant="ghost"
          size="sm"
          onClick={toggleTheme}
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          style={{ paddingLeft: 8, paddingRight: 8 }}
        >
          {theme === "dark" ? <SunIcon /> : <MoonIcon />}
        </Btn>
        <Btn
          id="nav-contact-btn"
          variant="ghost"
          size="sm"
          onClick={onContactClick}
        >
          Contact Us
        </Btn>

        {user && (
          <>
            <Avatar name={user.fullName} size={32} />
            <div style={{ lineHeight: 1.3 }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{user.fullName}</div>
              <div style={{ fontSize: 11, color: COLORS.text3 }}>{user.email}</div>
            </div>
            <Btn variant="secondary" size="sm" onClick={logout}>Sign out</Btn>
          </>
        )}
      </div>
    </nav>
  );
}
