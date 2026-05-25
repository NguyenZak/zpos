"use client";

import * as React from "react";

function FlipDigit({ value }: { value: string }) {
  return (
    <span className="relative grid h-12 w-9 place-items-center overflow-hidden rounded-lg border border-white/10 bg-[oklch(0.24_0.01_255)] text-3xl font-black leading-none text-slate-100 shadow-[0_12px_30px_rgba(0,0,0,0.34),inset_0_1px_0_rgba(255,255,255,0.08)] sm:h-16 sm:w-12 sm:text-5xl">
      <span className="absolute inset-x-0 top-0 h-1/2 bg-white/[0.035]" />
      <span className="absolute inset-x-0 top-1/2 h-px bg-black/55" />
      <span className="absolute inset-x-0 bottom-0 h-1/2 bg-black/[0.1]" />
      <span className="relative z-10 drop-shadow-[0_2px_2px_rgba(0,0,0,0.55)]">{value}</span>
    </span>
  );
}

function FlipPair({ value }: { value: string }) {
  return (
    <span className="flex gap-1.5 sm:gap-2">
      {value.split("").map((digit, index) => (
        <FlipDigit key={`${index}-${digit}`} value={digit} />
      ))}
    </span>
  );
}

function Separator() {
  return (
    <span className="flex h-12 flex-col items-center justify-center gap-2 px-0.5 sm:h-16 sm:gap-3 sm:px-1">
      <span className="h-1.5 w-1.5 rounded-full bg-slate-500 sm:h-2 sm:w-2" />
      <span className="h-1.5 w-1.5 rounded-full bg-slate-500 sm:h-2 sm:w-2" />
    </span>
  );
}

export function RealtimeClock() {
  const [now, setNow] = React.useState(() => new Date());

  React.useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const hours24 = now.getHours();
  const period = hours24 >= 12 ? "PM" : "AM";
  const hours12 = hours24 % 12 || 12;
  const hours = String(hours12).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");

  return (
    <time
      className="flex items-center justify-center gap-2 font-mono tabular-nums sm:gap-3"
      dateTime={now.toISOString()}
      aria-label={now.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
    >
      <FlipPair value={hours} />
      <Separator />
      <FlipPair value={minutes} />
      <Separator />
      <FlipPair value={seconds} />
      <span className="ml-1 text-3xl font-black tracking-wide text-slate-500 sm:ml-3 sm:text-5xl">{period}</span>
    </time>
  );
}
