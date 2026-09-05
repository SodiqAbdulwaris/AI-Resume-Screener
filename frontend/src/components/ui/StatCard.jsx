import { COLORS } from "../../constants/colors";

export default function StatCard({ label, value, sub }) {
  return (
    <div style={{ background: COLORS.bg3, borderRadius: 10, padding: "1rem 1.25rem" }}>
      <div style={{ fontSize: 11, color: COLORS.text3, marginBottom: 4, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</div>
      <div style={{ fontSize: "1.7rem", fontFamily: "'Geist Variable', sans-serif", fontWeight: 700, color: COLORS.text, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: COLORS.text3, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}
