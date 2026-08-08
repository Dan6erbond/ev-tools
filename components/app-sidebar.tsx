"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getAllTools } from "@/lib/tools/registry";
import { ToolCategory } from "@/lib/types";
import { useSettings } from "@/components/settings-context";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import {
  LayoutGrid,
  Zap,
  Calculator,
  BatteryCharging,
  Route,
  Car,
  SlidersHorizontal,
} from "lucide-react";

const ICON_MAP: Record<string, React.ElementType> = {
  Zap,
  Calculator,
  BatteryCharging,
  Route,
};

export function AppSidebar() {
  const pathname = usePathname();
  const tools = getAllTools();
  const { activeVehicle } = useSettings();
  const categories: ToolCategory[] = ["Charging & Savings", "Trips & Range", "Utilities"];

  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader className="border-b px-4 py-3">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-700 text-white shadow-xs group-hover:scale-105 transition-transform">
            <Zap className="size-4 fill-current" />
          </div>
          <div className="flex flex-col truncate group-data-[collapsible=icon]:hidden">
            <span className="font-bold text-base leading-none">EV Tools</span>
            <span className="text-[10px] text-muted-foreground font-mono">ev-tools.tech</span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {/* Overview Section */}
        <SidebarGroup>
          <SidebarGroupLabel>Overview</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton render={<Link href="/" />} isActive={pathname === "/"} tooltip="All Tools">
                  <LayoutGrid className="size-4" />
                  <span>All Tools</span>
                  <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 py-0 h-4 group-data-[collapsible=icon]:hidden">
                    {tools.length}
                  </Badge>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Categorized Tools */}
        {categories.map((category) => {
          const categoryTools = tools.filter((t) => t.category === category);
          if (categoryTools.length === 0) return null;

          return (
            <SidebarGroup key={category}>
              <SidebarGroupLabel>{category}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {categoryTools.map((tool) => {
                    const href = `/tools/${tool.id}`;
                    const isActive = pathname === href;
                    const Icon = ICON_MAP[tool.iconName] || Zap;
                    const isImplemented = tool.implemented;

                    if (!isImplemented) {
                      return (
                        <SidebarMenuItem key={tool.id}>
                          <SidebarMenuButton
                            disabled
                            tooltip={`${tool.name} (Coming Soon)`}
                            className="opacity-50 cursor-not-allowed text-muted-foreground select-none hover:bg-transparent"
                          >
                            <Icon className="size-4 opacity-70" />
                            <span className="truncate">{tool.name}</span>
                            <Badge variant="outline" className="ml-auto text-[9px] px-1 py-0 h-3.5 text-muted-foreground border-muted-foreground/30 font-normal group-data-[collapsible=icon]:hidden">
                              Soon
                            </Badge>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    }

                    return (
                      <SidebarMenuItem key={tool.id}>
                        <SidebarMenuButton render={<Link href={href} />} isActive={isActive} tooltip={tool.name}>
                          <Icon className="size-4" />
                          <span className="truncate">{tool.name}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </SidebarContent>

      <SidebarFooter className="border-t p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton render={<Link href="/profile" />} isActive={pathname === "/profile"} tooltip="Vehicle Garage & Units" className="h-auto py-2.5 px-3">
              <SlidersHorizontal className="size-4 text-emerald-500 shrink-0" />
              <div className="flex flex-col text-left truncate group-data-[collapsible=icon]:hidden">
                <span className="font-semibold text-xs truncate">{activeVehicle?.name || "No Vehicle"}</span>
                <span className="text-[10px] text-muted-foreground">Profile & Garage</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
