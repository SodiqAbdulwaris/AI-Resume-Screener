import { COLORS } from "../../constants/colors";

export function scoreColor(v) {
  if (v >= 0.7) return COLORS.success;
  if (v >= 0.4) return COLORS.warning;
  return COLORS.danger;
}

export default function ScoreBar({ value, color }) {
  return (
    <div style={{ background: COLORS.bg3, borderRadius: 20, height: 5, overflow: "hidden" }}>
      <div
        style={{
          height: "100%",
          width: `${Math.round(value * 100)}%`,
          background: color || scoreColor(value),
          borderRadius: 20,
          animation: "scoreIn 0.9s ease",
        }}
      />
    </div>
  );
}
