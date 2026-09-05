const VARIANTS = {
  gray: "bg-white/[0.07] text-muted-foreground",
  blue: "bg-primary/15 text-[#a5b4fc]",
  green: "bg-emerald-500/15 text-emerald-400",
  yellow: "bg-amber-500/15 text-amber-400",
  red: "bg-red-500/15 text-red-400",
  teal: "bg-teal-500/15 text-teal-400",
};

export default function Badge({ children, variant = "gray", className, style, ...props }) {
  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${VARIANTS[variant] || VARIANTS.gray} ${className || ""}`}
      style={style}
      {...props}
    >
      {children}
    </span>
  );
}
