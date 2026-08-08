import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Vehicle Garage & Unit Preferences",
  description:
    "Configure your electric vehicles, usable battery capacities, default consumption efficiency, and currency & unit formatting preferences across EV Tools.",
  openGraph: {
    title: "Vehicle Garage & Unit Preferences | EV Tools",
    description:
      "Configure your electric vehicles, usable battery capacities, default consumption efficiency, and currency & unit formatting preferences across EV Tools.",
  },
};

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
