import { SunIcon, MoonIcon } from "@radix-ui/react-icons";
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
      className="sticky top-0 z-[200] flex items-center justify-between border-b border-border px-8 py-3.5 backdrop-blur-md"
      style={{ background: "color-mix(in srgb, var(--background) 90%, transparent)" }}
    >
      <div className="flex items-center gap-2.5">
        <div className="flex h-7 w-7 items-center justify-center rounded-[7px] bg-primary">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2 4h10M2 7h7M2 10h5" stroke="var(--primary-foreground)" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
        <span className="text-xl font-bold tracking-tight text-foreground">HireSignal</span>
        {user && (
          <span className="ml-1 rounded-full bg-accent px-2 py-0.5 text-[11px] font-medium text-accent-foreground">
            {roleLabel}
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Btn
          variant="ghost"
          size="sm"
          onClick={toggleTheme}
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          className="px-2"
        >
          {theme === "dark" ? <SunIcon /> : <MoonIcon />}
        </Btn>
        <Btn id="nav-contact-btn" variant="ghost" size="sm" onClick={onContactClick}>
          Contact Us
        </Btn>

        {user && (
          <>
            <Avatar name={user.fullName} size={32} />
            <div className="leading-tight">
              <div className="text-sm font-medium">{user.fullName}</div>
              <div className="text-xs text-muted-foreground">{user.email}</div>
            </div>
            <Btn variant="secondary" size="sm" onClick={logout}>Sign out</Btn>
          </>
        )}
      </div>
    </nav>
  );
}
