"use client";

import { createContext, useContext, ReactNode } from "react";

interface ReadOnlyContextType {
  isReadOnly: boolean;
}

const ReadOnlyContext = createContext<ReadOnlyContextType>({ isReadOnly: false });

export function ReadOnlyProvider({ 
  children, 
  isReadOnly 
}: { 
  children: ReactNode; 
  isReadOnly: boolean;
}) {
  return (
    <ReadOnlyContext.Provider value={{ isReadOnly }}>
      {children}
    </ReadOnlyContext.Provider>
  );
}

export function useReadOnly() {
  return useContext(ReadOnlyContext);
}
