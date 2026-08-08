"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { getAllTools } from "@/lib/tools/registry";
import { ToolCategory } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Zap, Calculator, BatteryCharging, Route, Search } from "lucide-react";

const ICON_MAP: Record<string, React.ElementType> = {
  Zap,
  Calculator,
  BatteryCharging,
  Route,
};

interface CommandSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandSearch({ open, onOpenChange }: CommandSearchProps) {
  const router = useRouter();
  const tools = getAllTools();

  // Group tools by category
  const categories = Array.from(new Set(tools.map((t) => t.category))) as ToolCategory[];

  const handleSelectTool = (slug: string) => {
    onOpenChange(false);
    router.push(`/tools/${slug}`);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} title="Search Tools" description="Type to search for EV tools, calculations, or features">
      <CommandInput placeholder="Search tools (e.g. detour, charger, efficiency)..." />
      <CommandList className="max-h-[350px] p-2">
        <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
          No matching tools found.
        </CommandEmpty>

        {categories.map((category) => {
          const categoryTools = tools.filter((t) => t.category === category);
          if (categoryTools.length === 0) return null;

          return (
            <CommandGroup key={category} heading={category}>
              {categoryTools.map((tool) => {
                const IconComponent = ICON_MAP[tool.iconName] || Search;
                const isImplemented = tool.implemented;

                return (
                  <CommandItem
                    key={tool.id}
                    value={`${tool.name} ${tool.description} ${tool.keywords.join(" ")}`}
                    disabled={!isImplemented}
                    onSelect={isImplemented ? () => handleSelectTool(tool.id) : undefined}
                    className={`flex items-center gap-3 p-2.5 rounded-lg ${
                      isImplemented
                        ? "cursor-pointer hover:bg-accent"
                        : "cursor-not-allowed opacity-50 select-none data-[disabled=true]:opacity-50"
                    }`}
                  >
                    <div
                      className={`flex size-8 shrink-0 items-center justify-center rounded-md ${
                        isImplemented ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <IconComponent className="size-4" />
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`font-medium text-sm truncate ${!isImplemented ? "text-muted-foreground" : ""}`}>
                          {tool.name}
                        </span>
                        {tool.featured && isImplemented && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 font-normal">
                            Featured
                          </Badge>
                        )}
                        {!isImplemented && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 font-normal text-muted-foreground border-muted-foreground/30">
                            Disabled
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground truncate">{tool.description}</span>
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          );
        })}
      </CommandList>
    </CommandDialog>
  );
}
