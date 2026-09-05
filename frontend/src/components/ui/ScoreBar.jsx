export function scoreColor(v) {
  if (v >= 0.7) return "#22c55e";
  if (v >= 0.4) return "#f59e0b";
  return "#ef4444";
}

export default function ScoreBar({ value, color }) {
  return (
    <div className="h-[5px] overflow-hidden rounded-full bg-muted">
      <div
        className="h-full rounded-full"
        style={{ width: `${Math.round(value * 100)}%`, background: color || scoreColor(value), animation: "scoreIn 0.9s ease" }}
      />
    </div>
  );
}
