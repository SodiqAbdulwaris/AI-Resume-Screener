const VARIANTS = {
  gray: "bg-muted text-muted-foreground",
  blue: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
  green: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  yellow: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  red: "bg-red-500/15 text-red-700 dark:text-red-300",
  teal: "bg-primary/15 text-primary",
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
