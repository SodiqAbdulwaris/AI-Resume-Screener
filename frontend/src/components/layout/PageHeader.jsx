export default function PageHeader({ title, subtitle }) {
  return (
    <div className="fade-up mb-8">
      <h2 className="mb-1 text-[1.75rem] font-bold leading-tight tracking-tight text-foreground sm:text-[2rem]">
        {title}
      </h2>
      {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
    </div>
  );
}
