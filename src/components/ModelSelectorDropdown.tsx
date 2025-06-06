
"use client";

import * as React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDownIcon, ZapIcon, BrainCircuitIcon } from "lucide-react";
import { useModel, type Model } from "@/contexts/ModelContext"; // Ensure type Model is imported

export function ModelSelectorDropdown() {
  const { selectedModel, setSelectedModel } = useModel();
 
  // Define the model values
  const llama3Groq70b = 'llama3-70b-8192' as const; // Corrected LLaMA3 identifier
  const llama4Scout = 'meta-llama/llama-4-scout-17b-16e-instruct' as const;
  const deepseekR1 = 'deepseek-r1-distill-llama-70b' as const;
  const qwenQwq = 'qwen-qwq-32b' as const;

  const modelDisplayNames: Record<Model, string> = {
    "gemini-flash": "Gemini Flash (Genkit)",
    [llama3Groq70b]: "LLaMA3 70B (Groq)", // Updated key and display name
    [llama4Scout]: "LLaMA 4 Scout (Groq)",
    [deepseekR1]: "Deepseek R1 (Groq)",
    [qwenQwq]: "Qwen QWQ (Groq)",
  };

  const modelIcons: Record<Model, React.ElementType> = {
    "gemini-flash": ZapIcon,
    [llama3Groq70b]: BrainCircuitIcon, // Updated key
    [llama4Scout]: BrainCircuitIcon,
    [deepseekR1]: BrainCircuitIcon,
    [qwenQwq]: BrainCircuitIcon,
  };

  const CurrentModelIcon = modelIcons[selectedModel] || ZapIcon; // Fallback icon

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2 pl-3 pr-2 h-10">
          <CurrentModelIcon className="h-4 w-4" />
          <span className="text-sm font-medium">{modelDisplayNames[selectedModel] || selectedModel}</span>
          <ChevronDownIcon className="h-4 w-4 opacity-70" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-60">
        <DropdownMenuLabel>Pilih Model AI</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup
          value={selectedModel}
          onValueChange={(value) => setSelectedModel(value as Model)}
        >
          <DropdownMenuRadioItem value="gemini-flash" className="flex items-center gap-2.5 cursor-pointer py-2">
            <ZapIcon className="h-4 w-4 text-primary" />
            <span>{modelDisplayNames["gemini-flash"]}</span>
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value={llama3Groq70b} className="flex items-center gap-2.5 cursor-pointer py-2">
            <BrainCircuitIcon className="h-4 w-4 text-primary" />
            <span>{modelDisplayNames[llama3Groq70b]}</span>
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value={llama4Scout} className="flex items-center gap-2.5 cursor-pointer py-2">
            <BrainCircuitIcon className="h-4 w-4 text-primary" />
            <span>{modelDisplayNames[llama4Scout]}</span>
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value={deepseekR1} className="flex items-center gap-2.5 cursor-pointer py-2">
            <BrainCircuitIcon className="h-4 w-4 text-primary" />
            <span>{modelDisplayNames[deepseekR1]}</span>
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value={qwenQwq} className="flex items-center gap-2.5 cursor-pointer py-2">
            <BrainCircuitIcon className="h-4 w-4 text-primary" />
            <span>{modelDisplayNames[qwenQwq]}</span>
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
