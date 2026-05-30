export default function Spinner({ size = 18, color = "#fff" }) {
  return (
    <span
      style={{
        display: "inline-block",
        width: size,
        height: size,
        border: `2px solid rgba(255,255,255,0.15)`,
        borderTopColor: color,
        borderRadius: "50%",
        animation: "spin 0.65s linear infinite",
      }}
    />
  );
}
