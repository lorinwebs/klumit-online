'use client';

import { createContext, useContext, ReactNode } from 'react';

const SaleContext = createContext(false);

export function SaleProvider({ hasSale, children }: { hasSale: boolean; children: ReactNode }) {
  return <SaleContext.Provider value={hasSale}>{children}</SaleContext.Provider>;
}

export function useHasSale() {
  return useContext(SaleContext);
}
