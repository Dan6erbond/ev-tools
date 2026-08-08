import { CurrencyConfig, DistanceUnit, EfficiencyUnit } from "./types";

export const CURRENCIES: CurrencyConfig[] = [
  { code: "EUR", symbol: "€", name: "Euro (EUR)" },
  { code: "CHF", symbol: "CHF", name: "Swiss Franc (CHF)" },
  { code: "USD", symbol: "$", name: "US Dollar (USD)" },
  { code: "GBP", symbol: "£", name: "British Pound (GBP)" },
  { code: "CAD", symbol: "CA$", name: "Canadian Dollar (CAD)" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar (AUD)" },
  { code: "SEK", symbol: "kr", name: "Swedish Krona (SEK)" },
  { code: "NOK", symbol: "kr", name: "Norwegian Krone (NOK)" },
  { code: "DKK", symbol: "kr", name: "Danish Krone (DKK)" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen (JPY)" },
];

export const EFFICIENCY_UNITS: { unit: EfficiencyUnit; label: string; description: string }[] = [
  { unit: "kWh/100km", label: "kWh/100km", description: "Metric standard (e.g. 19.0)" },
  { unit: "mi/kWh", label: "mi/kWh", description: "US/UK standard (e.g. 3.2)" },
  { unit: "km/kWh", label: "km/kWh", description: "Kilometers per kWh (e.g. 5.2)" },
  { unit: "Wh/km", label: "Wh/km", description: "Watt-hours per km (e.g. 190)" },
  { unit: "kWh/100mi", label: "kWh/100mi", description: "kWh per 100 miles (e.g. 31.0)" },
  { unit: "Wh/mi", label: "Wh/mi", description: "Watt-hours per mile (e.g. 310)" },
];

const KM_PER_MILE = 1.609344;

/**
 * Format a number as currency using Intl.NumberFormat
 */
export function formatCurrency(amount: number, currencyCode: string = "EUR", decimals: number = 2): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currencyCode,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(amount);
  } catch {
    // Fallback if Intl fails for any custom code
    const curr = CURRENCIES.find((c) => c.code === currencyCode);
    const symbol = curr ? curr.symbol : currencyCode;
    return `${symbol} ${amount.toFixed(decimals)}`;
  }
}

/**
 * Convert distance from km to user's distance unit
 */
export function formatDistance(distanceKm: number, unit: DistanceUnit = "km"): string {
  if (unit === "mi") {
    const miles = distanceKm / KM_PER_MILE;
    return `${miles.toFixed(1)} mi`;
  }
  return `${distanceKm.toFixed(1)} km`;
}

/**
 * Convert user input distance in unit ('km' | 'mi') to internal km
 */
export function distanceToKm(value: number, unit: DistanceUnit = "km"): number {
  if (unit === "mi") {
    return value * KM_PER_MILE;
  }
  return value;
}

/**
 * Convert an efficiency value in a specific unit to internal kWh per km (kWh/km)
 */
export function efficiencyToKwhPerKm(value: number, unit: EfficiencyUnit): number {
  if (value <= 0) return 0;

  switch (unit) {
    case "kWh/100km":
      return value / 100;
    case "Wh/km":
      return value / 1000;
    case "km/kWh":
      return 1 / value;
    case "mi/kWh":
      // miles per kWh -> km per kWh is value * 1.609344
      return 1 / (value * KM_PER_MILE);
    case "kWh/100mi":
      // kWh per 100 mi -> kWh per mi -> kWh per km
      return (value / 100) / KM_PER_MILE;
    case "Wh/mi":
      return (value / 1000) / KM_PER_MILE;
    default:
      return value / 100;
  }
}

/**
 * Convert internal kWh/km to target efficiency unit value
 */
export function kwhPerKmToUnit(kwhPerKm: number, unit: EfficiencyUnit): number {
  if (kwhPerKm <= 0) return 0;

  switch (unit) {
    case "kWh/100km":
      return kwhPerKm * 100;
    case "Wh/km":
      return kwhPerKm * 1000;
    case "km/kWh":
      return 1 / kwhPerKm;
    case "mi/kWh":
      return (1 / kwhPerKm) / KM_PER_MILE;
    case "kWh/100mi":
      return (kwhPerKm * 100) * KM_PER_MILE;
    case "Wh/mi":
      return (kwhPerKm * 1000) * KM_PER_MILE;
    default:
      return kwhPerKm * 100;
  }
}

/**
 * Convert efficiency from one unit to another
 */
export function convertEfficiency(value: number, fromUnit: EfficiencyUnit, toUnit: EfficiencyUnit): number {
  if (fromUnit === toUnit) return value;
  const kwhKm = efficiencyToKwhPerKm(value, fromUnit);
  return kwhPerKmToUnit(kwhKm, toUnit);
}

/**
 * Format efficiency display text e.g., "19.0 kWh/100km" or "3.3 mi/kWh"
 */
export function formatEfficiency(value: number, unit: EfficiencyUnit, decimals: number = 1): string {
  return `${value.toFixed(decimals)} ${unit}`;
}
