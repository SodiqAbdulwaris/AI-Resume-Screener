import { COLORS } from "../../constants/colors";

export default function Btn({ children, variant = "primary", size = "md", type = "button", onClick, disabled, fullWidth, style: extra }) {
  const base = {
    fontFamily: "'Geist', sans-serif",
    fontWeight: 500,
    cursor: disabled ? "not-allowed" : "pointer",
    border: "none",
    borderRadius: 9,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    transition: "all 0.18s",
    opacity: disabled ? 0.55 : 1,
    width: fullWidth ? "100%" : undefined,
    ...extra,
  };
  const sizes = { sm: { padding: "6px 13px", fontSize: 13 }, md: { padding: "10px 18px", fontSize: 14 } };
  const variants = {
    primary: { background: COLORS.accent, color: "#fff" },
    secondary: { background: "transparent", color: COLORS.text2, border: `1px solid ${COLORS.border2}` },
    ghost: { background: "transparent", color: COLORS.text2 },
    danger: { background: "rgba(239,68,68,0.1)", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)" },
  };
  return (
    <button
      type={type}
      style={{ ...base, ...sizes[size], ...variants[variant] }}
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={(e) => {
        if (!disabled) {
          if (variant === "primary") e.currentTarget.style.background = COLORS.accentHover;
          else if (variant === "secondary") e.currentTarget.style.background = COLORS.bg3;
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          if (variant === "primary") e.currentTarget.style.background = COLORS.accent;
          else if (variant === "secondary") e.currentTarget.style.background = "transparent";
        }
      }}
    >
      {children}
    </button>
  );
}
