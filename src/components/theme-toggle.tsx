"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button
        variant="outline"
        size="icon"
        className="bg-background/80 backdrop-blur-sm supports-[backdrop-filter]:bg-background/60 hover:bg-accent/70"
      />
    );
  }

  return (
    <Button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      variant="outline"
      size="icon"
      className={cn(
        "bg-background/80 backdrop-blur-sm supports-[backdrop-filter]:bg-background/60 hover:bg-accent/70"
      )}
    >
      {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}