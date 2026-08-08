"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSettings } from "@/components/settings-context";
import { CommandSearch } from "@/components/command-search";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Car, SlidersHorizontal, Zap } from "lucide-react";
import { CURRENCIES } from "@/lib/units";

export function AppHeader() {
  const { settings, activeVehicle, setActiveVehicle, isLoaded } = useSettings();
  const [searchOpen, setSearchOpen] = useState(false);
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    setIsMac(typeof window !== "undefined" && navigator.platform.toUpperCase().indexOf("MAC") >= 0);

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const currencyObj = CURRENCIES.find((c) => c.code === settings.currency);
  const currencyDisplay = currencyObj ? currencyObj.symbol : settings.currency;

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-md">
      {/* Left: Sidebar trigger + Breadcrumb / Title */}
      <div className="flex items-center gap-3 shrink-0">
        <SidebarTrigger />
        <Link href="/" className="flex items-center gap-2 font-semibold text-sm hover:opacity-80 transition-opacity">
          <Zap className="size-4 text-emerald-500 fill-current shrink-0" />
          <span>EV Tools</span>
        </Link>
      </div>

      {/* Center: Command Palette Trigger */}
      <div className="hidden sm:flex flex-1 max-w-md mx-4">
        <button
          onClick={() => setSearchOpen(true)}
          className="w-full flex items-center justify-between px-3 py-1.5 text-xs text-muted-foreground bg-muted/40 hover:bg-muted/80 border border-input/40 rounded-lg transition-colors shadow-xs"
        >
          <div className="flex items-center gap-2">
            <Search className="size-3.5 text-muted-foreground" />
            <span>Search tools (Cmd+K)...</span>
          </div>
          <kbd className="pointer-events-none inline-flex h-4 select-none items-center gap-1 rounded border bg-background px-1 font-mono text-[10px] font-medium text-muted-foreground">
            <span>{isMac ? "⌘" : "Ctrl"}</span>K
          </kbd>
        </button>
      </div>

      {/* Right: Active Vehicle Selector & Profile Link */}
      <div className="flex items-center gap-1.5 xs:gap-2 min-w-0">
        {/* Mobile search button */}
        <Button
          variant="ghost"
          size="icon"
          className="sm:hidden size-8 shrink-0"
          onClick={() => setSearchOpen(true)}
          aria-label="Search tools"
        >
          <Search className="size-4" />
        </Button>

        {/* Active Vehicle Quick Selector */}
        {isLoaded && settings.vehicles.length > 0 && (() => {
          const vehicleItems = settings.vehicles.map((v) => ({
            label: `${v.name} (${v.batteryCapacityKwh} kWh)`,
            value: v.id,
          }));
          return (
            <div className="flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-2 py-1 text-xs min-w-0 max-w-[130px] min-[380px]:max-w-[170px] sm:max-w-[260px] md:max-w-xs">
              <Car className="size-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <Select value={activeVehicle?.id} onValueChange={(val) => val && setActiveVehicle(val)} items={vehicleItems}>
                <SelectTrigger className="h-6 border-0 bg-transparent px-1 font-medium text-xs shadow-none focus:ring-0 gap-1 min-w-0 flex-1 w-full overflow-hidden">
                  <SelectValue placeholder="Select Vehicle" className="truncate min-w-0 block" />
                </SelectTrigger>
                <SelectContent align="end" className="min-w-44 max-w-[calc(100vw-2rem)]">
                  {vehicleItems.map((item) => (
                    <SelectItem key={item.value} value={item.value} className="text-xs">
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-muted-foreground shrink-0">•</span>
              <span className="text-muted-foreground font-mono shrink-0">{currencyDisplay}</span>
            </div>
          );
        })()}

        {/* Profile Link */}
        <Button variant="ghost" size="sm" render={<Link href="/profile" />} className="h-8 gap-1 text-xs shrink-0 px-2 sm:px-3">
          <SlidersHorizontal className="size-3.5" />
          <span className="hidden lg:inline">Garage & Units</span>
        </Button>
      </div>

      {/* Command Palette Modal */}
      <CommandSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </header>
  );
}
