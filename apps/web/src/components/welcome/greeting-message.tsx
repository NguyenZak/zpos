"use client";

import { RealtimeClock } from "./realtime-clock";

type GreetingMessageProps = {
  userName?: string;
  tenantName: string;
  branchName?: string;
  welcomeMessage?: string;
};

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 11) return "Chào buổi sáng";
  if (hour < 18) return "Chào buổi chiều";
  return "Chào buổi tối";
}

export function GreetingMessage({ userName, tenantName, branchName, welcomeMessage }: GreetingMessageProps) {
  return (
    <div className="mx-auto w-full max-w-[min(96vw,1500px)] text-center">
      <div className="mb-7 flex items-center justify-center">
        <RealtimeClock />
      </div>
      <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-300/90">
        {getGreeting()}{userName ? `, ${userName}` : ""}
      </p>
      <h1 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-slate-50 sm:text-5xl">
        {tenantName}
      </h1>
      {branchName ? (
        <p className="mt-3 text-sm font-medium text-slate-300">{branchName}</p>
      ) : null}
      <p className="mx-auto mt-8 w-full max-w-[min(96vw,1500px)] text-balance text-[clamp(2rem,7vw,3rem)] font-semibold leading-[1.05] text-slate-100">
        {welcomeMessage || "Chúc một ngày kinh doanh thuận lợi, bùng nổ doanh thu."}
      </p>
    </div>
  );
}
