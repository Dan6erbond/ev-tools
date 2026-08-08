"use client";

import type { ReactNode } from "react";
import { UserVehicle } from "@/lib/types";
import { useSettings } from "@/components/settings-context";
import { convertEfficiency, formatEfficiency } from "@/lib/units";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Car } from "lucide-react";
import Link from "next/link";

export interface ActiveVehicleBannerProps {
  activeVehicle: UserVehicle | null;
  batteryKwh: number;
  showEfficiency?: boolean;
  actions?: ReactNode;
}

export function ActiveVehicleBanner({
  activeVehicle,
  batteryKwh,
  showEfficiency = true,
  actions,
}: ActiveVehicleBannerProps) {
  const { settings } = useSettings();

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl border bg-muted/40 backdrop-blur-xs">
      {activeVehicle ? (
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
            <Car className="size-5" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm">{activeVehicle.name}</span>
              <Badge variant="outline" className="text-[10px] py-0 border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
                Active EV
              </Badge>
            </div>
            <span className="text-xs text-muted-foreground font-mono">
              {batteryKwh} kWh Usable Battery
              {showEfficiency && activeVehicle && (
                <>
                  {" · "}
                  {formatEfficiency(
                    convertEfficiency(
                      activeVehicle.efficiencyValue,
                      activeVehicle.efficiencyUnit,
                      settings.efficiencyUnit
                    ),
                    settings.efficiencyUnit
                  )}
                </>
              )}
            </span>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between w-full sm:w-auto gap-4">
          <div className="flex items-center gap-3">
            <Car className="size-5 text-muted-foreground shrink-0" />
            <div className="flex flex-col">
              <span className="font-semibold text-sm">No Active Vehicle Selected</span>
              <span className="text-xs text-muted-foreground font-mono">
                Using default specs: {batteryKwh} kWh Usable Battery
                {showEfficiency && ` · ${formatEfficiency(18.0, settings.efficiencyUnit)}`}
              </span>
            </div>
          </div>
          {!actions && (
            <Button variant="outline" size="sm" render={<Link href="/profile" />} className="h-7 text-xs">
              Add EV to Garage
            </Button>
          )}
        </div>
      )}

      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
