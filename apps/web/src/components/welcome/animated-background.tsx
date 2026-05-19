export function AnimatedBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-[oklch(0.18_0.018_255)]">
      <div
        className="absolute inset-0 opacity-[0.16]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.16) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.16) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(12,18,30,0.48) 0%, rgba(12,18,30,0.18) 44%, rgba(8,12,20,0.72) 100%), radial-gradient(circle at 50% 0%, rgba(38,84,124,0.28), transparent 52%)",
        }}
      />
      <div className="absolute inset-x-0 top-0 h-px bg-white/15" />
      <div className="absolute inset-x-10 bottom-10 h-px bg-white/10" />
    </div>
  );
}
