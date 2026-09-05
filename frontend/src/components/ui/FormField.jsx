export default function FormField({ label, children, hint }) {
  return (
    <div className="mb-4">
      {label && (
        <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
          {label}
          {hint && <span className="ml-1.5 font-normal text-muted-foreground/70">{hint}</span>}
        </label>
      )}
      {children}
    </div>
  );
}
