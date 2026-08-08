"use client";

import { useEffect } from "react";
import { useQueryStates, parseAsString, parseAsBoolean, parseAsInteger } from "nuqs";
import { useSettings } from "@/components/settings-context";
import { ActiveVehicleBanner } from "@/components/blocks/active-vehicle-banner";
import { ChargeTargetCard } from "@/components/blocks/charge-target-card";
import {
  formatCurrency,
  formatDistance,
  distanceToKm,
  efficiencyToKwhPerKm,
} from "@/lib/units";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  AlertTriangle,
  CheckCircle2,
  Navigation,
  Sparkles,
} from "lucide-react";

const detourQueryParsers = {
  nearDistance: parseAsString.withDefault("1.0"),
  nearPrice: parseAsString.withDefault("0.44"),
  farDistance: parseAsString.withDefault("15.0"),
  farPrice: parseAsString.withDefault("0.22"),
  isRoundTrip: parseAsBoolean.withDefault(true),
  chargeMode: parseAsString.withDefault("kwh"),
  targetKwh: parseAsInteger.withDefault(35),
  targetAddedPct: parseAsInteger.withDefault(20),
  socStart: parseAsInteger.withDefault(15),
  socEnd: parseAsInteger.withDefault(80),
};

export function DetourCalculator() {
  const { settings, activeVehicle } = useSettings();

  const [state, setState] = useQueryStates(detourQueryParsers, {
    history: "replace",
  });

  const {
    nearDistance,
    nearPrice,
    farDistance,
    farPrice,
    isRoundTrip,
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
        const saved = localStorage.getItem("ev-tools:detour-calculator");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && typeof parsed === "object") {
            setState(parsed);
          }
        }
      } catch (e) {
        console.error("Failed to parse detour state from localStorage:", e);
      }
    }
  }, []);

  // Sync state changes to localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem("ev-tools:detour-calculator", JSON.stringify(state));
    } catch (e) {
      console.error("Failed to save detour state to localStorage:", e);
    }
  }, [state]);

  // Vehicle stats from active vehicle
  const batteryKwh = activeVehicle?.batteryCapacityKwh || 75.0;
  const kwhPerKm = activeVehicle
    ? efficiencyToKwhPerKm(activeVehicle.efficiencyValue, activeVehicle.efficiencyUnit) || 0.18
    : 0.18;

  // Convert distances to km
  const nearKm = distanceToKm(parseFloat(nearDistance) || 0, settings.distanceUnit);
  const farKm = distanceToKm(parseFloat(farDistance) || 0, settings.distanceUnit);

  const priceNear = parseFloat(nearPrice) || 0;
  const priceFar = parseFloat(farPrice) || 0;

  // Extra distance driven
  const rawDiffKm = Math.max(0, farKm - nearKm);
  const extraKm = isRoundTrip ? rawDiffKm * 2 : rawDiffKm;

  // Energy consumed for the detour trip
  const detourEnergyKwh = extraKm * kwhPerKm;
  const detourDriveCost = detourEnergyKwh * priceFar;

  // Break-even calculation
  const priceDiff = priceNear - priceFar;
  const breakEvenKwh = priceDiff > 0 ? (detourEnergyKwh * priceFar) / priceDiff : Infinity;
  const breakEvenSocPct = Math.min(100, (breakEvenKwh / batteryKwh) * 100);

  // Determine actual target kWh based on active chargeMode
  let activeChargeKwh = 0;
  if (chargeMode === "breakeven") {
    activeChargeKwh = breakEvenKwh > 0 && breakEvenKwh !== Infinity ? breakEvenKwh : 20;
  } else if (chargeMode === "kwh") {
    activeChargeKwh = targetKwh;
  } else if (chargeMode === "addedPct") {
    activeChargeKwh = (targetAddedPct / 100) * batteryKwh;
  } else if (chargeMode === "socRange") {
    const deltaSoc = Math.max(0, socEnd - socStart);
    activeChargeKwh = (deltaSoc / 100) * batteryKwh;
  }

  // Cost calculations for active target
  const costNear = activeChargeKwh * priceNear;
  const totalEnergyAtFar = activeChargeKwh + detourEnergyKwh;
  const costFar = totalEnergyAtFar * priceFar;

  const netSavings = costNear - costFar;
  const isWorthIt = priceDiff > 0 && netSavings > 0;
  const roiPct = costNear > 0 ? (netSavings / costNear) * 100 : 0;

  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto">
      {/* Active Vehicle Bar Banner */}
      <ActiveVehicleBanner activeVehicle={activeVehicle} batteryKwh={batteryKwh} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column (5 cols): Station & Trip Inputs */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <Card className="shadow-xs">
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <Navigation className="size-4 text-primary" />
                Charger Locations & Pricing
              </CardTitle>
              <CardDescription>
                Compare your local charger vs a further, cheaper charger.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              {/* Nearby Station */}
              <div className="flex flex-col gap-3 p-3.5 rounded-lg border bg-muted/20">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Nearby / Standard Charger
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="nearDistance" className="text-xs">Distance ({settings.distanceUnit})</Label>
                    <Input
                      id="nearDistance"
                      type="number"
                      step="0.1"
                      min="0"
                      value={nearDistance}
                      onChange={(e) => setState({ nearDistance: e.target.value })}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="nearPrice" className="text-xs">Price ({settings.currency}/kWh)</Label>
                    <Input
                      id="nearPrice"
                      type="number"
                      step="0.01"
                      min="0"
                      value={nearPrice}
                      onChange={(e) => setState({ nearPrice: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Detour Station */}
              <div className="flex flex-col gap-3 p-3.5 rounded-lg border border-emerald-500/30 bg-emerald-500/5">
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                  Cheaper / Detour Charger
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="farDistance" className="text-xs">Distance ({settings.distanceUnit})</Label>
                    <Input
                      id="farDistance"
                      type="number"
                      step="0.1"
                      min="0"
                      value={farDistance}
                      onChange={(e) => setState({ farDistance: e.target.value })}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="farPrice" className="text-xs">Price ({settings.currency}/kWh)</Label>
                    <Input
                      id="farPrice"
                      type="number"
                      step="0.01"
                      min="0"
                      value={farPrice}
                      onChange={(e) => setState({ farPrice: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Detour Mode Switch */}
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <Label htmlFor="roundtrip" className="text-sm font-semibold cursor-pointer">
                    Round-Trip Detour
                  </Label>
                  <span className="text-xs text-muted-foreground">
                    Includes return distance back to starting point.
                  </span>
                </div>
                <Switch id="roundtrip" checked={isRoundTrip} onCheckedChange={(checked) => setState({ isRoundTrip: checked })} />
              </div>
            </CardContent>
          </Card>

          {/* Charging Goal Selection */}
          <ChargeTargetCard
            title="Charging Goal / Amount"
            chargeMode={chargeMode}
            targetKwh={targetKwh}
            targetAddedPct={targetAddedPct}
            socStart={socStart}
            socEnd={socEnd}
            batteryKwh={batteryKwh}
            vehicleName={activeVehicle?.name || "EV"}
            maxKwh={batteryKwh}
            onStateChange={(updates) => setState(updates)}
            breakEvenContent={
              <p className="text-xs text-muted-foreground">
                Calculates the minimum energy you must charge at the detour station to break even after paying for extra driving energy.
              </p>
            }
          />
        </div>

        {/* Right Column (7 cols): Visual Results & Breakdown */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Main Verdict Card */}
          <Card
            className={`shadow-md border-2 transition-all ${
              isWorthIt
                ? "border-emerald-500/50 bg-gradient-to-br from-emerald-500/10 via-background to-background"
                : "border-amber-500/50 bg-gradient-to-br from-amber-500/10 via-background to-background"
            }`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Badge
                  variant={isWorthIt ? "default" : "secondary"}
                  className={`px-3 py-1 text-xs font-semibold gap-1.5 ${
                    isWorthIt ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-amber-600 text-white"
                  }`}
                >
                  {isWorthIt ? (
                    <>
                      <CheckCircle2 className="size-4" />
                      Worth Driving Out of Your Way!
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="size-4" />
                      Not Worth the Detour
                    </>
                  )}
                </Badge>

                {priceDiff > 0 && (
                  <span className="text-xs font-mono font-medium text-muted-foreground">
                    Save {(priceDiff).toFixed(2)} {settings.currency}/kWh
                  </span>
                )}
              </div>
            </CardHeader>

            <CardContent className="flex flex-col gap-6">
              {/* Savings Big Highlight */}
              <div className="flex items-baseline justify-between pt-2 border-b pb-4">
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {isWorthIt ? "Net Financial Savings" : "Extra Cost / Loss"}
                  </span>
                  <span className="text-4xl font-extrabold tracking-tight mt-1">
                    {formatCurrency(Math.abs(netSavings), settings.currency)}
                  </span>
                </div>
                {isWorthIt && (
                  <div className="flex flex-col items-end">
                    <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                      +{roiPct.toFixed(1)}% ROI
                    </span>
                    <span className="text-[11px] text-muted-foreground">vs charging locally</span>
                  </div>
                )}
              </div>

              {/* Break-Even Highlight */}
              <div className="p-4 rounded-xl bg-background border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Sparkles className="size-5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold">Break-Even Threshold</span>
                    <span className="text-xs text-muted-foreground">Minimum charge at detour station</span>
                  </div>
                </div>

                <div className="flex flex-col items-end">
                  {priceDiff <= 0 ? (
                    <span className="text-xs text-destructive font-medium">Detour charger is not cheaper</span>
                  ) : breakEvenKwh > batteryKwh ? (
                    <span className="text-xs text-amber-600 font-medium">Exceeds battery capacity!</span>
                  ) : (
                    <>
                      <span className="font-mono font-bold text-base text-primary">
                        {breakEvenKwh.toFixed(1)} kWh
                      </span>
                      <span className="text-[11px] text-muted-foreground font-mono">
                        ({breakEvenSocPct.toFixed(0)}% of {activeVehicle?.name || "battery"})
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Side-by-side Cost Comparison */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Local Station Box */}
                <div className="p-4 rounded-xl border bg-muted/20 flex flex-col gap-2">
                  <span className="text-xs font-semibold text-muted-foreground">Nearby Station</span>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className="text-xl font-bold font-mono">
                      {formatCurrency(costNear, settings.currency)}
                    </span>
                    <span className="text-xs text-muted-foreground font-mono">
                      {activeChargeKwh.toFixed(1)} kWh
                    </span>
                  </div>
                  <span className="text-[11px] text-muted-foreground mt-1">
                    No extra driving detour.
                  </span>
                </div>

                {/* Detour Station Box */}
                <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 flex flex-col gap-2">
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    Cheaper Detour Station
                  </span>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(costFar, settings.currency)}
                    </span>
                    <span className="text-xs text-muted-foreground font-mono">
                      {totalEnergyAtFar.toFixed(1)} kWh
                    </span>
                  </div>
                  <span className="text-[11px] text-muted-foreground mt-1">
                    Includes {detourEnergyKwh.toFixed(2)} kWh driving detour.
                  </span>
                </div>
              </div>

              {/* Detailed Detour Breakdown */}
              <div className="flex flex-col gap-2.5 pt-2 text-xs">
                <span className="font-semibold text-muted-foreground uppercase tracking-wider text-[11px]">
                  Detour Energy & Travel Details
                </span>

                <div className="bg-background rounded-lg border p-3.5 flex flex-col gap-2 font-mono">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Extra Distance Driven:</span>
                    <span>{formatDistance(extraKm, settings.distanceUnit)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Detour Energy Burned:</span>
                    <span>{detourEnergyKwh.toFixed(2)} kWh</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Detour Drive Cost:</span>
                    <span>{formatCurrency(detourDriveCost, settings.currency)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
