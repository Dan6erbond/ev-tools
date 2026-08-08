import { CarPreset } from "./types";

export const CAR_PRESETS: CarPreset[] = [
  {
    id: "bmw-i4-m50",
    brand: "BMW",
    model: "i4 M50",
    name: "BMW i4 M50",
    usableBatteryKwh: 80.7,
    totalBatteryKwh: 83.9,
    defaultEfficiencyKwh100km: 19.0,
  },
  {
    id: "alfa-romeo-junior-elettrica",
    brand: "Alfa Romeo",
    model: "Junior Elettrica",
    name: "Alfa Romeo Junior Elettrica",
    usableBatteryKwh: 51.0,
    totalBatteryKwh: 54.0,
    defaultEfficiencyKwh100km: 15.5,
  },
  {
    id: "tesla-model-3-lr",
    brand: "Tesla",
    model: "Model 3 Long Range",
    name: "Tesla Model 3 LR",
    usableBatteryKwh: 75.0,
    totalBatteryKwh: 78.1,
    defaultEfficiencyKwh100km: 14.5,
  },
  {
    id: "tesla-model-y-lr",
    brand: "Tesla",
    model: "Model Y Long Range",
    name: "Tesla Model Y LR",
    usableBatteryKwh: 75.0,
    totalBatteryKwh: 78.1,
    defaultEfficiencyKwh100km: 16.0,
  },
  {
    id: "hyundai-ioniq-5-77",
    brand: "Hyundai",
    model: "Ioniq 5 (77.4 kWh)",
    name: "Hyundai Ioniq 5",
    usableBatteryKwh: 74.0,
    totalBatteryKwh: 77.4,
    defaultEfficiencyKwh100km: 17.5,
  },
  {
    id: "porsche-taycan-plus",
    brand: "Porsche",
    model: "Taycan Performance Battery Plus",
    name: "Porsche Taycan",
    usableBatteryKwh: 83.7,
    totalBatteryKwh: 93.4,
    defaultEfficiencyKwh100km: 20.5,
  },
];

export const DEFAULT_CAR: CarPreset = CAR_PRESETS[0]; // BMW i4 M50 default
