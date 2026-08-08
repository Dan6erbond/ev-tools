import { Tool } from "../types";

export const TOOLS_REGISTRY: Tool[] = [
  {
    id: "detour-calculator",
    name: "Detour Charger Savings Calculator",
    description: "Calculate if driving out of your way to a cheaper charger actually saves money after extra energy cost, find break-even kWh, and total savings.",
    category: "Charging & Savings",
    iconName: "Zap",
    keywords: ["charger", "cheaper", "detour", "savings", "calculator", "break-even", "kwh", "price", "distance", "charging", "i4", "alfa"],
    featured: true,
    implemented: true,
  },
  {
    id: "charging-time-estimator",
    name: "Charging Time & Curve Estimator",
    description: "Estimate charging duration from X% to Y% based on charger peak kW, battery capacity, and charging curve.",
    category: "Charging & Savings",
    iconName: "BatteryCharging",
    keywords: ["charging time", "kw", "fast charger", "dc fast", "soc", "duration"],
    featured: false,
    implemented: false,
  },
  {
    id: "trip-cost-calculator",
    name: "EV Trip Cost Calculator",
    description: "Calculate total cost and energy needed for long road trips based on distance, driving speed, and charging stops.",
    category: "Trips & Range",
    iconName: "Route",
    keywords: ["trip", "roadtrip", "cost", "distance", "highway", "consumption"],
    featured: false,
    implemented: false,
  },
  {
    id: "unit-converter",
    name: "EV Consumption Unit Converter",
    description: "Convert between kWh/100km, mi/kWh, Wh/km, km/kWh, Wh/mi, and MPGe instantaneously.",
    category: "Utilities",
    iconName: "Calculator",
    keywords: ["converter", "efficiency", "units", "wh/km", "mi/kwh", "kwh/100km"],
    featured: false,
    implemented: false,
  },
];

export function getAllTools(): Tool[] {
  return TOOLS_REGISTRY;
}

export function getToolBySlug(slug: string): Tool | undefined {
  return TOOLS_REGISTRY.find((tool) => tool.id === slug);
}

export function getToolsByCategory(category: string): Tool[] {
  return TOOLS_REGISTRY.filter((tool) => tool.category === category);
}

export function searchTools(query: string): Tool[] {
  const q = query.toLowerCase().trim();
  if (!q) return TOOLS_REGISTRY;
  return TOOLS_REGISTRY.filter(
    (tool) =>
      tool.name.toLowerCase().includes(q) ||
      tool.description.toLowerCase().includes(q) ||
      tool.keywords.some((k) => k.toLowerCase().includes(q))
  );
}
