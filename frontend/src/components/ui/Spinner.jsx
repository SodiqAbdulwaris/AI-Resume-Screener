export default function Spinner({ size = 18, color = "currentColor" }) {
  return (
    <span
      className="inline-block rounded-full border-2 border-current/15"
      style={{ width: size, height: size, borderTopColor: color, animation: "spin 0.65s linear infinite" }}
    />
  );
}
