"use client";

import { useEffect, useMemo, useState } from "react";
import { useQueryStates, parseAsString, parseAsInteger, parseAsBoolean } from "nuqs";
import { useSettings } from "@/components/settings-context";
import Link from "next/link";
import { CAR_PRESETS } from "@/lib/car-presets";
import {
  formatCurrency,
  formatDistance,
  convertEfficiency,
  formatEfficiency,
} from "@/lib/units";
import {
  calculateEVBreakEven,
  type GasExpense,
  type EVExpense,
  type GasExpenseType,
  type EVExpenseType,
} from "@/lib/tools/ev-break-even";
import type { DistanceUnit, EfficiencyUnit, GasEfficiencyUnit, GasFuelPriceUnit } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
} from "@/components/ui/chart";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import {
  Fuel,
  Zap,
  Calendar,
  TrendingUp,
  Coins,
  CheckCircle2,
  Plus,
  Trash2,
  Car,
  Settings2,
} from "lucide-react";

const breakEvenQueryParsers = {
  gasPrice: parseAsString.withDefault("30000"),
  gasEfficiency: parseAsString.withDefault("7.5"),
  gasFuelPrice: parseAsString.withDefault("1.65"),

  evPrice: parseAsString.withDefault("45000"),
  evEfficiency: parseAsString.withDefault("18.0"),
  elecPrice: parseAsString.withDefault("0.25"),

  annualDistance: parseAsInteger.withDefault(15000),
  showBreakdown: parseAsBoolean.withDefault(false),

  gasTireCost: parseAsString.withDefault("600"),
  gasTireLifespan: parseAsInteger.withDefault(50000),
  evTireCost: parseAsString.withDefault("700"),
  evTireLifespan: parseAsInteger.withDefault(40000),
};

const DEFAULT_GAS_EXPENSE_TYPES: GasExpenseType[] = [
  "Insurance",
  "Taxes",
  "Maintenance",
  "Registration",
  "Parking",
  "Repairs",
  "Depreciation",
  "Other",
];

const DEFAULT_EV_EXPENSE_TYPES: EVExpenseType[] = [
  "Insurance",
  "Taxes",
  "Maintenance",
  "Registration",
  "Charging Equipment",
  "Public Charging Premium",
  "Battery Degradation Reserve",
  "Parking",
  "Repairs",
  "Depreciation",
  "Software / Subscription",
  "Other",
];

const chartConfig: ChartConfig = {
  gasTotal: {
    label: "Gas Total Cost",
    color: "#f97316", // orange-500
  },
  evTotal: {
    label: "EV Total Cost",
    color: "#10b981", // emerald-500
  },
  gasBase: {
    label: "Gas Purchase Base",
    color: "#fdba74", // orange-300
  },
  gasEnergy: {
    label: "Gas Fuel",
    color: "#ea580c", // orange-600
  },
  gasFixed: {
    label: "Gas Expenses",
    color: "#c2410c", // orange-700
  },
  evBase: {
    label: "EV Purchase Base",
    color: "#6ee7b7", // emerald-300
  },
  evEnergy: {
    label: "EV Electricity",
    color: "#059669", // emerald-600
  },
  evFixed: {
    label: "EV Expenses",
    color: "#047857", // emerald-700
  },
};

export function EVBreakEvenCalculator() {
  const { settings } = useSettings();

  const [state, setState] = useQueryStates(breakEvenQueryParsers, {
    history: "replace",
  });

  const {
    gasPrice,
    gasEfficiency,
    gasFuelPrice,
    evPrice,
    evEfficiency,
    elecPrice,
    annualDistance,
    showBreakdown,
    gasTireCost,
    gasTireLifespan,
    evTireCost,
    evTireLifespan,
  } = state;

  const [gasExpenses, setGasExpenses] = useState<GasExpense[]>([
    { id: "gas-maint", type: "Maintenance", amount: 400 },
  ]);
  const [evExpenses, setEvExpenses] = useState<EVExpense[]>([
    { id: "ev-maint", type: "Maintenance", amount: 150 },
  ]);

  // Read units directly from user profile settings
  const distanceUnit = settings.distanceUnit || "km";
  const evEfficiencyUnit = settings.efficiencyUnit || "kWh/100km";
  const gasEfficiencyUnit = settings.gasEfficiencyUnit || "l/100km";
  const gasFuelPriceUnit = settings.gasFuelPriceUnit || "Per Liter";
  const currencyCode = settings.currency || "EUR";

  // Preload from localStorage if URL has no search parameters
  useEffect(() => {
    if (typeof window === "undefined") return;
    const search = window.location.search;
    if (!search || search.trim() === "" || search === "?") {
      try {
        const saved = localStorage.getItem("ev-tools:ev-break-even-calculator");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && typeof parsed === "object") {
            if (parsed.state) setState(parsed.state);
            if (Array.isArray(parsed.gasExpenses)) setGasExpenses(parsed.gasExpenses);
            if (Array.isArray(parsed.evExpenses)) setEvExpenses(parsed.evExpenses);
          }
        }
      } catch (e) {
        console.error("Failed to parse break-even state from localStorage:", e);
      }
    }
  }, []);

  // Sync state changes to localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(
        "ev-tools:ev-break-even-calculator",
        JSON.stringify({ state, gasExpenses, evExpenses })
      );
    } catch (e) {
      console.error("Failed to save break-even state to localStorage:", e);
    }
  }, [state, gasExpenses, evExpenses]);

  // Parsed numerical inputs
  const numGasPrice = parseFloat(gasPrice) || 0;
  const numGasEfficiency = parseFloat(gasEfficiency) || 0;
  const numGasFuelPrice = parseFloat(gasFuelPrice) || 0;
  const numEvPrice = parseFloat(evPrice) || 0;
  const numEvEfficiency = parseFloat(evEfficiency) || 0;
  const numElecPrice = parseFloat(elecPrice) || 0;
  const numAnnualDistance = annualDistance || 0;
  const numGasTireCost = parseFloat(gasTireCost) || 0;
  const numGasTireLifespan = gasTireLifespan || 0;
  const numEvTireCost = parseFloat(evTireCost) || 0;
  const numEvTireLifespan = evTireLifespan || 0;

  // Perform calculation using profile units
  const results = useMemo(() => {
    return calculateEVBreakEven({
      gasPrice: numGasPrice,
      gasEfficiency: numGasEfficiency,
      gasEfficiencyUnit: gasEfficiencyUnit as GasEfficiencyUnit,
      gasFuelPrice: numGasFuelPrice,
      gasFuelPriceUnit: gasFuelPriceUnit as GasFuelPriceUnit,
      gasExpenses,
      gasTireCost: numGasTireCost,
      gasTireLifespan: numGasTireLifespan,

      evPrice: numEvPrice,
      evEfficiency: numEvEfficiency,
      evEfficiencyUnit: evEfficiencyUnit as EfficiencyUnit,
      elecPrice: numElecPrice,
      evExpenses,
      evTireCost: numEvTireCost,
      evTireLifespan: numEvTireLifespan,

      annualDistance: numAnnualDistance,
      distanceUnit: distanceUnit as DistanceUnit,
    });
  }, [
    numGasPrice,
    numGasEfficiency,
    gasEfficiencyUnit,
    numGasFuelPrice,
    gasFuelPriceUnit,
    gasExpenses,
    numGasTireCost,
    numGasTireLifespan,
    numEvPrice,
    numEvEfficiency,
    evEfficiencyUnit,
    numElecPrice,
    evExpenses,
    numEvTireCost,
    numEvTireLifespan,
    numAnnualDistance,
    distanceUnit,
  ]);

  const handlePresetSelect = (presetId: string) => {
    const preset = CAR_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    const converted = convertEfficiency(
      preset.defaultEfficiencyKwh100km,
      "kWh/100km",
      evEfficiencyUnit as EfficiencyUnit
    );
    setState({ evEfficiency: converted.toFixed(2) });
  };

  // Expenses management helpers
  const addGasExpense = () => {
    setGasExpenses((prev) => [
      ...prev,
      { id: Math.random().toString(36).substring(2, 9), type: "Maintenance", amount: 100 },
    ]);
  };

  const updateGasExpense = (id: string, updates: Partial<GasExpense>) => {
    setGasExpenses((prev) => prev.map((exp) => (exp.id === id ? { ...exp, ...updates } : exp)));
  };

  const removeGasExpense = (id: string) => {
    setGasExpenses((prev) => prev.filter((exp) => exp.id !== id));
  };

  const addEvExpense = () => {
    setEvExpenses((prev) => [
      ...prev,
      { id: Math.random().toString(36).substring(2, 9), type: "Maintenance", amount: 100 },
    ]);
  };

  const updateEvExpense = (id: string, updates: Partial<EVExpense>) => {
    setEvExpenses((prev) => prev.map((exp) => (exp.id === id ? { ...exp, ...updates } : exp)));
  };

  const removeEvExpense = (id: string) => {
    setEvExpenses((prev) => prev.filter((exp) => exp.id !== id));
  };

  const fuelPriceUnitLabel =
    gasFuelPriceUnit === "Per Liter"
      ? `${currencyCode}/L`
      : gasFuelPriceUnit === "Per Gal (US)"
      ? `${currencyCode}/gal (US)`
      : `${currencyCode}/gal (UK)`;

  return (
    <div className="flex flex-col gap-8">
      {/* Main Grid: Inputs Column & Results Column */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Inputs Column (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Usage Details Card */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Calendar className="size-4 text-blue-500" />
                  Annual Usage
                </CardTitle>
                <Link
                  href="/profile"
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary underline transition-colors"
                >
                  <Settings2 className="size-3" />
                  Units ({distanceUnit}, {currencyCode})
                </Link>
              </div>
              <CardDescription className="text-xs">
                Estimated distance driven per year.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-1.5">
                <Label htmlFor="annualDistance" className="text-xs">
                  Annual Distance ({distanceUnit})
                </Label>
                <Input
                  id="annualDistance"
                  type="number"
                  min={0}
                  step={500}
                  value={annualDistance}
                  onChange={(e) =>
                    setState({ annualDistance: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Gas Vehicle Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Fuel className="size-4 text-orange-500" />
                Gas Vehicle (ICE)
              </CardTitle>
              <CardDescription className="text-xs">
                Purchase price, fuel consumption, and recurring gas expenses.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="gasPrice" className="text-xs">
                  Purchase Price ({currencyCode})
                </Label>
                <Input
                  id="gasPrice"
                  type="number"
                  min={0}
                  step={1000}
                  value={gasPrice}
                  onChange={(e) => setState({ gasPrice: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="gasEfficiency" className="text-xs">
                    Efficiency ({gasEfficiencyUnit})
                  </Label>
                  <Input
                    id="gasEfficiency"
                    type="number"
                    min={0}
                    step={0.1}
                    value={gasEfficiency}
                    onChange={(e) => setState({ gasEfficiency: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="gasFuelPrice" className="text-xs">
                    Fuel Price ({fuelPriceUnitLabel})
                  </Label>
                  <Input
                    id="gasFuelPrice"
                    type="number"
                    min={0}
                    step={0.05}
                    value={gasFuelPrice}
                    onChange={(e) => setState({ gasFuelPrice: e.target.value })}
                  />
                </div>
              </div>

              <Separator />

              {/* Gas Tire Costs */}
              <div className="space-y-3">
                <Label className="text-xs font-semibold">Tire Wear Costs</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="gasTireCost" className="text-[11px] text-muted-foreground">
                      Full Set Cost ({currencyCode})
                    </Label>
                    <Input
                      id="gasTireCost"
                      type="number"
                      min={0}
                      step={50}
                      value={gasTireCost}
                      onChange={(e) => setState({ gasTireCost: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="gasTireLifespan" className="text-[11px] text-muted-foreground">
                      Lifespan ({distanceUnit})
                    </Label>
                    <Input
                      id="gasTireLifespan"
                      type="number"
                      min={0}
                      step={5000}
                      value={gasTireLifespan}
                      onChange={(e) => setState({ gasTireLifespan: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Gas Itemized Expenses */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold">Additional Annual Expenses ({currencyCode})</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addGasExpense} className="h-7 text-xs px-2 gap-1">
                    <Plus className="size-3" />
                    Add
                  </Button>
                </div>

                {gasExpenses.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">No extra gas expenses added.</p>
                ) : (
                  <div className="space-y-2">
                    {gasExpenses.map((exp) => (
                      <div key={exp.id} className="flex items-center gap-2">
                        <Select
                          value={exp.type}
                          onValueChange={(val) => updateGasExpense(exp.id, { type: val as GasExpenseType })}
                        >
                          <SelectTrigger className="h-8 text-xs flex-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {DEFAULT_GAS_EXPENSE_TYPES.map((t) => (
                              <SelectItem key={t} value={t} className="text-xs">
                                {t}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          type="number"
                          min={0}
                          step={50}
                          value={exp.amount}
                          onChange={(e) => updateGasExpense(exp.id, { amount: parseFloat(e.target.value) || 0 })}
                          className="h-8 text-xs w-24"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeGasExpense(exp.id)}
                          className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Electric Vehicle Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Zap className="size-4 text-emerald-500" />
                Electric Vehicle (EV)
              </CardTitle>
              <CardDescription className="text-xs">
                Purchase price, EV efficiency, electricity rates, and EV maintenance.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="evPrice" className="text-xs">
                  Purchase Price ({currencyCode})
                </Label>
                <Input
                  id="evPrice"
                  type="number"
                  min={0}
                  step={1000}
                  value={evPrice}
                  onChange={(e) => setState({ evPrice: e.target.value })}
                />
              </div>

              {/* Popular EV Presets */}
              <div className="space-y-1.5">
                <Label className="text-xs flex items-center gap-1.5">
                  <Car className="size-3.5 text-emerald-500" />
                  Popular EV Presets
                </Label>
                <div className="flex flex-wrap gap-1.5">
                  {CAR_PRESETS.map((preset) => {
                    const displayEff = convertEfficiency(
                      preset.defaultEfficiencyKwh100km,
                      "kWh/100km",
                      evEfficiencyUnit as EfficiencyUnit
                    );
                    return (
                      <Button
                        key={preset.id}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handlePresetSelect(preset.id)}
                        className="h-auto py-1 px-2.5 text-left flex flex-col items-start hover:border-emerald-500/50 hover:bg-emerald-500/5"
                      >
                        <span className="text-[11px] font-medium leading-none">{preset.name}</span>
                        <span className="text-[10px] text-muted-foreground mt-0.5">
                          {formatEfficiency(displayEff, evEfficiencyUnit as EfficiencyUnit)}
                        </span>
                      </Button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="evEfficiency" className="text-xs">
                    Efficiency ({evEfficiencyUnit})
                  </Label>
                  <Input
                    id="evEfficiency"
                    type="number"
                    min={0}
                    step={0.1}
                    value={evEfficiency}
                    onChange={(e) => setState({ evEfficiency: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="elecPrice" className="text-xs">
                    Electricity ({currencyCode}/kWh)
                  </Label>
                  <Input
                    id="elecPrice"
                    type="number"
                    min={0}
                    step={0.01}
                    value={elecPrice}
                    onChange={(e) => setState({ elecPrice: e.target.value })}
                  />
                </div>
              </div>

              <Separator />

              {/* EV Tire Costs */}
              <div className="space-y-3">
                <Label className="text-xs font-semibold">Tire Wear Costs</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="evTireCost" className="text-[11px] text-muted-foreground">
                      Full Set Cost ({currencyCode})
                    </Label>
                    <Input
                      id="evTireCost"
                      type="number"
                      min={0}
                      step={50}
                      value={evTireCost}
                      onChange={(e) => setState({ evTireCost: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="evTireLifespan" className="text-[11px] text-muted-foreground">
                      Lifespan ({distanceUnit})
                    </Label>
                    <Input
                      id="evTireLifespan"
                      type="number"
                      min={0}
                      step={5000}
                      value={evTireLifespan}
                      onChange={(e) => setState({ evTireLifespan: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* EV Itemized Expenses */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold">Additional Annual Expenses ({currencyCode})</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addEvExpense} className="h-7 text-xs px-2 gap-1">
                    <Plus className="size-3" />
                    Add
                  </Button>
                </div>

                {evExpenses.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">No extra EV expenses added.</p>
                ) : (
                  <div className="space-y-2">
                    {evExpenses.map((exp) => (
                      <div key={exp.id} className="flex items-center gap-2">
                        <Select
                          value={exp.type}
                          onValueChange={(val) => updateEvExpense(exp.id, { type: val as EVExpenseType })}
                        >
                          <SelectTrigger className="h-8 text-xs flex-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {DEFAULT_EV_EXPENSE_TYPES.map((t) => (
                              <SelectItem key={t} value={t} className="text-xs">
                                {t}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          type="number"
                          min={0}
                          step={50}
                          value={exp.amount}
                          onChange={(e) => updateEvExpense(exp.id, { amount: parseFloat(e.target.value) || 0 })}
                          className="h-8 text-xs w-24"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeEvExpense(exp.id)}
                          className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Results Column (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Summary Dashboard Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Annual Savings */}
            <Card className="overflow-hidden border-l-4 border-l-emerald-500 shadow-xs">
              <CardContent className="p-4">
                <p className="text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
                  Annual Savings
                </p>
                <p className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                  {formatCurrency(results.savingsPerYear, currencyCode, 0)}
                </p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Compared to gas vehicle
                </p>
              </CardContent>
            </Card>

            {/* Break-Even Time */}
            <Card className="overflow-hidden border-l-4 border-l-blue-500 shadow-xs">
              <CardContent className="p-4">
                <p className="text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
                  Break-Even Time
                </p>
                <p className="text-2xl font-bold font-mono text-blue-600 dark:text-blue-400 mt-1">
                  {results.breakEvenYears === Infinity
                    ? "Never"
                    : `${results.breakEvenYears.toFixed(1)} Yrs`}
                </p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Based on annual usage
                </p>
              </CardContent>
            </Card>

            {/* Break-Even Distance */}
            <Card className="overflow-hidden border-l-4 border-l-orange-500 shadow-xs">
              <CardContent className="p-4">
                <p className="text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
                  Break-Even Distance
                </p>
                <p className="text-2xl font-bold font-mono text-orange-600 dark:text-orange-400 mt-1">
                  {results.breakEvenDistanceKm === Infinity
                    ? "N/A"
                    : formatDistance(results.breakEvenDistanceKm, distanceUnit as DistanceUnit)}
                </p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Total required mileage
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Cost Over Time Interactive Line Chart */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <TrendingUp className="size-4 text-primary" />
                  Total Cost of Ownership Over Time
                </CardTitle>
                <CardDescription className="text-xs">
                  Includes purchase price, fuel/electricity, and ownership costs across years.
                </CardDescription>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  id="breakdown-toggle"
                  checked={showBreakdown}
                  onCheckedChange={(val) => setState({ showBreakdown: val })}
                />
                <Label htmlFor="breakdown-toggle" className="text-xs text-muted-foreground cursor-pointer">
                  Breakdown
                </Label>
              </div>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="aspect-video w-full">
                <LineChart
                  data={results.chartData}
                  margin={{ top: 10, right: 20, left: 10, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="year"
                    tick={{ fontSize: 11 }}
                    label={{
                      value: "Years",
                      position: "insideBottomRight",
                      offset: -10,
                      fontSize: 11,
                    }}
                  />
                  <YAxis
                    tickFormatter={(val) => `${val / 1000}k`}
                    tick={{ fontSize: 11 }}
                  />

                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(val) => (
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-medium">
                              {formatCurrency(Number(val), currencyCode, 0)}
                            </span>
                          </div>
                        )}
                      />
                    }
                  />

                  {/* Main Totals */}
                  <Line
                    type="monotone"
                    dataKey="gasTotal"
                    name="Gas Total Cost"
                    stroke="var(--color-gasTotal)"
                    strokeWidth={3}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="evTotal"
                    name="EV Total Cost"
                    stroke="var(--color-evTotal)"
                    strokeWidth={3}
                    dot={false}
                  />

                  {/* Breakdown detail lines */}
                  {showBreakdown && (
                    <>
                      <Line
                        type="monotone"
                        dataKey="gasBase"
                        name="Gas Purchase Base"
                        stroke="var(--color-gasBase)"
                        strokeWidth={1.5}
                        strokeDasharray="4 4"
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="gasEnergy"
                        name="Gas Fuel"
                        stroke="var(--color-gasEnergy)"
                        strokeWidth={1.5}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="gasFixed"
                        name="Gas Expenses"
                        stroke="var(--color-gasFixed)"
                        strokeWidth={1.5}
                        strokeDasharray="2 2"
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="evBase"
                        name="EV Purchase Base"
                        stroke="var(--color-evBase)"
                        strokeWidth={1.5}
                        strokeDasharray="4 4"
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="evEnergy"
                        name="EV Electricity"
                        stroke="var(--color-evEnergy)"
                        strokeWidth={1.5}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="evFixed"
                        name="EV Expenses"
                        stroke="var(--color-evFixed)"
                        strokeWidth={1.5}
                        strokeDasharray="2 2"
                        dot={false}
                      />
                    </>
                  )}

                  {/* Break-even vertical reference line */}
                  {results.breakEvenYears !== Infinity && results.breakEvenYears <= 25 && (
                    <ReferenceLine
                      x={Number(results.breakEvenYears.toFixed(1))}
                      stroke="var(--color-evTotal)"
                      strokeDasharray="3 3"
                      label={{
                        value: "Break-even",
                        fill: "var(--color-evTotal)",
                        fontSize: 11,
                        position: "top",
                      }}
                    />
                  )}
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Pro-Tip Maintenance Card */}
          <Card className="border-emerald-500/30 bg-emerald-500/10 dark:bg-emerald-500/10">
            <CardContent className="p-4 sm:p-5 flex items-start gap-3">
              <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
                <CheckCircle2 className="size-4" />
              </div>
              <div className="space-y-1 text-emerald-900 dark:text-emerald-100">
                <h4 className="text-sm font-semibold">Pro Tip: Long-Term EV Maintenance & Regeneration</h4>
                <p className="text-xs leading-relaxed opacity-90">
                  Electric vehicles feature far fewer moving parts (no engine oil, timing belts, or spark plugs) and leverage regenerative braking to drastically reduce brake pad wear. Incorporating these savings can accelerate your break-even point even faster!
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Cost Breakdown Table / List */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Coins className="size-4 text-amber-500" />
                Cost Breakdown Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-xs sm:text-sm">
                <div className="flex items-center justify-between py-1 border-b">
                  <span className="text-muted-foreground">Initial EV Price Premium</span>
                  <span className="font-mono font-semibold text-destructive">
                    +{formatCurrency(results.priceDifference, currencyCode, 0)}
                  </span>
                </div>

                <div className="space-y-2 pt-1">
                  <div className="font-semibold text-foreground flex items-center gap-1.5">
                    <Fuel className="size-3.5 text-orange-500" />
                    Gas Vehicle (Annual)
                  </div>
                  <div className="flex items-center justify-between pl-5 text-muted-foreground">
                    <span>Fuel Expenses</span>
                    <span className="font-mono">{formatCurrency(results.breakdown.gas.energy, currencyCode, 0)}</span>
                  </div>
                  <div className="flex items-center justify-between pl-5 text-muted-foreground">
                    <span>Ownership / Maintenance / Tires</span>
                    <span className="font-mono">{formatCurrency(results.breakdown.gas.expenses, currencyCode, 0)}</span>
                  </div>
                  <div className="flex items-center justify-between pl-5 font-semibold text-foreground">
                    <span>Total Annual Gas Cost</span>
                    <span className="font-mono">{formatCurrency(results.breakdown.gas.total, currencyCode, 0)}</span>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2 pt-1">
                  <div className="font-semibold text-foreground flex items-center gap-1.5">
                    <Zap className="size-3.5 text-emerald-500" />
                    Electric Vehicle (Annual)
                  </div>
                  <div className="flex items-center justify-between pl-5 text-muted-foreground">
                    <span>Electricity Costs</span>
                    <span className="font-mono">{formatCurrency(results.breakdown.ev.energy, currencyCode, 0)}</span>
                  </div>
                  <div className="flex items-center justify-between pl-5 text-muted-foreground">
                    <span>Ownership / Maintenance / Tires</span>
                    <span className="font-mono">{formatCurrency(results.breakdown.ev.expenses, currencyCode, 0)}</span>
                  </div>
                  <div className="flex items-center justify-between pl-5 font-semibold text-foreground">
                    <span>Total Annual EV Cost</span>
                    <span className="font-mono">{formatCurrency(results.breakdown.ev.total, currencyCode, 0)}</span>
                  </div>
                </div>

                <Separator />

                <div className="flex items-center justify-between pt-1 font-semibold text-foreground">
                  <span>Estimated Monthly Savings</span>
                  <span className="font-mono text-base text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(results.savingsPerYear / 12, currencyCode, 0)} / mo
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
