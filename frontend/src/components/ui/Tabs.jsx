export default function Tabs({ tabs, active, onChange }) {
  return (
    <div className="mb-6 flex w-fit gap-1 rounded-lg bg-secondary p-1">
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={`rounded-md px-4 py-1.5 text-sm font-medium transition-all ${
            active === t.key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {t.label}
          {t.count != null && (
            <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-xs">{t.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}
