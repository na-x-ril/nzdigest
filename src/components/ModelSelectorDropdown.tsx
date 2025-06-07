
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
import { useModel, type Model } from "@/contexts/ModelContext"; 
import { cn } from "@/lib/utils";

export function ModelSelectorDropdown() {
  const { selectedModel, setSelectedModel } = useModel();
 
  const geminiFlash = "gemini-flash" as const;
  const llama3Groq70b = 'llama3-70b-8192' as const; 
  const llama4Scout = 'meta-llama/llama-4-scout-17b-16e-instruct' as const;
  const deepseekR1 = 'deepseek-r1-distill-llama-70b' as const;
  const qwenQwq = 'qwen-qwq-32b' as const;

  const modelDisplayNames: Record<Model, string> = {
    [geminiFlash]: "gemini-flash",
    [llama3Groq70b]: "llama3-70b-8192", 
    [llama4Scout]: "meta-llama/llama-4-scout-17b-16e-instruct",
    [deepseekR1]: "deepseek-r1-distill-llama-70b",
    [qwenQwq]: "qwen-qwq-32b",
  };

  const modelIcons: Record<Model, React.ElementType> = {
    [geminiFlash]: ZapIcon,
    [llama3Groq70b]: BrainCircuitIcon, 
    [llama4Scout]: BrainCircuitIcon,
    [deepseekR1]: BrainCircuitIcon,
    [qwenQwq]: BrainCircuitIcon,
  };

  const CurrentModelIcon = modelIcons[selectedModel] || ZapIcon; 

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          className={cn(
            "flex items-center gap-2 pl-3 pr-2 h-10",
            "max-w-[130px] sm:max-w-none", // Constrain width on mobile, allow expansion on sm+
            "bg-background/80 backdrop-blur-sm supports-[backdrop-filter]:bg-background/60 hover:bg-accent/70"
          )}
        >
          <CurrentModelIcon className="h-4 w-4 flex-shrink-0" />
          <span className="truncate min-w-0"> {/* Ensures text truncates if button width is constrained */}
            {modelDisplayNames[selectedModel] || selectedModel}
          </span>
          <ChevronDownIcon className="h-4 w-4 opacity-70 flex-shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        className={cn(
          "w-80", 
          "bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/70 text-foreground border-border/70" 
        )}
      >
        <DropdownMenuLabel>Pilih Model AI</DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-border/50" />
        <DropdownMenuRadioGroup
          value={selectedModel}
          onValueChange={(value) => setSelectedModel(value as Model)}
        >
          <DropdownMenuRadioItem value={geminiFlash} className="flex items-center gap-2.5 cursor-pointer py-2 focus:bg-accent/60">
            <ZapIcon className="h-4 w-4 text-primary" />
            <span>{modelDisplayNames[geminiFlash]}</span>
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value={llama3Groq70b} className="flex items-center gap-2.5 cursor-pointer py-2 focus:bg-accent/60">
            <BrainCircuitIcon className="h-4 w-4 text-primary" />
            <span>{modelDisplayNames[llama3Groq70b]}</span>
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value={llama4Scout} className="flex items-center gap-2.5 cursor-pointer py-2 focus:bg-accent/60">
            <BrainCircuitIcon className="h-4 w-4 text-primary" />
            <span>{modelDisplayNames[llama4Scout]}</span>
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value={deepseekR1} className="flex items-center gap-2.5 cursor-pointer py-2 focus:bg-accent/60">
            <BrainCircuitIcon className="h-4 w-4 text-primary" />
            <span>{modelDisplayNames[deepseekR1]}</span>
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value={qwenQwq} className="flex items-center gap-2.5 cursor-pointer py-2 focus:bg-accent/60">
            <BrainCircuitIcon className="h-4 w-4 text-primary" />
            <span>{modelDisplayNames[qwenQwq]}</span>
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
