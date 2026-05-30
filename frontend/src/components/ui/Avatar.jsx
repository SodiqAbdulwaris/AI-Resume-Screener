import { COLORS } from "../../constants/colors";

function initials(name = "") {
  return name.split(" ").slice(0, 2).map((w) => w[0] || "").join("").toUpperCase();
}

export default function Avatar({ name, size = 36, gradient }) {
  const bg = gradient || `linear-gradient(135deg, ${COLORS.accent}, #8b5cf6)`;
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.36,
        fontWeight: 600,
        color: "#fff",
        flexShrink: 0,
        letterSpacing: "0.03em",
      }}
    >
      {initials(name)}
    </div>
  );
}
