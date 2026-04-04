"use client";

import { PortfolioSidebarBody } from "@/components/layout/PortfolioSidebarBody";

export function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-border-subtle bg-[#080B12]/60 lg:block">
      <div className="flex h-full flex-col gap-3 p-4">
        <PortfolioSidebarBody />
      </div>
    </aside>
  );
}
