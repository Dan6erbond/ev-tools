import { Geist_Mono, Inter, Outfit } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { SettingsProvider } from "@/components/settings-context";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppSidebar } from "@/components/app-sidebar";
import { AppHeader } from "@/components/app-header";
import { cn } from "@/lib/utils";

const outfitHeading = Outfit({ subsets: ["latin"], variable: "--font-heading" });
const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata = {
  title: "EV Tools - Online Utilities for Electric Vehicle Owners",
  description:
    "Open-source calculators and utilities for EV owners. Calculate detour charger savings, trip energy costs, consumption unit conversions, and battery stats.",
};

import { NuqsAdapter } from "nuqs/adapters/next/app";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("antialiased", fontMono.variable, "font-sans", inter.variable, outfitHeading.variable)}
    >
      <body>
        <NuqsAdapter>
          <ThemeProvider>
            <SettingsProvider>
            <TooltipProvider>
              <SidebarProvider>
                <AppSidebar />
                <SidebarInset className="flex flex-col min-h-screen">
                  <AppHeader />
                  <main className="flex-1 bg-background">{children}</main>
                  <footer className="border-t py-6 text-center text-xs text-muted-foreground">
                    <div className="container max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 px-4">
                      <span>© {new Date().getFullYear()} EV Tools. Open source for EV owners.</span>
                      <div className="flex items-center gap-4">
                        <span>Built with Next.js, Shadcn & Tailwind CSS</span>
                      </div>
                    </div>
                  </footer>
                </SidebarInset>
              </SidebarProvider>
            </TooltipProvider>
          </SettingsProvider>
        </ThemeProvider>
        </NuqsAdapter>
      </body>
    </html>
  );
}
