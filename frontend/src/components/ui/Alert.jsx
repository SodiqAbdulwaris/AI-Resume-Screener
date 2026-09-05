const VARIANTS = {
  error: "bg-red-500/[0.09] border-red-500/20 text-red-400",
  success: "bg-emerald-500/[0.09] border-emerald-500/20 text-emerald-400",
  warning: "bg-amber-500/[0.09] border-amber-500/20 text-amber-400",
};

export default function Alert({ message, variant = "error" }) {
  if (!message) return null;
  return (
    <div className={`mb-4 rounded-lg border px-3.5 py-2.5 text-sm ${VARIANTS[variant] || VARIANTS.error}`}>
      {message}
    </div>
  );
}
