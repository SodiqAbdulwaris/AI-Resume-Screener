import { COLORS } from "../../constants/colors";

export default function FormField({ label, children, hint }) {
  return (
    <div style={{ marginBottom: "1rem" }}>
      {label && (
        <label style={{ display: "block", fontSize: 12, color: COLORS.text2, marginBottom: "0.4rem", fontWeight: 500 }}>
          {label}
          {hint && <span style={{ color: COLORS.text3, fontWeight: 400, marginLeft: 6 }}>{hint}</span>}
        </label>
      )}
      {children}
    </div>
  );
}
