export default function StatCard({ label, value, sub }) {
  return (
    <div className="rounded-[10px] bg-secondary px-5 py-4">
      <div className="mb-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-[1.7rem] font-bold leading-none text-foreground">{value}</div>
      {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}
