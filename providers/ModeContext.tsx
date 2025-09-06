import React, { createContext, useContext, useMemo, useState } from "react";

export type Mode = "lifting" | "basketball" | "football" | "running" | "baseball" | "soccer" | "hockey";
type ModeContextType = {
  mode: Mode;
  setMode: (m: Mode) => void;
};

const ModeContext = createContext<ModeContextType | undefined>(undefined);

export function ModeProvider({ children }: { children: React.ReactNode }) {
  // Default to lifting; we can persist this later with AsyncStorage
  const [mode, setMode] = useState<Mode>("lifting");
  const value = useMemo(() => ({ mode, setMode }), [mode]);
  return <ModeContext.Provider value={value}>{children}</ModeContext.Provider>;
}

export function useMode() {
  const ctx = useContext(ModeContext);
  if (!ctx) throw new Error("useMode must be used within a ModeProvider");
  return ctx;
}
