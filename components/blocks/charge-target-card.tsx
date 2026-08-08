"use client";

import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Zap } from "lucide-react";

export interface ChargeTargetState {
  chargeMode: string;
  targetKwh: number;
  targetAddedPct: number;
  socStart: number;
  socEnd: number;
}

export interface ChargeTargetCardProps {
  chargeMode: string;
  targetKwh: number;
  targetAddedPct: number;
  socStart: number;
  socEnd: number;
  batteryKwh: number;
  vehicleName?: string;
  title?: string;
  description?: string;
  maxKwh?: number;
  onStateChange: (updates: Partial<ChargeTargetState>) => void;
  breakEvenContent?: ReactNode;
}

export function ChargeTargetCard({
  chargeMode,
  targetKwh,
  targetAddedPct,
  socStart,
  socEnd,
  batteryKwh,
  vehicleName,
  title = "Charge Session Target",
  description,
  maxKwh,
  onStateChange,
  breakEvenContent,
}: ChargeTargetCardProps) {
  const maxKwhLimit = maxKwh || Math.max(120, batteryKwh);
  const activeChargeKwh =
    chargeMode === "kwh"
      ? targetKwh
      : chargeMode === "addedPct"
      ? (targetAddedPct / 100) * batteryKwh
      : chargeMode === "socRange"
      ? (Math.max(0, socEnd - socStart) / 100) * batteryKwh
      : 0;

  return (
    <Card className="shadow-xs border">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="size-4 text-primary" />
            {title}
          </CardTitle>
          {chargeMode !== "breakeven" && (
            <span className="text-xs font-mono font-bold text-primary">
              {activeChargeKwh.toFixed(1)} kWh
            </span>
          )}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Tabs
          value={chargeMode}
          onValueChange={(val) => onStateChange({ chargeMode: val })}
          className="w-full"
        >
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="kwh" className="text-xs">
              Target kWh
            </TabsTrigger>
            <TabsTrigger value="addedPct" className="text-xs">
              +% Added
            </TabsTrigger>
            <TabsTrigger value="socRange" className="text-xs">
              % Range
            </TabsTrigger>
            <TabsTrigger value="breakeven" className="text-xs">
              Break-Even
            </TabsTrigger>
          </TabsList>

          <TabsContent value="kwh" className="flex flex-col gap-3 pt-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground text-xs">Target Charge:</span>
              <span className="font-mono font-bold text-base">{targetKwh} kWh</span>
            </div>
            <Slider
              value={[targetKwh]}
              onValueChange={(val) =>
                onStateChange({ targetKwh: Array.isArray(val) ? val[0] : val })
              }
              min={5}
              max={maxKwhLimit}
              step={1}
              className="w-full"
            />
            <span className="text-[11px] text-muted-foreground text-right">
              ~{((targetKwh / batteryKwh) * 100).toFixed(0)}% of {vehicleName || "EV"} battery
            </span>
          </TabsContent>

          <TabsContent value="addedPct" className="flex flex-col gap-3 pt-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground text-xs">Add Battery %:</span>
              <span className="font-mono font-bold text-base">+{targetAddedPct}%</span>
            </div>
            <Slider
              value={[targetAddedPct]}
              onValueChange={(val) =>
                onStateChange({ targetAddedPct: Array.isArray(val) ? val[0] : val })
              }
              min={5}
              max={100}
              step={5}
              className="w-full"
            />
            <span className="text-[11px] text-muted-foreground text-right font-mono">
              = {((targetAddedPct / 100) * batteryKwh).toFixed(1)} kWh
            </span>
          </TabsContent>

          <TabsContent value="socRange" className="flex flex-col gap-4 pt-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground">SoC Range:</span>
              <span className="font-mono font-bold text-sm">
                {socStart}% → {socEnd}%
              </span>
            </div>

            <Slider
              value={[socStart, socEnd]}
              onValueChange={(val) => {
                if (Array.isArray(val) && val.length === 2) {
                  onStateChange({ socStart: val[0], socEnd: val[1] });
                }
              }}
              min={0}
              max={100}
              step={5}
              className="w-full"
            />

            <div className="flex justify-between text-xs text-muted-foreground px-1 font-mono">
              <span>Start: {socStart}%</span>
              <span>Target: {socEnd}%</span>
            </div>

            <span className="text-[11px] text-muted-foreground text-right font-mono">
              Delivers {(((socEnd - socStart) / 100) * batteryKwh).toFixed(1)} kWh
            </span>
          </TabsContent>

          <TabsContent value="breakeven" className="pt-3">
            {breakEvenContent || (
              <p className="text-xs text-muted-foreground">
                Calculates the break-even charge threshold for your session.
              </p>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
