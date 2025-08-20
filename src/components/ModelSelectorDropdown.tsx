
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
import { ChevronDownIcon, ZapIcon } from "lucide-react";
import { MODELS, type Model, modelDisplayNames, modelIcons } from "@/ai/model"; 
import { useModel } from "@/contexts/ModelContext"; 
import { cn } from "@/lib/utils";

export function ModelSelectorDropdown() {
  const { selectedModel, setSelectedModel } = useModel();
  const CurrentModelIcon = modelIcons[selectedModel] || ZapIcon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline" 
          className={cn(
            "flex items-center gap-2 pl-3 pr-2 h-10",
            "max-w-[130px] sm:max-w-none",
            "bg-background/80 backdrop-blur-sm supports-[backdrop-filter]:bg-background/60 hover:bg-accent/70"
          )}
        >
          <CurrentModelIcon className="h-4 w-4 flex-shrink-0" />
          <span className="truncate min-w-0">
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
          {MODELS.map((model) => {
            const Icon = modelIcons[model] || ZapIcon;
            return (
              <DropdownMenuRadioItem key={model} value={model} className="flex gap-2">
                <Icon className="h-4 w-4 text-primary" />
                <span>{modelDisplayNames[model]}</span>
              </DropdownMenuRadioItem>
            );
          })}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
