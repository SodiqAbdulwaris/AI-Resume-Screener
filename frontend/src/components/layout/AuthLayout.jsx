export default function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-8">
      <div
        className="pointer-events-none absolute left-1/2 top-[20%] h-[400px] w-[600px] -translate-x-1/2"
        style={{ background: "radial-gradient(ellipse, color-mix(in srgb, var(--primary) 10%, transparent) 0%, transparent 70%)" }}
      />
      <div className="fade-up relative w-full max-w-[400px]">
        <div className="mb-10 text-center">
          <h1 className="text-[2.2rem] font-bold tracking-tight text-foreground">{title}</h1>
          {subtitle && <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        <div className="rounded-xl border border-border bg-card p-7">{children}</div>
      </div>
    </div>
  );
}
