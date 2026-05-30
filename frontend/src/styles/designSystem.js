import { COLORS } from "../constants/colors";

export const s = {
  card: {
    background: COLORS.card,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 14,
    padding: "1.5rem",
  },
  cardHoverable: {
    background: COLORS.card,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 14,
    padding: "1.25rem",
    transition: "border-color 0.2s, background 0.2s, transform 0.15s",
    cursor: "default",
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: COLORS.text3,
    marginBottom: "0.75rem",
  },
  tag: {
    display: "inline-flex",
    alignItems: "center",
    padding: "3px 10px",
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 500,
    background: COLORS.bg3,
    border: `1px solid ${COLORS.border2}`,
    color: COLORS.text2,
  },
};
