"use client";

import React, { useEffect } from "react";
import { useQueryStates, parseAsString, parseAsInteger } from "nuqs";
import { useSettings } from "@/components/settings-context";
import { formatCurrency } from "@/lib/units";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Receipt,
  Zap,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Car,
  Sparkles,
  Scale,
} from "lucide-react";

const feeQueryParsers = {
  priceA: parseAsString.withDefault("0.44"),
  feeA: parseAsString.withDefault("0.00"),
  labelA: parseAsString.withDefault("Standard Charger"),
  priceB: parseAsString.withDefault("0.40"),
  feeB: parseAsString.withDefault("2.00"),
  labelB: parseAsString.withDefault("Discount Charger (with Fee)"),
  chargeMode: parseAsString.withDefault("kwh"),
  targetKwh: parseAsInteger.withDefault(35),
  targetAddedPct: parseAsInteger.withDefault(50),
  socStart: parseAsInteger.withDefault(15),
  socEnd: parseAsInteger.withDefault(80),
};

export function FeeBreakEvenCalculator() {
  const { settings, activeVehicle } = useSettings();

  const [state, setState] = useQueryStates(feeQueryParsers, {
    history: "replace",
  });

  const {
    priceA,
    feeA,
    labelA,
    priceB,
    feeB,
    labelB,
    chargeMode,
    targetKwh,
    targetAddedPct,
    socStart,
    socEnd,
  } = state;

  // Preload from localStorage if URL has no search parameters
  useEffect(() => {
    if (typeof window === "undefined") return;
    const search = window.location.search;
    if (!search || search.trim() === "" || search === "?") {
      try {
        const saved = localStorage.getItem("ev-tools:fee-break-even-calculator");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && typeof parsed === "object") {
            setState(parsed);
          }
        }
      } catch (e) {
        console.error("Failed to parse fee break-even state from localStorage:", e);
      }
    }
  }, []);

  // Sync state changes to localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem("ev-tools:fee-break-even-calculator", JSON.stringify(state));
    } catch (e) {
      console.error("Failed to save fee break-even state to localStorage:", e);
    }
  }, [state]);

  // Vehicle stats
  const batteryKwh = activeVehicle?.batteryCapacityKwh || 75.0;

  // Numeric values
  const pA = Math.max(0, parseFloat(priceA) || 0);
  const fA = Math.max(0, parseFloat(feeA) || 0);
  const pB = Math.max(0, parseFloat(priceB) || 0);
  const fB = Math.max(0, parseFloat(feeB) || 0);

  const priceDiff = pA - pB; // positive if Charger A is more expensive per kWh
  const feeDiff = fB - fA;   // positive if Charger B has higher activation fee

  // Break-even energy calculation
  // Formula: fA + pA * Q = fB + pB * Q => Q = (fB - fA) / (pA - pB)
  let breakEvenKwh = Infinity;
  let isAlwaysCheaperB = false;
  let isAlwaysExpensiveB = false;

  if (Math.abs(priceDiff) < 0.0001) {
    if (feeDiff > 0) {
      isAlwaysExpensiveB = true;
    } else if (feeDiff < 0) {
      isAlwaysCheaperB = true;
    } else {
      breakEvenKwh = 0;
    }
  } else if (priceDiff > 0) {
    // Charger B has lower per-kWh rate
    if (feeDiff <= 0) {
      // Charger B also has equal or lower fee -> B is always cheaper
      isAlwaysCheaperB = true;
      breakEvenKwh = 0;
    } else {
      // Charger B has lower rate but higher fee -> breaks even at feeDiff / priceDiff
      breakEvenKwh = feeDiff / priceDiff;
    }
  } else {
    // Charger B has HIGHER per-kWh rate (priceDiff < 0)
    if (feeDiff >= 0) {
      // Charger B also has higher fee -> B is always more expensive
      isAlwaysExpensiveB = true;
    } else {
      // Charger B has higher rate but lower fee -> B is cheaper ONLY UP TO break-even kWh
      breakEvenKwh = feeDiff / priceDiff; // both feeDiff (<0) and priceDiff (<0), so positive Q
    }
  }

  const breakEvenSocPct = isFinite(breakEvenKwh) && breakEvenKwh > 0
    ? (breakEvenKwh / batteryKwh) * 100
    : 0;

  // Determine active target charge kWh
  let activeChargeKwh = 0;
  if (chargeMode === "breakeven") {
    activeChargeKwh = isFinite(breakEvenKwh) && breakEvenKwh > 0 ? Math.round(breakEvenKwh * 10) / 10 : 35;
  } else if (chargeMode === "kwh") {
    activeChargeKwh = Math.max(0.1, targetKwh);
  } else if (chargeMode === "addedPct") {
    activeChargeKwh = (Math.max(1, targetAddedPct) / 100) * batteryKwh;
  } else if (chargeMode === "socRange") {
    const deltaSoc = Math.max(1, socEnd - socStart);
    activeChargeKwh = (deltaSoc / 100) * batteryKwh;
  }

  // Cost calculations at target kWh
  const costA = fA + activeChargeKwh * pA;
  const costB = fB + activeChargeKwh * pB;
  const netSavings = costA - costB; // positive means B saves money over A
  const effectiveRateA = activeChargeKwh > 0 ? costA / activeChargeKwh : pA;
  const effectiveRateB = activeChargeKwh > 0 ? costB / activeChargeKwh : pB;

  // Helper presets for quick test scenarios
  const applyPreset = (preset: "activationFee" | "subscription" | "equalRate") => {
    if (preset === "activationFee") {
      setState({
        priceA: "0.44",
        feeA: "0.00",
        labelA: "Standard Charger",
        priceB: "0.40",
        feeB: "2.00",
        labelB: "Cheaper Charger (with Fee)",
      });
    } else if (preset === "subscription") {
      setState({
        priceA: "0.55",
        feeA: "0.00",
        labelA: "Ad-Hoc Charger",
        priceB: "0.35",
        feeB: "5.00",
        labelB: "Session / Day Pass",
      });
    } else if (preset === "equalRate") {
      setState({
        priceA: "0.40",
        feeA: "0.00",
        labelA: "Free Start Charger",
        priceB: "0.40",
        feeB: "1.50",
        labelB: "Fixed Fee Charger",
      });
    }
  };

  // Milestones for comparison table
  const milestoneVolumes = [10, 20, 35, 50, 75, 100];
  if (isFinite(breakEvenKwh) && breakEvenKwh > 0 && !milestoneVolumes.includes(Math.round(breakEvenKwh))) {
    milestoneVolumes.push(Math.round(breakEvenKwh * 10) / 10);
    milestoneVolumes.sort((a, b) => a - b);
  }

  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto">
      {/* Active Vehicle Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl border bg-muted/40 backdrop-blur-xs">
        {activeVehicle ? (
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Car className="size-5" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Active Vehicle</div>
              <div className="text-sm font-bold flex items-center gap-2">
                {activeVehicle.name}
                <Badge variant="secondary" className="text-[10px] font-mono">
                  {batteryKwh} kWh Battery
                </Badge>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 text-muted-foreground text-xs">
            <Car className="size-4" />
            <span>Using default 75.0 kWh battery. Set your car in Profile for exact SoC % calculations.</span>
          </div>
        )}

        {/* Preset Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground hidden sm:inline">Presets:</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => applyPreset("activationFee")}
            className="text-xs h-7 px-2.5"
          >
            2.00 Fee vs 0.04 Rate
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => applyPreset("subscription")}
            className="text-xs h-7 px-2.5"
          >
            5.00 Pass vs 0.20 Rate
          </Button>
        </div>
      </div>

      {/* Hero Result Banner */}
      <Card className="border-2 shadow-sm overflow-hidden bg-card">
        <CardHeader className="pb-3 border-b bg-muted/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Receipt className="size-5 text-primary" />
              <CardTitle className="text-lg sm:text-xl font-bold">Break-Even Analysis</CardTitle>
            </div>
            {isAlwaysCheaperB ? (
              <Badge variant="default" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1">
                <CheckCircle2 className="size-3.5" />
                {labelB || "Charger B"} is Always Cheaper
              </Badge>
            ) : isAlwaysExpensiveB ? (
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="size-3.5" />
                {labelB || "Charger B"} Never Breaks Even
              </Badge>
            ) : netSavings > 0 ? (
              <Badge variant="default" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1">
                <TrendingDown className="size-3.5" />
                Saves {formatCurrency(netSavings, settings.currency)} at target
              </Badge>
            ) : netSavings < 0 ? (
              <Badge variant="secondary" className="text-destructive border-destructive/20 gap-1 font-semibold">
                <TrendingUp className="size-3.5" />
                Costs {formatCurrency(Math.abs(netSavings), settings.currency)} more at target
              </Badge>
            ) : (
              <Badge variant="outline" className="gap-1">
                Exactly Equal Cost
              </Badge>
            )}
          </div>
          <CardDescription className="text-xs">
            Minimum energy charge needed at {labelB || "Charger B"} to recover its higher activation fee.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          {/* Main Break-Even Metric */}
          <div className="flex flex-col gap-1 md:col-span-1 md:border-r md:pr-6">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Break-Even Energy
            </span>
            <div className="flex items-baseline gap-2">
              {isAlwaysCheaperB ? (
                <span className="text-3xl sm:text-4xl font-extrabold text-emerald-600 dark:text-emerald-400">
                  0.0 <span className="text-base font-normal">kWh</span>
                </span>
              ) : isAlwaysExpensiveB ? (
                <span className="text-3xl sm:text-4xl font-extrabold text-muted-foreground">
                  ∞ <span className="text-base font-normal">kWh</span>
                </span>
              ) : (
                <span className="text-3xl sm:text-4xl font-extrabold text-primary">
                  {breakEvenKwh.toFixed(1)} <span className="text-base font-normal">kWh</span>
                </span>
              )}
            </div>
            <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
              {isAlwaysCheaperB ? (
                <span>Starts saving money from the very first kWh</span>
              ) : isAlwaysExpensiveB ? (
                <span>Higher rate & higher fee — never economical</span>
              ) : (
                <span>
                  ~{breakEvenSocPct.toFixed(0)}% of {batteryKwh} kWh battery
                </span>
              )}
            </div>
          </div>

          {/* Verdict Explanation */}
          <div className="flex flex-col gap-2 md:col-span-2">
            <div className="flex items-center gap-2 font-semibold text-sm">
              <Sparkles className="size-4 text-emerald-500 shrink-0" />
              <span>Recommendation for your charge session</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {isAlwaysCheaperB ? (
                <>
                  <strong className="text-foreground">{labelB || "Charger B"}</strong> has both a lower or equal rate and fee. Choose it for any charging amount.
                </>
              ) : isAlwaysExpensiveB ? (
                <>
                  <strong className="text-foreground">{labelA || "Charger A"}</strong> is cheaper for all charge volumes. Avoid {labelB || "Charger B"}.
                </>
              ) : priceDiff > 0 ? (
                <>
                  Charging at least <strong className="text-foreground">{breakEvenKwh.toFixed(1)} kWh</strong> at{" "}
                  <strong className="text-foreground">{labelB || "Charger B"}</strong> covers its{" "}
                  {formatCurrency(feeDiff, settings.currency)} fee difference. For your current target of{" "}
                  <strong className="text-foreground">{activeChargeKwh.toFixed(1)} kWh</strong>,{" "}
                  {netSavings > 0 ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                      {labelB || "Charger B"} saves you {formatCurrency(netSavings, settings.currency)}.
                    </span>
                  ) : (
                    <span className="text-destructive font-semibold">
                      {labelA || "Charger A"} is cheaper by {formatCurrency(Math.abs(netSavings), settings.currency)}.
                    </span>
                  )}
                </>
              ) : (
                <>
                  <strong className="text-foreground">{labelB || "Charger B"}</strong> has a lower fee but higher per-kWh rate. It is cheaper ONLY if you charge less than{" "}
                  <strong className="text-foreground">{breakEvenKwh.toFixed(1)} kWh</strong>.
                </>
              )}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Input Configuration Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Charger A Card */}
        <Card className="border shadow-xs">
          <CardHeader className="pb-3 border-b bg-muted/10">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Zap className="size-4 text-blue-500" />
                Station A (Standard / Base)
              </CardTitle>
              <Badge variant="outline" className="text-[10px]">
                {fA > 0 ? `+${formatCurrency(fA, settings.currency)} Fee` : "No Fee"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-4 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="labelA" className="text-xs font-semibold">
                Station Label
              </Label>
              <Input
                id="labelA"
                value={labelA}
                onChange={(e) => setState({ labelA: e.target.value })}
                placeholder="e.g. Standard Charger"
                className="h-9 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="priceA" className="text-xs font-semibold">
                  Energy Rate ({settings.currency}/kWh)
                </Label>
                <Input
                  id="priceA"
                  type="number"
                  step="0.01"
                  min="0"
                  value={priceA}
                  onChange={(e) => setState({ priceA: e.target.value })}
                  className="h-9 text-sm font-mono"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="feeA" className="text-xs font-semibold">
                  Activation Fee ({settings.currency})
                </Label>
                <Input
                  id="feeA"
                  type="number"
                  step="0.10"
                  min="0"
                  value={feeA}
                  onChange={(e) => setState({ feeA: e.target.value })}
                  className="h-9 text-sm font-mono"
                />
              </div>
            </div>

            <Separator className="my-1" />

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Target Charge ({activeChargeKwh.toFixed(1)} kWh):</span>
              <span className="font-bold text-foreground">{formatCurrency(costA, settings.currency)}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Effective Rate:</span>
              <span className="font-mono">{formatCurrency(effectiveRateA, settings.currency)}/kWh</span>
            </div>
          </CardContent>
        </Card>

        {/* Charger B Card */}
        <Card className="border shadow-xs border-emerald-500/30">
          <CardHeader className="pb-3 border-b bg-emerald-500/5">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Receipt className="size-4 text-emerald-500" />
                Station B (Fee / Discount)
              </CardTitle>
              <Badge variant="secondary" className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold">
                {fB > 0 ? `+${formatCurrency(fB, settings.currency)} Activation Fee` : "No Fee"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-4 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="labelB" className="text-xs font-semibold">
                Station Label
              </Label>
              <Input
                id="labelB"
                value={labelB}
                onChange={(e) => setState({ labelB: e.target.value })}
                placeholder="e.g. Discount Charger with Fee"
                className="h-9 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="priceB" className="text-xs font-semibold">
                  Energy Rate ({settings.currency}/kWh)
                </Label>
                <Input
                  id="priceB"
                  type="number"
                  step="0.01"
                  min="0"
                  value={priceB}
                  onChange={(e) => setState({ priceB: e.target.value })}
                  className="h-9 text-sm font-mono"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="feeB" className="text-xs font-semibold">
                  Activation Fee ({settings.currency})
                </Label>
                <Input
                  id="feeB"
                  type="number"
                  step="0.10"
                  min="0"
                  value={feeB}
                  onChange={(e) => setState({ feeB: e.target.value })}
                  className="h-9 text-sm font-mono"
                />
              </div>
            </div>

            <Separator className="my-1" />

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Target Charge ({activeChargeKwh.toFixed(1)} kWh):</span>
              <span className="font-bold text-foreground">{formatCurrency(costB, settings.currency)}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Effective Rate:</span>
              <span className="font-mono">{formatCurrency(effectiveRateB, settings.currency)}/kWh</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Target Charge Session Configuration */}
      <Card className="border shadow-xs">
        <CardHeader className="pb-3 border-b bg-muted/10">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold">Charge Session Target</CardTitle>
              <CardDescription className="text-xs">
                Set how much energy you plan to charge to compare total costs.
              </CardDescription>
            </div>
            <Badge variant="outline" className="font-mono text-xs">
              {activeChargeKwh.toFixed(1)} kWh
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <Tabs
            value={chargeMode}
            onValueChange={(val) => setState({ chargeMode: val })}
            className="w-full"
          >
            <TabsList className="grid grid-cols-4 mb-6">
              <TabsTrigger value="kwh" className="text-xs">
                Target kWh
              </TabsTrigger>
              <TabsTrigger value="socRange" className="text-xs">
                SoC % Range
              </TabsTrigger>
              <TabsTrigger value="addedPct" className="text-xs">
                Added %
              </TabsTrigger>
              <TabsTrigger value="breakeven" className="text-xs">
                Break-Even Point
              </TabsTrigger>
            </TabsList>

            <TabsContent value="kwh" className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="targetKwh" className="text-xs font-semibold">
                  Energy Amount: <span className="font-mono text-primary font-bold">{targetKwh} kWh</span>
                </Label>
                <span className="text-xs text-muted-foreground font-mono">
                  ~{((targetKwh / batteryKwh) * 100).toFixed(0)}% battery
                </span>
              </div>
              <Slider
                id="targetKwh"
                min={5}
                max={120}
                step={1}
                value={[targetKwh]}
                onValueChange={(val) => setState({ targetKwh: Array.isArray(val) ? val[0] : val })}
                className="w-full"
              />
            </TabsContent>

            <TabsContent value="socRange" className="flex flex-col gap-4">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold">
                  State of Charge: <span className="text-primary font-bold">{socStart}% → {socEnd}%</span>
                </span>
                <span className="text-muted-foreground font-mono">
                  Added: {socEnd - socStart}% ({activeChargeKwh.toFixed(1)} kWh)
                </span>
              </div>
              <Slider
                min={0}
                max={100}
                step={5}
                value={[socStart, socEnd]}
                onValueChange={(val) => {
                  if (Array.isArray(val) && val.length === 2 && val[1] > val[0]) {
                    setState({ socStart: val[0], socEnd: val[1] });
                  }
                }}
                className="w-full"
              />
            </TabsContent>

            <TabsContent value="addedPct" className="flex flex-col gap-4">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold">
                  Added Battery %: <span className="text-primary font-bold">+{targetAddedPct}%</span>
                </span>
                <span className="text-muted-foreground font-mono">
                  {activeChargeKwh.toFixed(1)} kWh
                </span>
              </div>
              <Slider
                min={5}
                max={100}
                step={5}
                value={[targetAddedPct]}
                onValueChange={(val) => setState({ targetAddedPct: Array.isArray(val) ? val[0] : val })}
                className="w-full"
              />
            </TabsContent>

            <TabsContent value="breakeven" className="text-xs text-muted-foreground p-3 rounded-lg bg-muted/40">
              {isFinite(breakEvenKwh) && breakEvenKwh > 0 ? (
                <div className="flex items-center justify-between">
                  <span>Evaluating exactly at Break-Even threshold ({breakEvenKwh.toFixed(1)} kWh):</span>
                  <span className="font-mono font-bold text-foreground">
                    Both chargers cost {formatCurrency(costA, settings.currency)}
                  </span>
                </div>
              ) : (
                <span>No positive break-even threshold found for current rates.</span>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Cost Comparison Table / Matrix */}
      <Card className="border shadow-xs">
        <CardHeader className="pb-3 border-b bg-muted/10">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Scale className="size-4 text-emerald-500" />
              Volume Cost Comparison Matrix
            </CardTitle>
            <CardDescription className="text-xs hidden sm:block">
              See total cost & savings at various charge amounts.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/40 border-b text-muted-foreground uppercase font-semibold">
              <tr>
                <th className="py-3 px-4">Charge Volume</th>
                <th className="py-3 px-4">{labelA || "Station A"}</th>
                <th className="py-3 px-4">{labelB || "Station B"}</th>
                <th className="py-3 px-4">Difference / Savings</th>
                <th className="py-3 px-4">Cheaper Option</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {milestoneVolumes.map((vKwh) => {
                const cA = fA + vKwh * pA;
                const cB = fB + vKwh * pB;
                const diff = cA - cB;
                const isBreakEvenRow = Math.abs(vKwh - breakEvenKwh) < 0.1;
                const isTargetRow = Math.abs(vKwh - activeChargeKwh) < 0.1 && chargeMode !== "breakeven";

                return (
                  <tr
                    key={vKwh}
                    className={`${
                      isBreakEvenRow
                        ? "bg-primary/10 font-bold"
                        : isTargetRow
                        ? "bg-emerald-500/10 font-medium"
                        : "hover:bg-muted/20"
                    }`}
                  >
                    <td className="py-2.5 px-4 font-mono flex items-center gap-1.5">
                      {vKwh.toFixed(1)} kWh
                      {isBreakEvenRow && (
                        <Badge variant="default" className="text-[9px] px-1 py-0 h-3.5">
                          Break-Even
                        </Badge>
                      )}
                      {isTargetRow && (
                        <Badge variant="secondary" className="text-[9px] px-1 py-0 h-3.5">
                          Target
                        </Badge>
                      )}
                    </td>
                    <td className="py-2.5 px-4 font-mono">{formatCurrency(cA, settings.currency)}</td>
                    <td className="py-2.5 px-4 font-mono">{formatCurrency(cB, settings.currency)}</td>
                    <td className="py-2.5 px-4 font-mono">
                      {diff > 0.005 ? (
                        <span className="text-emerald-600 dark:text-emerald-400">
                          +{formatCurrency(diff, settings.currency)} (B saves)
                        </span>
                      ) : diff < -0.005 ? (
                        <span className="text-destructive">
                          -{formatCurrency(Math.abs(diff), settings.currency)} (A saves)
                        </span>
                      ) : (
                        <span className="text-muted-foreground">0.00 (Tie)</span>
                      )}
                    </td>
                    <td className="py-2.5 px-4">
                      {diff > 0.005 ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                          {labelB || "Station B"}
                        </span>
                      ) : diff < -0.005 ? (
                        <span className="font-semibold text-foreground">{labelA || "Station A"}</span>
                      ) : (
                        <span className="text-muted-foreground">Equal</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
