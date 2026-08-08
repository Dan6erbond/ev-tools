"use client";

import { useState } from "react";
import { useSettings } from "@/components/settings-context";
import { CAR_PRESETS } from "@/lib/car-presets";
import {
  CURRENCIES,
  EFFICIENCY_UNITS,
  GAS_EFFICIENCY_UNITS,
  GAS_FUEL_PRICE_UNITS,
  formatCurrency,
  formatDistance,
  formatEfficiency,
  convertEfficiency,
} from "@/lib/units";
import { DistanceUnit, EfficiencyUnit, GasEfficiencyUnit, GasFuelPriceUnit } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Car, CheckCircle2, RotateCcw, Plus, Trash2, Edit3, Check, Zap, Globe } from "lucide-react";

export default function ProfilePage() {
  const {
    settings,
    activeVehicle,
    setActiveVehicle,
    addVehicleFromPreset,
    addCustomVehicle,
    updateVehicle,
    removeVehicle,
    updateUnits,
    resetToDefaults,
    isLoaded,
  } = useSettings();

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [editingVehicleId, setEditingVehicleId] = useState<string | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  // Custom Vehicle state
  const [customName, setCustomName] = useState("");
  const [customBattery, setCustomBattery] = useState("75");
  const [customEff, setCustomEff] = useState("18");
  const [customUnit, setCustomUnit] = useState<EfficiencyUnit>("kWh/100km");

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full size-8 border-b-2 border-primary" />
      </div>
    );
  }

  const triggerNotify = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleAddPreset = (presetId: string) => {
    addVehicleFromPreset(presetId);
    setAddDialogOpen(false);
    triggerNotify();
  };

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;

    addCustomVehicle({
      name: customName.trim(),
      batteryCapacityKwh: parseFloat(customBattery) || 60,
      efficiencyValue: parseFloat(customEff) || 18,
      efficiencyUnit: customUnit,
    });

    setCustomName("");
    setAddDialogOpen(false);
    triggerNotify();
  };

  return (
    <div className="container max-w-5xl mx-auto py-8 px-4 flex flex-col gap-8">
      {/* Page Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
            <Car className="size-8 text-primary" />
            Vehicle Garage & Unit Preferences
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage your EV fleet, select active vehicles for calculations, and configure global currency & unit formatting.
          </p>
        </div>

        {savedSuccess && (
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 px-3 py-1.5 flex items-center gap-2 self-start">
            <CheckCircle2 className="size-4" />
            Settings Updated
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns: Garage & Unit Forms */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Garage Section */}
          <Card className="shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Car className="size-5 text-primary" />
                  My EV Garage
                </CardTitle>
                <CardDescription>
                  Saved vehicles used across calculators. Select one as active.
                </CardDescription>
              </div>

              {/* Add Vehicle Dialog Button */}
              <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                <DialogTrigger render={<Button size="sm" className="gap-1.5"><Plus className="size-4" />Add Vehicle</Button>} />
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add Vehicle to Garage</DialogTitle>
                    <DialogDescription>
                      Choose a popular EV preset or add custom specifications.
                    </DialogDescription>
                  </DialogHeader>

                  <Tabs defaultValue="preset" className="mt-2">
                    <TabsList className="grid grid-cols-2">
                      <TabsTrigger value="preset">Popular Presets</TabsTrigger>
                      <TabsTrigger value="custom">Custom EV</TabsTrigger>
                    </TabsList>

                    <TabsContent value="preset" className="flex flex-col gap-2 pt-3 max-h-[300px] overflow-y-auto">
                      {CAR_PRESETS.map((preset) => (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => handleAddPreset(preset.id)}
                          className="flex flex-col text-left p-3 rounded-lg border hover:border-primary hover:bg-accent/50 transition-all"
                        >
                          <span className="font-semibold text-sm">{preset.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {preset.usableBatteryKwh} kWh usable · {preset.defaultEfficiencyKwh100km} kWh/100km
                          </span>
                        </button>
                      ))}
                    </TabsContent>

                    <TabsContent value="custom" className="pt-3">
                      <form onSubmit={handleAddCustom} className="flex flex-col gap-4">
                        <div className="flex flex-col gap-2">
                          <Label htmlFor="customName">Vehicle Name</Label>
                          <Input
                            id="customName"
                            placeholder="e.g. My Custom EV"
                            value={customName}
                            onChange={(e) => setCustomName(e.target.value)}
                            required
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="flex flex-col gap-2">
                            <Label htmlFor="customBattery">Usable Battery (kWh)</Label>
                            <Input
                              id="customBattery"
                              type="number"
                              step="0.1"
                              value={customBattery}
                              onChange={(e) => setCustomBattery(e.target.value)}
                              required
                            />
                          </div>
                          <div className="flex flex-col gap-2">
                            <Label htmlFor="customEff">Efficiency Value</Label>
                            <Input
                              id="customEff"
                              type="number"
                              step="0.1"
                              value={customEff}
                              onChange={(e) => setCustomEff(e.target.value)}
                              required
                            />
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Label>Efficiency Unit</Label>
                          <Select
                            value={customUnit}
                            onValueChange={(v: EfficiencyUnit | null) => {
                              if (v) setCustomUnit(v);
                            }}
                            items={EFFICIENCY_UNITS.map((u) => ({ label: u.label, value: u.unit }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {EFFICIENCY_UNITS.map((u) => (
                                <SelectItem key={u.unit} value={u.unit}>
                                  {u.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <Button type="submit" className="mt-2">
                          Save to Garage
                        </Button>
                      </form>
                    </TabsContent>
                  </Tabs>
                </DialogContent>
              </Dialog>
            </CardHeader>

            <CardContent className="flex flex-col gap-3">
              {settings.vehicles.length === 0 && (
                <div className="py-8 text-center flex flex-col items-center justify-center text-muted-foreground border border-dashed rounded-lg p-6">
                  <Car className="size-8 mb-2 opacity-40" />
                  <p className="text-sm font-semibold">Your garage is currently empty</p>
                  <p className="text-xs mt-1">Add a vehicle from presets or custom specs above to customize calculations.</p>
                </div>
              )}

              {settings.vehicles.map((v) => {
                const isActive = activeVehicle?.id === v.id;
                const isEditing = editingVehicleId === v.id;

                return (
                  <div
                    key={v.id}
                    className={`flex flex-col p-4 rounded-xl border transition-all ${
                      isActive
                        ? "border-emerald-500/50 bg-emerald-500/5 shadow-xs"
                        : "border-border hover:bg-accent/30"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveVehicle(v.id);
                            triggerNotify();
                          }}
                          className="flex items-center gap-2 group"
                        >
                          <div
                            className={`size-5 rounded-full border flex items-center justify-center ${
                              isActive ? "border-emerald-500 bg-emerald-500 text-white" : "border-muted-foreground"
                            }`}
                          >
                            {isActive && <CheckCircle2 className="size-3.5 fill-current" />}
                          </div>
                          <span className="font-bold text-base hover:text-primary transition-colors">{v.name}</span>
                        </button>
                        {isActive && (
                          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-[10px]">
                            Active Vehicle
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        {isEditing ? (
                          <Button
                            variant="default"
                            size="sm"
                            className="h-7 px-2.5 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                            onClick={() => setEditingVehicleId(null)}
                          >
                            <Check className="size-3.5" />
                            Save
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            onClick={() => setEditingVehicleId(v.id)}
                            aria-label="Edit vehicle"
                          >
                            <Edit3 className="size-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-destructive hover:bg-destructive/10"
                          onClick={() => {
                            removeVehicle(v.id);
                            triggerNotify();
                          }}
                          aria-label="Remove vehicle"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>

                    {!isEditing ? (
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground font-mono">
                        <span>Battery: {v.batteryCapacityKwh} kWh usable</span>
                        <span>•</span>
                        <span>
                          Efficiency: {formatEfficiency(convertEfficiency(v.efficiencyValue, v.efficiencyUnit, settings.efficiencyUnit), settings.efficiencyUnit)}
                        </span>
                      </div>
                    ) : (
                      <div className="mt-4 pt-3 border-t grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="flex flex-col gap-1.5">
                          <Label className="text-xs">Nickname</Label>
                          <Input
                            value={v.name}
                            onChange={(e) => {
                              updateVehicle(v.id, { name: e.target.value });
                              triggerNotify();
                            }}
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <Label className="text-xs">Battery (kWh)</Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={v.batteryCapacityKwh}
                            onChange={(e) => {
                              updateVehicle(v.id, { batteryCapacityKwh: parseFloat(e.target.value) || 0 });
                              triggerNotify();
                            }}
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <Label className="text-xs">Efficiency ({v.efficiencyUnit})</Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={v.efficiencyValue}
                            onChange={(e) => {
                              updateVehicle(v.id, { efficiencyValue: parseFloat(e.target.value) || 0 });
                              triggerNotify();
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Unit & Formatting Section */}
          <Card className="shadow-xs">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Globe className="size-5 text-primary" />
                Currency & Unit Preferences
              </CardTitle>
              <CardDescription>
                Configure local formatting rules using standard Intl currency codes and preferred units.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Currency */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="currency">Currency (Intl Formatting)</Label>
                <Select
                  value={settings.currency}
                  onValueChange={(val: string | null) => {
                    if (val) {
                      updateUnits({ currency: val });
                      triggerNotify();
                    }
                  }}
                  items={CURRENCIES.map((c) => ({ label: c.name, value: c.code }))}
                >
                  <SelectTrigger id="currency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((c) => (
                      <SelectItem key={c.code} value={c.code}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Distance Unit */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="distanceUnit">Distance Unit</Label>
                <Select
                  value={settings.distanceUnit}
                  onValueChange={(val: DistanceUnit | null) => {
                    if (val) {
                      updateUnits({ distanceUnit: val });
                      triggerNotify();
                    }
                  }}
                  items={[
                    { label: "Kilometers (km)", value: "km" },
                    { label: "Miles (mi)", value: "mi" },
                  ]}
                >
                  <SelectTrigger id="distanceUnit">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="km">Kilometers (km)</SelectItem>
                    <SelectItem value="mi">Miles (mi)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* EV Efficiency Unit */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="globalEfficiencyUnit">EV Efficiency Unit</Label>
                <Select
                  value={settings.efficiencyUnit}
                  onValueChange={(val: EfficiencyUnit | null) => {
                    if (val) {
                      updateUnits({ efficiencyUnit: val });
                      triggerNotify();
                    }
                  }}
                  items={EFFICIENCY_UNITS.map((u) => ({ label: u.label, value: u.unit }))}
                >
                  <SelectTrigger id="globalEfficiencyUnit">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EFFICIENCY_UNITS.map((u) => (
                      <SelectItem key={u.unit} value={u.unit}>
                        {u.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Gas Consumption Unit */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="gasEfficiencyUnit">Gas Consumption Unit</Label>
                <Select
                  value={settings.gasEfficiencyUnit || "l/100km"}
                  onValueChange={(val: GasEfficiencyUnit | null) => {
                    if (val) {
                      updateUnits({ gasEfficiencyUnit: val });
                      triggerNotify();
                    }
                  }}
                  items={GAS_EFFICIENCY_UNITS.map((u) => ({ label: u.label, value: u.unit }))}
                >
                  <SelectTrigger id="gasEfficiencyUnit">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {GAS_EFFICIENCY_UNITS.map((u) => (
                      <SelectItem key={u.unit} value={u.unit}>
                        {u.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Gas Fuel Price Unit */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="gasFuelPriceUnit">Gas Fuel Price Unit</Label>
                <Select
                  value={settings.gasFuelPriceUnit || "Per Liter"}
                  onValueChange={(val: GasFuelPriceUnit | null) => {
                    if (val) {
                      updateUnits({ gasFuelPriceUnit: val });
                      triggerNotify();
                    }
                  }}
                  items={GAS_FUEL_PRICE_UNITS.map((u) => ({ label: u.label, value: u.unit }))}
                >
                  <SelectTrigger id="gasFuelPriceUnit">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {GAS_FUEL_PRICE_UNITS.map((u) => (
                      <SelectItem key={u.unit} value={u.unit}>
                        {u.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>

            <CardFooter className="flex justify-between border-t pt-4">
              <Button variant="ghost" size="sm" onClick={resetToDefaults} className="gap-2 text-muted-foreground">
                <RotateCcw className="size-4" />
                Reset Garage & Preferences
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Right 1 Column: Active Summary Card */}
        <div className="flex flex-col gap-6">
          <Card className="bg-muted/30 border-primary/20 sticky top-20 shadow-xs">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Zap className="size-4 text-emerald-500" />
                Active Vehicle Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 text-sm">
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-muted-foreground">Active EV:</span>
                <span className="font-semibold text-right">{activeVehicle ? activeVehicle.name : "None selected"}</span>
              </div>

              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-muted-foreground">Usable Battery:</span>
                <span className="font-mono font-medium">{activeVehicle ? `${activeVehicle.batteryCapacityKwh} kWh` : "—"}</span>
              </div>

              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-muted-foreground">EV Efficiency:</span>
                <span className="font-mono font-medium">
                  {activeVehicle
                    ? formatEfficiency(
                        convertEfficiency(activeVehicle.efficiencyValue, activeVehicle.efficiencyUnit, settings.efficiencyUnit),
                        settings.efficiencyUnit
                      )
                    : "—"}
                </span>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <span className="text-xs font-semibold text-muted-foreground">Local Formatting Preview:</span>
                <div className="bg-background rounded-lg p-3 border flex flex-col gap-2 font-mono text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Currency:</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                      {formatCurrency(14.5, settings.currency)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Distance:</span>
                    <span>{formatDistance(15, settings.distanceUnit)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">EV Unit:</span>
                    <span>{settings.efficiencyUnit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Gas Unit:</span>
                    <span>{settings.gasEfficiencyUnit || "l/100km"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fuel Price Unit:</span>
                    <span>{settings.gasFuelPriceUnit || "Per Liter"}</span>
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
