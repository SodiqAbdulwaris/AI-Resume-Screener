export default function Alert({ message, variant = "error" }) {
  if (!message) return null;
  const v = {
    error: { bg: "rgba(239,68,68,0.09)", border: "rgba(239,68,68,0.2)", color: "#f87171" },
    success: { bg: "rgba(34,197,94,0.09)", border: "rgba(34,197,94,0.2)", color: "#4ade80" },
    warning: { bg: "rgba(245,158,11,0.09)", border: "rgba(245,158,11,0.2)", color: "#fbbf24" },
  };
  const style = v[variant] || v.error;
  return (
    <div
      style={{
        padding: "10px 14px",
        borderRadius: 8,
        fontSize: 13,
        background: style.bg,
        border: `1px solid ${style.border}`,
        color: style.color,
        marginBottom: "1rem",
      }}
    >
      {message}
    </div>
  );
}
