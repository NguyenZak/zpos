"use client";

import React from "react";
import { ChartAreaInteractive } from "../(legacy)/default-v1/_components/chart-area-interactive";
import data from "../(legacy)/default-v1/_components/data.json";
import { ProposalSectionsTable } from "../(legacy)/default-v1/_components/proposal-sections-table/table";
import { SectionCards } from "../(legacy)/default-v1/_components/section-cards";

export default function DashboardPage() {
  return (
    <div className="@container/main flex flex-col gap-3 md:gap-4 animate-in fade-in duration-500 pb-8">
      <SectionCards />
      <ChartAreaInteractive />
      <ProposalSectionsTable data={data} />
    </div>
  );
}
