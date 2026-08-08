import type { IconName } from "lucide-react/dynamic";

export type ToolCategory =
  | "Charging & Savings"
  | "Trips & Range"
  | "Battery & Battery Health"
  | "Utilities";

export interface Tool {
  id: string; // slug
  name: string;
  description: string;
  category: ToolCategory;
  iconName: IconName | string; // Lucide icon name from lucide-react/dynamic
  keywords: string[];
  featured?: boolean;
  implemented?: boolean;
}

export type DistanceUnit = "km" | "mi";

export type EfficiencyUnit =
  | "kWh/100km"
  | "Wh/km"
  | "km/kWh"
  | "mi/kWh"
  | "kWh/100mi"
  | "Wh/mi";

export interface CurrencyConfig {
  code: string;
  symbol: string;
  name: string;
}

export interface CarPreset {
  id: string;
  brand: string;
  model: string;
  name: string;
  usableBatteryKwh: number;
  totalBatteryKwh?: number;
  defaultEfficiencyKwh100km: number;
}

export interface UserVehicle {
  id: string;
  name: string;
  presetId?: string;
  batteryCapacityKwh: number; // in kWh
  efficiencyValue: number;
  efficiencyUnit: EfficiencyUnit;
}

export interface UserSettings {
  vehicles: UserVehicle[];
  activeVehicleId: string;
  distanceUnit: DistanceUnit;
  efficiencyUnit: EfficiencyUnit;
  currency: string; // ISO Currency code e.g. 'CHF', 'EUR', 'USD', 'GBP'
}
