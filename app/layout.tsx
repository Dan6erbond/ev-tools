import { Geist_Mono, Inter, Outfit } from "next/font/google";
import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { SettingsProvider } from "@/components/settings-context";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppSidebar } from "@/components/app-sidebar";
import { AppHeader } from "@/components/app-header";
import { cn } from "@/lib/utils";
import { NuqsAdapter } from "nuqs/adapters/next/app";

const outfitHeading = Outfit({ subsets: ["latin"], variable: "--font-heading" });
const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://dan6erbond.github.io/ev-tools"),
  title: {
    default: "EV Tools - Online Utilities for Electric Vehicle Owners",
    template: "%s | EV Tools",
  },
  description:
    "Free, open-source collection of online tools and utilities for Electric Vehicle (EV) owners. Calculate detour charger savings, trip energy costs, charging curves, and consumption conversions.",
  keywords: [
    "EV tools",
    "electric vehicle calculator",
    "detour charger savings",
    "EV charger calculator",
    "EV trip cost calculator",
    "EV charging time estimator",
    "EV consumption unit converter",
    "kWh/100km to mi/kWh converter",
    "it-tools for EV",
    "electric car utilities",
    "Tesla calculator",
    "BMW i4 calculator",
    "Hyundai Ioniq 5 calculator",
    "EV battery calculator",
  ],
  authors: [{ name: "EV Tools Community", url: "https://github.com/Dan6erbond/ev-tools" }],
  creator: "Dan6erbond",
  publisher: "EV Tools",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "./",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://dan6erbond.github.io/ev-tools",
    title: "EV Tools - Online Utilities for Electric Vehicle Owners",
    description:
      "Free, open-source collection of online tools and utilities for Electric Vehicle (EV) owners. Calculate detour charger savings, trip energy costs, charging curves, and consumption conversions.",
    siteName: "EV Tools",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "EV Tools - Online Utilities for Electric Vehicle Owners",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "EV Tools - Online Utilities for Electric Vehicle Owners",
    description:
      "Free, open-source collection of online tools and utilities for Electric Vehicle (EV) owners.",
    creator: "@evtools",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.webmanifest",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "EV Tools",
  url: "https://dan6erbond.github.io/ev-tools",
  description: "Free, open-source collection of online tools and utilities for Electric Vehicle (EV) owners.",
  applicationCategory: "UtilityApplication",
  operatingSystem: "All",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  author: {
    "@type": "Organization",
    name: "EV Tools Community",
    url: "https://github.com/Dan6erbond/ev-tools",
  },
};

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
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        <NuqsAdapter>
          <ThemeProvider>
            <SettingsProvider>
              <TooltipProvider>
                <SidebarProvider>
                  <AppSidebar />
                  <SidebarInset className="flex flex-col min-h-svh peer-data-[variant=inset]:min-h-[calc(100svh-1rem)]">
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


