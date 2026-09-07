"use client";

import React, { createContext, useContext } from "react";
import type { DomainKey } from "@/lib/domain";

const DomainContext = createContext<DomainKey>("PHOTOGRAPHY");

export function DomainProvider({
  domain,
  children,
}: {
  domain: DomainKey;
  children: React.ReactNode;
}) {
  return (
    <DomainContext.Provider value={domain}>
      {children}
    </DomainContext.Provider>
  );
}

export function useDomain(): DomainKey {
  const context = useContext(DomainContext);
  if (!context) {
    return "PHOTOGRAPHY";
  }
  return context;
}
