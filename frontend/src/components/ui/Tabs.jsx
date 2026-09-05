import { COLORS } from "../../constants/colors";

export default function Tabs({ tabs, active, onChange }) {
  return (
    <div
      style={{
        display: "flex",
        gap: 4,
        background: COLORS.bg2,
        borderRadius: 10,
        padding: 4,
        width: "fit-content",
        marginBottom: "1.5rem",
      }}
    >
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          style={{
            padding: "7px 16px",
            borderRadius: 7,
            background: active === t.key ? COLORS.card : "transparent",
            color: active === t.key ? COLORS.text : COLORS.text2,
            fontSize: 13,
            fontWeight: 500,
            cursor: "pointer",
            border: "none",
            fontFamily: "'Geist Variable', sans-serif",
            transition: "all 0.18s",
            boxShadow: active === t.key ? "0 1px 4px rgba(0,0,0,0.3)" : "none",
          }}
        >
          {t.label}
          {t.count != null && (
            <span style={{ marginLeft: 6, background: COLORS.bg3, borderRadius: 10, padding: "1px 7px", fontSize: 11 }}>
              {t.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
