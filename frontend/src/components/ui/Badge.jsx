import { COLORS } from "../../constants/colors";

export default function Badge({ children, variant = "gray", style }) {
  const variants = {
    gray: { bg: "rgba(255,255,255,0.07)", color: COLORS.text2 },
    blue: { bg: "rgba(99,102,241,0.15)", color: "#a5b4fc" },
    green: { bg: "rgba(34,197,94,0.13)", color: "#4ade80" },
    yellow: { bg: "rgba(245,158,11,0.13)", color: "#fbbf24" },
    red: { bg: "rgba(239,68,68,0.13)", color: "#f87171" },
    teal: { bg: "rgba(20,184,166,0.13)", color: "#2dd4bf" },
  };
  const v = variants[variant] || variants.gray;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "3px 10px",
        borderRadius: 20,
        fontSize: 11,
        fontWeight: 600,
        background: v.bg,
        color: v.color,
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {children}
    </span>
  );
}
