"use client";

import React, { useState } from "react";
import Link from "next/link";
import { getAllTools } from "@/lib/tools/registry";
import { ToolCategory } from "@/lib/types";
import { useSettings } from "@/components/settings-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Zap,
  Calculator,
  BatteryCharging,
  Route,
  Search,
  ArrowRight,
  Sparkles,
  Car,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { formatEfficiency } from "@/lib/units";

const ICON_MAP: Record<string, React.ElementType> = {
  Zap,
  Calculator,
  BatteryCharging,
  Route,
};

export default function HomePage() {
  const tools = getAllTools();
  const { activeVehicle, settings, isLoaded } = useSettings();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const filteredTools = tools.filter((tool) => {
    const matchesCategory = selectedCategory === "all" || tool.category === selectedCategory;
    const matchesQuery =
      !searchQuery.trim() ||
      tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.keywords.some((k) => k.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesQuery;
  });

  const featuredTool = tools.find((t) => t.id === "detour-calculator") || tools[0];

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4 flex flex-col gap-10">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-emerald-500/10 via-background to-teal-500/5 p-6 sm:p-10 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
          <div className="flex flex-col gap-3 max-w-2xl">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 px-2.5 py-0.5 text-xs font-semibold">
                Open Source EV Utilities
              </Badge>
              <span className="text-xs text-muted-foreground">•</span>
              <span className="text-xs text-muted-foreground">Inspired by IT-Tools</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
              Essential Online Tools for <span className="text-emerald-600 dark:text-emerald-400">EV Owners</span>
            </h1>

            <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
              Calculate detour charger savings, trip energy costs, charging curves, and consumption conversions customized for your electric vehicle.
            </p>

            {/* Active Vehicle Badge Pill */}
            {isLoaded && (
              <div className="flex items-center gap-2 mt-2 pt-2 border-t text-xs text-muted-foreground">
                <Car className="size-4 text-emerald-500 shrink-0" />
                {activeVehicle ? (
                  <>
                    <span>Active Vehicle:</span>
                    <span className="font-semibold text-foreground">{activeVehicle.name}</span>
                    <span>({activeVehicle.batteryCapacityKwh} kWh)</span>
                    <span>•</span>
                    <span>{formatEfficiency(activeVehicle.efficiencyValue, activeVehicle.efficiencyUnit)}</span>
                    <Link href="/profile" className="text-primary underline hover:text-primary/80 ml-1">
                      Change
                    </Link>
                  </>
                ) : (
                  <>
                    <span>No vehicle selected.</span>
                    <Link href="/profile" className="text-primary font-medium underline hover:text-primary/80">
                      Add an EV to your garage in Profile
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Quick Featured Tool Hero Callout */}
          {featuredTool && (
            <Card className="w-full md:w-80 shrink-0 border-emerald-500/30 bg-background/80 backdrop-blur-xs shadow-md">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Badge variant="default" className="bg-emerald-600 text-white text-[10px]">
                    Featured Tool
                  </Badge>
                  <Sparkles className="size-4 text-amber-500" />
                </div>
                <CardTitle className="text-base font-bold mt-1">{featuredTool.name}</CardTitle>
              </CardHeader>
              <CardContent className="pb-4">
                <p className="text-xs text-muted-foreground line-clamp-2">{featuredTool.description}</p>
              </CardContent>
              <CardFooter>
                <Button render={<Link href={`/tools/${featuredTool.id}`} />} size="sm" className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
                  Try Calculator
                  <ArrowRight className="size-4" />
                </Button>
              </CardFooter>
            </Card>
          )}
        </div>
      </section>

      {/* Search & Filter Bar */}
      <section className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b pb-4">
        <Tabs defaultValue="all" value={selectedCategory} onValueChange={setSelectedCategory} className="w-full sm:w-auto">
          <TabsList className="w-full sm:w-auto flex flex-wrap h-auto p-1">
            <TabsTrigger value="all" className="text-xs">All Tools ({tools.length})</TabsTrigger>
            <TabsTrigger value="Charging & Savings" className="text-xs">Charging & Savings</TabsTrigger>
            <TabsTrigger value="Trips & Range" className="text-xs">Trips & Range</TabsTrigger>
            <TabsTrigger value="Utilities" className="text-xs">Utilities</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Search tools..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>
      </section>

      {/* Tools Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTools.map((tool) => {
          const IconComponent = ICON_MAP[tool.iconName] || Zap;
          const isImplemented = tool.implemented;

          return (
            <Card
              key={tool.id}
              className={`flex flex-col justify-between transition-all ${
                isImplemented
                  ? "hover:border-primary/50 hover:shadow-md group"
                  : "opacity-65 bg-muted/20 border-dashed cursor-not-allowed select-none"
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div
                    className={`flex size-10 items-center justify-center rounded-xl transition-transform ${
                      isImplemented
                        ? "bg-primary/10 text-primary group-hover:scale-105"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <IconComponent className="size-5" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    {!isImplemented && (
                      <Badge variant="outline" className="text-[10px] font-normal text-muted-foreground border-muted-foreground/30 bg-muted/50">
                        Coming Soon
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-[10px] font-normal text-muted-foreground">
                      {tool.category}
                    </Badge>
                  </div>
                </div>
                <CardTitle
                  className={`text-lg font-bold mt-3 transition-colors ${
                    isImplemented ? "group-hover:text-primary" : "text-muted-foreground"
                  }`}
                >
                  {tool.name}
                </CardTitle>
                <CardDescription className="text-xs line-clamp-3 mt-1">
                  {tool.description}
                </CardDescription>
              </CardHeader>

              <CardFooter className="pt-2 border-t mt-auto">
                {isImplemented ? (
                  <Button render={<Link href={`/tools/${tool.id}`} />} variant="ghost" size="sm" className="w-full justify-between group/btn text-xs font-semibold">
                    <span>Launch Tool</span>
                    <ArrowRight className="size-4 group-hover/btn:translate-x-1 transition-transform" />
                  </Button>
                ) : (
                  <Button disabled variant="outline" size="sm" className="w-full justify-between text-xs font-semibold cursor-not-allowed opacity-70">
                    <span>Disabled</span>
                    <Lock className="size-3.5 opacity-60" />
                  </Button>
                )}
              </CardFooter>
            </Card>
          );
        })}

        {filteredTools.length === 0 && (
          <div className="col-span-full py-12 text-center flex flex-col items-center justify-center text-muted-foreground">
            <Search className="size-10 mb-2 opacity-40" />
            <p className="text-base font-semibold">No tools found</p>
            <p className="text-xs mt-1">Try adjusting your search query or selected category.</p>
          </div>
        )}
      </section>
    </div>
  );
}
