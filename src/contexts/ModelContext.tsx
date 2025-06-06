
"use client";

import type { Dispatch, ReactNode, SetStateAction } from "react";
import { createContext, useContext, useState }
  from "react";

// Define the possible model types
export type Model = "gemini-flash" | "llama3-groq";

interface ModelContextType {
  selectedModel: Model;
  setSelectedModel: Dispatch<SetStateAction<Model>>;
}

const ModelContext = createContext<ModelContextType | undefined>(undefined);

export function ModelProvider({ children }: { children: ReactNode }) {
  const [selectedModel, setSelectedModel] = useState<Model>("gemini-flash"); // Default to Gemini Flash

  return (
    <ModelContext.Provider value={{ selectedModel, setSelectedModel }}>
      {children}
    </ModelContext.Provider>
  );
}

export function useModel() {
  const context = useContext(ModelContext);
  if (context === undefined) {
    throw new Error("useModel must be used within a ModelProvider");
  }
  return context;
}
