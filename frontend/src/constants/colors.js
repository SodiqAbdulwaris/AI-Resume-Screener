// References the CSS custom properties defined in styles/global.css (light on
// :root, dark on .dark) so every screen still using inline COLORS.* styles
// stays theme-aware without waiting for its own Tailwind conversion pass.
export const COLORS = {
  bg: "var(--background)",
  bg2: "var(--sidebar)",
  bg3: "var(--secondary)",
  card: "var(--card)",
  cardHover: "var(--accent)",
  border: "var(--border)",
  border2: "var(--border)",
  text: "var(--foreground)",
  text2: "var(--muted-foreground)",
  text3: "var(--muted-foreground)",
  accent: "var(--primary)",
  accentHover: "var(--ring)",
  accentGlow: "color-mix(in srgb, var(--primary) 15%, transparent)",
  success: "#16a34a",
  warning: "#d97706",
  danger: "var(--destructive)",
  teal: "#14b8a6",
};
