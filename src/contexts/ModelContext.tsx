
"use client";

import type { ReactNode } from "react";
import { type Model, ModelContextType } from "@/ai/model";
import { createContext, useContext, useState }
  from "react";

const ModelContext = createContext<ModelContextType | undefined>(undefined);

export function ModelProvider({ children }: { children: ReactNode }) {
  const [selectedModel, setSelectedModel] = useState<Model>("gemini-flash"); // Default to Gemini Flash

  return (
    <ModelContext.Provider value={{ selectedModel, setSelectedModel }}>
      {children}
    </ModelContext.Provider>
  );
}

export function useModel(): ModelContextType {
  const context = useContext(ModelContext);
  if (context === undefined) {
    throw new Error("useModel must be used within a ModelProvider");
  }
  return context;
}
