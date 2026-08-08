"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { UserSettings, UserVehicle, DistanceUnit, EfficiencyUnit } from "@/lib/types";
import { CAR_PRESETS } from "@/lib/car-presets";
import { convertEfficiency } from "@/lib/units";

const STORAGE_KEY = "ev-tools:settings";

const defaultVehicles: UserVehicle[] = [];

const defaultSettings: UserSettings = {
  vehicles: defaultVehicles,
  activeVehicleId: "",
  distanceUnit: "km",
  efficiencyUnit: "kWh/100km",
  currency: "EUR",
};

interface SettingsContextType {
  settings: UserSettings;
  activeVehicle: UserVehicle | null;
  setActiveVehicle: (vehicleId: string) => void;
  addVehicleFromPreset: (presetId: string) => void;
  addCustomVehicle: (vehicle: Omit<UserVehicle, "id">) => void;
  updateVehicle: (vehicleId: string, updates: Partial<Omit<UserVehicle, "id">>) => void;
  removeVehicle: (vehicleId: string) => void;
  updateUnits: (units: Partial<Pick<UserSettings, "distanceUnit" | "efficiencyUnit" | "currency">>) => void;
  resetToDefaults: () => void;
  isLoaded: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const vehicles: UserVehicle[] = Array.isArray(parsed.vehicles)
          ? parsed.vehicles.map((v: Partial<UserVehicle>) => ({
              id: v.id || Math.random().toString(36).replace("0.", "vehicle_"),
              name: v.name || "EV Vehicle",
              presetId: v.presetId,
              batteryCapacityKwh: typeof v.batteryCapacityKwh === "number" && v.batteryCapacityKwh > 0 ? v.batteryCapacityKwh : 75,
              efficiencyValue: typeof v.efficiencyValue === "number" && v.efficiencyValue > 0 ? v.efficiencyValue : 18,
              efficiencyUnit: v.efficiencyUnit || "kWh/100km",
            }))
          : [];

        const activeVehicleId = parsed.activeVehicleId && vehicles.some((v) => v.id === parsed.activeVehicleId)
          ? parsed.activeVehicleId
          : vehicles[0]?.id || "";

        const merged: UserSettings = {
          vehicles,
          activeVehicleId,
          distanceUnit: parsed.distanceUnit || defaultSettings.distanceUnit,
          efficiencyUnit: parsed.efficiencyUnit || defaultSettings.efficiencyUnit,
          currency: parsed.currency || defaultSettings.currency,
        };

        setSettings(merged);
      }
    } catch (e) {
      console.error("Failed to load settings from localStorage", e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  const saveSettings = (newSettings: UserSettings) => {
    setSettings(newSettings);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
    } catch (e) {
      console.error("Failed to save settings to localStorage", e);
    }
  };

  const activeVehicle: UserVehicle | null =
    settings.vehicles.find((v) => v.id === settings.activeVehicleId) ||
    settings.vehicles[0] ||
    null;

  const setActiveVehicle = (vehicleId: string) => {
    if (!settings.vehicles.some((v) => v.id === vehicleId)) return;
    saveSettings({ ...settings, activeVehicleId: vehicleId });
  };

  const addVehicleFromPreset = (presetId: string) => {
    const preset = CAR_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;

    // Check count of this preset in vehicles for unique naming if needed
    const existingCount = settings.vehicles.filter((v) => v.presetId === presetId).length;
    const name = existingCount > 0 ? `${preset.name} (${existingCount + 1})` : preset.name;

    const newVehicle: UserVehicle = {
      id: Math.random().toString(36).replace("0.", "vehicle_"),
      name,
      presetId: preset.id,
      batteryCapacityKwh: preset.usableBatteryKwh,
      efficiencyValue: preset.defaultEfficiencyKwh100km,
      efficiencyUnit: "kWh/100km",
    };

    const updatedVehicles = [...settings.vehicles, newVehicle];
    saveSettings({
      ...settings,
      vehicles: updatedVehicles,
      activeVehicleId: newVehicle.id,
    });
  };

  const addCustomVehicle = (vehicle: Omit<UserVehicle, "id">) => {
    const newVehicle: UserVehicle = {
      ...vehicle,
      id: Math.random().toString(36).replace("0.", "vehicle_"),
    };
    const updatedVehicles = [...settings.vehicles, newVehicle];
    saveSettings({
      ...settings,
      vehicles: updatedVehicles,
      activeVehicleId: newVehicle.id,
    });
  };

  const updateVehicle = (vehicleId: string, updates: Partial<Omit<UserVehicle, "id">>) => {
    const updatedVehicles = settings.vehicles.map((v) => {
      if (v.id !== vehicleId) return v;
      let newEff = updates.efficiencyValue ?? v.efficiencyValue;

      // Convert efficiency if unit changes but value not explicitly passed
      if (updates.efficiencyUnit && updates.efficiencyUnit !== v.efficiencyUnit && updates.efficiencyValue === undefined) {
        const converted = convertEfficiency(v.efficiencyValue, v.efficiencyUnit, updates.efficiencyUnit);
        newEff = Number(converted.toFixed(2));
      }

      return {
        ...v,
        ...updates,
        efficiencyValue: newEff,
      };
    });

    saveSettings({ ...settings, vehicles: updatedVehicles });
  };

  const removeVehicle = (vehicleId: string) => {
    if (settings.vehicles.length <= 1) {
      // Don't remove last vehicle
      return;
    }
    const updatedVehicles = settings.vehicles.filter((v) => v.id !== vehicleId);
    const newActiveId = settings.activeVehicleId === vehicleId ? updatedVehicles[0].id : settings.activeVehicleId;

    saveSettings({
      ...settings,
      vehicles: updatedVehicles,
      activeVehicleId: newActiveId,
    });
  };

  const updateUnits = (units: Partial<Pick<UserSettings, "distanceUnit" | "efficiencyUnit" | "currency">>) => {
    saveSettings({ ...settings, ...units });
  };

  const resetToDefaults = () => {
    saveSettings(defaultSettings);
  };

  return (
    <SettingsContext.Provider
      value={{
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
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}
