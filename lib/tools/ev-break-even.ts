import {
  DistanceUnit,
  EfficiencyUnit,
  GasEfficiencyUnit,
  GasFuelPriceUnit,
} from "@/lib/types";
import {
  distanceToKm,
  efficiencyToKwhPerKm,
  toL100km,
  toPricePerL,
} from "@/lib/units";

export type GasExpenseType =
  | "Insurance"
  | "Taxes"
  | "Maintenance"
  | "Tires"
  | "Registration"
  | "Parking"
  | "Repairs"
  | "Depreciation"
  | "Other";

export interface GasExpense {
  id: string;
  type: GasExpenseType;
  amount: number; // per year
}

export type EVExpenseType =
  | "Insurance"
  | "Taxes"
  | "Maintenance"
  | "Tires"
  | "Registration"
  | "Charging Equipment"
  | "Public Charging Premium"
  | "Battery Degradation Reserve"
  | "Parking"
  | "Repairs"
  | "Depreciation"
  | "Software / Subscription"
  | "Other";

export interface EVExpense {
  id: string;
  type: EVExpenseType;
  amount: number; // per year
}

export interface EVBreakEvenParams {
  gasPrice: number;
  gasFuelPrice: number;
  gasEfficiency: number;
  gasEfficiencyUnit: GasEfficiencyUnit;
  gasFuelPriceUnit: GasFuelPriceUnit;
  gasExpenses: GasExpense[];
  gasTireCost?: number;
  gasTireLifespan?: number;

  evPrice: number;
  evEfficiency: number;
  evEfficiencyUnit: EfficiencyUnit;
  elecPrice: number; // per kWh
  evExpenses: EVExpense[];
  evTireCost?: number;
  evTireLifespan?: number;

  annualDistance: number;
  distanceUnit: DistanceUnit;
}

export interface EVBreakEvenChartPoint {
  year: number;
  gasBase: number;
  gasEnergy: number;
  gasFixed: number;
  gasTotal: number;
  evBase: number;
  evEnergy: number;
  evFixed: number;
  evTotal: number;
}

export interface EVBreakEvenResult {
  gasCostPerYear: number;
  evCostPerYear: number;
  savingsPerYear: number;
  priceDifference: number;
  breakEvenDistanceKm: number; // internal km
  breakEvenYears: number;
  chartData: EVBreakEvenChartPoint[];
  breakdown: {
    gas: {
      energy: number;
      expenses: number;
      total: number;
    };
    ev: {
      energy: number;
      expenses: number;
      total: number;
    };
  };
}

function calcAnnualTireCost(
  annualKm: number,
  tireCost?: number,
  tireLifespanKm?: number
): number {
  if (!tireCost || !tireLifespanKm || tireLifespanKm <= 0) return 0;
  return (annualKm / tireLifespanKm) * tireCost;
}

export function calculateEVBreakEven(params: EVBreakEvenParams): EVBreakEvenResult {
  const annualKm = distanceToKm(params.annualDistance, params.distanceUnit);

  const gasL100km = toL100km(params.gasEfficiency, params.gasEfficiencyUnit);
  const gasPricePerL = toPricePerL(params.gasFuelPrice, params.gasFuelPriceUnit);
  const evKwhPerKm = efficiencyToKwhPerKm(params.evEfficiency, params.evEfficiencyUnit);

  // Cost per KM
  const gasCostPerKm = (gasL100km / 100) * gasPricePerL;
  const evCostPerKm = evKwhPerKm * params.elecPrice;

  // Annual energy costs
  const gasEnergyPerYear = gasCostPerKm * annualKm;
  const evEnergyPerYear = evCostPerKm * annualKm;

  // Tire costs
  const gasTireLifespanKm = params.gasTireLifespan
    ? distanceToKm(params.gasTireLifespan, params.distanceUnit)
    : undefined;
  const evTireLifespanKm = params.evTireLifespan
    ? distanceToKm(params.evTireLifespan, params.distanceUnit)
    : undefined;

  const gasTirePerYear = calcAnnualTireCost(
    annualKm,
    params.gasTireCost,
    gasTireLifespanKm
  );
  const evTirePerYear = calcAnnualTireCost(
    annualKm,
    params.evTireCost,
    evTireLifespanKm
  );

  // Annual fixed ownership costs
  const gasFixedPerYear = params.gasExpenses.reduce(
    (sum, e) => sum + (e.amount || 0),
    gasTirePerYear
  );
  const evFixedPerYear = params.evExpenses.reduce(
    (sum, e) => sum + (e.amount || 0),
    evTirePerYear
  );

  // Total annual costs
  const gasCostPerYear = gasEnergyPerYear + gasFixedPerYear;
  const evCostPerYear = evEnergyPerYear + evFixedPerYear;

  // Savings & price difference
  const savingsPerYear = gasCostPerYear - evCostPerYear;
  const priceDifference = params.evPrice - params.gasPrice;

  let breakEvenYears = Infinity;
  let breakEvenDistanceKm = Infinity;

  if (savingsPerYear > 0) {
    breakEvenYears = priceDifference / savingsPerYear;
    breakEvenDistanceKm = breakEvenYears * annualKm;
  }

  // Chart data setup (0 to 25 years max)
  const chartData: EVBreakEvenChartPoint[] = [];
  const calculatedMaxYears = Math.max(10, Math.ceil(breakEvenYears * 1.5) || 10);
  const maxYears = Math.min(calculatedMaxYears, 25);

  for (let i = 0; i <= maxYears; i++) {
    chartData.push({
      year: i,
      gasBase: params.gasPrice,
      gasEnergy: Math.round(gasEnergyPerYear * i),
      gasFixed: Math.round(gasFixedPerYear * i),
      gasTotal: Math.round(params.gasPrice + (gasEnergyPerYear + gasFixedPerYear) * i),

      evBase: params.evPrice,
      evEnergy: Math.round(evEnergyPerYear * i),
      evFixed: Math.round(evFixedPerYear * i),
      evTotal: Math.round(params.evPrice + (evEnergyPerYear + evFixedPerYear) * i),
    });
  }

  return {
    gasCostPerYear,
    evCostPerYear,
    savingsPerYear,
    priceDifference,
    breakEvenDistanceKm,
    breakEvenYears,
    chartData,
    breakdown: {
      gas: {
        energy: gasEnergyPerYear,
        expenses: gasFixedPerYear,
        total: gasCostPerYear,
      },
      ev: {
        energy: evEnergyPerYear,
        expenses: evFixedPerYear,
        total: evCostPerYear,
      },
    },
  };
}
