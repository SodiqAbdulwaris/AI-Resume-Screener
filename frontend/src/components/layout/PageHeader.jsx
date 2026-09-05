import { COLORS } from "../../constants/colors";

export default function PageHeader({ title, subtitle }) {
  return (
    <div style={{ marginBottom: "2rem" }} className="fade-up">
      <h2
        style={{
          fontFamily: "'Geist Variable', sans-serif",
          fontSize: "2rem",
          fontWeight: 700,
          letterSpacing: "-0.02em",
          color: COLORS.text,
          marginBottom: "0.3rem",
          lineHeight: 1.15,
        }}
      >
        {title}
      </h2>
      {subtitle && <p style={{ color: COLORS.text2, fontSize: 14 }}>{subtitle}</p>}
    </div>
  );
}
