export function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function initials(name = "") {
  return name.split(" ").slice(0, 2).map((w) => w[0] || "").join("").toUpperCase();
}
